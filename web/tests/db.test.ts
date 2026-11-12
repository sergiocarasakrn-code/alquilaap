// Pruebas contra una base de datos PostgreSQL real (TEST_DATABASE_URL). Se saltan si no está configurada.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { actOnBooking, createBooking, leaveReview } from "@/lib/bookings";
import { activatePackPurchase, handleStripeEvent } from "@/lib/payments";
import { searchListings } from "@/lib/listings";
import type Stripe from "stripe";

const enabled = !!process.env.TEST_DATABASE_URL;
const day = (offset: number) => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offset));
};
const tag = `t${Date.now()}`;

describe.skipIf(!enabled)("reservas en base de datos", () => {
  let owner: { id: string }, renter: { id: string }, other: { id: string }, listing: { id: string };

  beforeAll(async () => {
    const mk = (n: string) => db.user.create({ data: { email: `${n}-${tag}@test.es`, name: n, passwordHash: "x", kycStatus: "verified" } });
    [owner, renter, other] = await Promise.all([mk("owner"), mk("renter"), mk("other")]);
    listing = await db.listing.create({
      data: { ownerId: owner.id, title: `Bici ${tag}`, description: "Bici de prueba para tests", category: "bicis", city: "Valencia", citySlug: "valencia", pricePerDayCents: 1500 },
    });
  });
  afterAll(() => db.$disconnect());

  it("flujo completo con doble confirmación y reseñas", async () => {
    let b = await createBooking(renter.id, { listingId: listing.id, start: day(1), end: day(3), insurance: true });
    expect(b.status).toBe("requested");
    expect(b.priceCents).toBe(4500);
    expect(b.insuranceCents).toBe(315);
    b = await actOnBooking(owner.id, b.id, "accept", b.version);
    b = await actOnBooking(owner.id, b.id, "pickup", b.version);
    expect(b.status).toBe("accepted");
    b = await actOnBooking(renter.id, b.id, "pickup", b.version);
    expect(b.status).toBe("in_progress");
    await expect(leaveReview(renter.id, b.id, 5, "Genial")).rejects.toThrow(/finalizado/);
    b = await actOnBooking(renter.id, b.id, "return_ok", b.version);
    b = await actOnBooking(owner.id, b.id, "return_ok", b.version);
    expect(b.status).toBe("completed");
    await leaveReview(renter.id, b.id, 5, "Genial");
    await expect(leaveReview(renter.id, b.id, 4, "otra")).rejects.toThrow(/Ya has valorado/);
    const events = await db.bookingEvent.findMany({ where: { bookingId: b.id }, orderBy: { createdAt: "asc" } });
    expect(events.map((e) => e.type)).toEqual(["created", "accept", "pickup", "pickup_both", "return_ok", "completed"]);
  });

  it("rechaza una versión antigua (dos personas tocando a la vez)", async () => {
    const b = await createBooking(renter.id, { listingId: listing.id, start: day(10), end: day(11), insurance: false });
    await actOnBooking(owner.id, b.id, "accept", b.version);
    await expect(actOnBooking(renter.id, b.id, "cancel", b.version)).rejects.toThrow(/ha cambiado/);
  });

  it("la base de datos impide aceptar dos reservas solapadas", async () => {
    const a = await createBooking(renter.id, { listingId: listing.id, start: day(20), end: day(22), insurance: false });
    const c = await createBooking(other.id, { listingId: listing.id, start: day(22), end: day(24), insurance: false });
    await actOnBooking(owner.id, a.id, "accept", a.version);
    await expect(actOnBooking(owner.id, c.id, "accept", c.version)).rejects.toThrow(/otra reserva/);
    // Y aunque la app se saltase la comprobación, la restricción de PostgreSQL lo bloquea:
    await expect(db.booking.update({ where: { id: c.id }, data: { status: "accepted" } })).rejects.toThrow(/booking_no_overlap/);
    await expect(createBooking(other.id, { listingId: listing.id, start: day(21), end: day(21), insurance: false })).rejects.toThrow(/reservadas/);
  });

  it("la verificación es opcional, salvo que el anuncio la exija; nadie reserva su propio anuncio", async () => {
    const u = await db.user.create({ data: { email: `nokyc-${tag}@test.es`, name: "x", passwordHash: "x" } });
    const b = await createBooking(u.id, { listingId: listing.id, start: day(40), end: day(41), insurance: false });
    expect(b.status).toBe("requested");
    const strict = await db.listing.create({
      data: { ownerId: owner.id, title: `Estricto ${tag}`, description: "Solo verificados", category: "bicis", city: "Valencia", citySlug: "valencia", pricePerDayCents: 1000, verifiedOnly: true },
    });
    await expect(createBooking(u.id, { listingId: strict.id, start: day(40), end: day(41), insurance: false })).rejects.toThrow(/verificad/);
    expect((await createBooking(renter.id, { listingId: strict.id, start: day(40), end: day(41), insurance: false })).status).toBe("requested");
    await expect(createBooking(owner.id, { listingId: listing.id, start: day(40), end: day(41), insurance: false })).rejects.toThrow(/propio/);
  });

  it("los packs se activan una sola vez y el anuncio sube en la búsqueda", async () => {
    const p = await db.packPurchase.create({ data: { listingId: listing.id, userId: owner.id, packCode: "pro", amountCents: 699, idempotencyKey: `k-${tag}` } });
    expect(await activatePackPurchase(p.id)).toBe(true);
    expect(await activatePackPurchase(p.id)).toBe(false);
    const res = await searchListings({ citySlug: "valencia", category: "bicis" });
    expect(res.items[0].id).toBe(listing.id);
    expect(res.items[0].featured).toBe(true);
  });

  it("un aviso repetido de Stripe se procesa una sola vez", async () => {
    const p = await db.packPurchase.create({ data: { listingId: listing.id, userId: owner.id, packCode: "basico", amountCents: 199, idempotencyKey: `k2-${tag}` } });
    const ev = {
      id: `evt_${tag}`,
      type: "checkout.session.completed",
      data: { object: { metadata: { kind: "pack", purchaseId: p.id }, payment_status: "paid" } },
    } as unknown as Stripe.Event;
    expect(await handleStripeEvent(ev)).toBe("ok");
    expect(await handleStripeEvent(ev)).toBe("duplicate");
    expect((await db.packPurchase.findUniqueOrThrow({ where: { id: p.id } })).status).toBe("paid");
  });

  it("filtra por provincia y por distancia", async () => {
    const l = await db.listing.create({
      data: { ownerId: owner.id, title: `Kayak ${tag}`, description: "Kayak doble para pruebas", category: "deportes", subcategory: "kayak-y-paddle-surf", city: "Castelldefels", citySlug: "castelldefels", lat: 41.28, lng: 1.98, pricePerDayCents: 2000 },
    });
    const bcn = { lat: 41.3874, lng: 2.1686 };
    const ids = async (p: Parameters<typeof searchListings>[0]) => (await searchListings(p)).items.map((i) => i.id);
    expect(await ids({ q: tag, center: bcn, km: 10 })).not.toContain(l.id);
    const near = await searchListings({ q: tag, center: bcn, km: 25 });
    expect(near.items.map((i) => i.id)).toContain(l.id);
    expect(Math.round(near.items.find((i) => i.id === l.id)!.distanceKm!)).toBeGreaterThan(15);
    expect(await ids({ q: tag, placeSlugs: ["barcelona", "castelldefels"] })).toContain(l.id);
    expect(await ids({ q: tag, placeSlugs: ["valencia"] })).not.toContain(l.id);
    expect(await ids({ q: tag, category: "deportes", subcategory: "kayak-y-paddle-surf" })).toEqual([l.id]);
    expect(await ids({ q: tag, category: "deportes", subcategory: "golf" })).toEqual([]);
  });
});
