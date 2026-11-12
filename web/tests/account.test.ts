// Borrar la cuenta, contra PostgreSQL real (TEST_DATABASE_URL). Se salta si no está configurada.
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { deleteAccount } from "@/lib/account";
import { contactOwner, sendMessage } from "@/lib/messages";

const enabled = !!process.env.TEST_DATABASE_URL;
const tag = `a${Date.now()}`;
const mk = (n: string, extra = {}) =>
  db.user.create({ data: { email: `${n}-${tag}@test.es`, name: `${n} Prueba`, passwordHash: "x", kycStatus: "verified", phone: "+34600000000", address: "Calle 1, Valencia", idNumberHash: `h-${n}-${tag}`, ...extra } });
const listingOf = (ownerId: string) =>
  db.listing.create({ data: { ownerId, title: `Cosa ${tag}`, description: "desc", category: "hogar", city: "Valencia", citySlug: "valencia", pricePerDayCents: 1000, photos: { create: [{ url: "/media/listings/00000000-0000-0000-0000-000000000000.jpg" }] } } });
const day = (n: number) => new Date(Date.UTC(2027, 0, n));

describe.skipIf(!enabled)("borrar la cuenta", () => {
  afterAll(() => db.$disconnect());

  it("borra los datos personales y los anuncios, y cancela lo pendiente", async () => {
    const u = await mk("borra");
    const other = await mk("otro");
    const mine = await listingOf(u.id);
    const theirs = await listingOf(other.id);
    await db.session.create({ data: { id: `s-${tag}`, userId: u.id, expiresAt: day(30) } });
    const asRenter = await db.booking.create({ data: { listingId: theirs.id, renterId: u.id, ownerId: other.id, startDate: day(1), endDate: day(2), days: 2, priceCents: 1, depositCents: 0 } });
    const asOwner = await db.booking.create({ data: { listingId: mine.id, renterId: other.id, ownerId: u.id, startDate: day(3), endDate: day(4), days: 2, priceCents: 1, depositCents: 0 } });
    const { conversationId } = await contactOwner(u.id, theirs.id, "Hola");

    await deleteAccount(u.id);

    const after = await db.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(after).toMatchObject({ name: "Usuario eliminado", phone: null, address: null, idNumberHash: null, legalName: null });
    expect(after.deletedAt).not.toBeNull();
    expect(after.email).not.toContain("borra-");
    expect((await db.listing.findUniqueOrThrow({ where: { id: mine.id } })).status).toBe("deleted");
    expect(await db.listingPhoto.count({ where: { listingId: mine.id } })).toBe(0);
    expect(await db.session.count({ where: { userId: u.id } })).toBe(0);
    expect((await db.booking.findUniqueOrThrow({ where: { id: asRenter.id } })).status).toBe("cancelled");
    expect((await db.booking.findUniqueOrThrow({ where: { id: asOwner.id } })).status).toBe("declined");
    // La otra persona conserva la conversación, pero ya no puede escribir.
    expect(await db.message.count({ where: { conversationId } })).toBe(1);
    await expect(sendMessage(other.id, conversationId, "¿Sigues ahí?")).rejects.toThrow(/borrado su cuenta/);
    // Borrar dos veces no falla.
    await deleteAccount(u.id);
  });

  it("no deja borrar con una reserva en curso", async () => {
    const u = await mk("encurso");
    const other = await mk("dueno2");
    const l = await listingOf(other.id);
    await db.booking.create({ data: { listingId: l.id, renterId: u.id, ownerId: other.id, startDate: day(10), endDate: day(11), days: 2, priceCents: 1, depositCents: 0, status: "in_progress" } });
    await expect(deleteAccount(u.id)).rejects.toThrow(/en curso/);
    expect((await db.user.findUniqueOrThrow({ where: { id: u.id } })).deletedAt).toBeNull();
  });

  it("si hubo una incidencia, conserva solo la huella del DNI", async () => {
    const u = await mk("incid");
    const other = await mk("dueno3");
    const l = await listingOf(other.id);
    await db.booking.create({ data: { listingId: l.id, renterId: u.id, ownerId: other.id, startDate: day(20), endDate: day(21), days: 2, priceCents: 1, depositCents: 0, status: "completed", incidentAt: day(21) } });
    await deleteAccount(u.id);
    const after = await db.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(after.idNumberHash).toBe(`h-incid-${tag}`);
    expect(after.phone).toBeNull();
  });
});
