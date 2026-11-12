// Mensajes entre usuarios, contra PostgreSQL real (TEST_DATABASE_URL). Se saltan si no está configurada.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { contactOwner, conversationForBooking, inbox, notify, openConversation, sendMessage, unreadCount } from "@/lib/messages";
import { messageEmail } from "@/lib/email";

const enabled = !!process.env.TEST_DATABASE_URL;
const tag = `m${Date.now()}`;

describe("aviso por email", () => {
  it("escapa el contenido del mensaje", () => {
    const m = messageEmail({ toName: "Ana", fromName: "<b>Eva</b>", listingTitle: "Bici", preview: "<script>x</script>", url: "https://a.es/mensajes/1" });
    expect(m.html).not.toContain("<script>");
    expect(m.html).toContain("&lt;b&gt;Eva");
    expect(m.subject).toBe("<b>Eva</b> te ha escrito sobre «Bici»");
  });
});

describe.skipIf(!enabled)("mensajes en base de datos", () => {
  let owner: { id: string }, asker: { id: string }, listing: { id: string };
  beforeAll(async () => {
    const mk = (n: string) => db.user.create({ data: { email: `${n}-${tag}@test.es`, name: `${n} Pruebas`, passwordHash: "x", kycStatus: "verified" } });
    [owner, asker] = await Promise.all([mk("dueno"), mk("pregunta")]);
    listing = await db.listing.create({
      data: { ownerId: owner.id, title: `Tabla ${tag}`, description: "Tabla de surf", category: "deportes", city: "Valencia", citySlug: "valencia", pricePerDayCents: 1500 },
    });
  });
  afterAll(() => db.$disconnect());

  it("se puede preguntar antes de reservar y se reutiliza la misma conversación", async () => {
    const a = await contactOwner(asker.id, listing.id, "  Hola, ¿está libre el sábado?  ");
    expect(a.message.body).toBe("Hola, ¿está libre el sábado?");
    const b = await contactOwner(asker.id, listing.id, "¿Y el domingo?");
    expect(b.conversationId).toBe(a.conversationId);
    await expect(contactOwner(owner.id, listing.id, "hola")).rejects.toThrow(/tuyo/);
    await expect(contactOwner(asker.id, listing.id, "   ")).rejects.toThrow(/Escribe/);
  });

  it("cuenta los no leídos y los marca como leídos al abrir", async () => {
    const conv = await db.conversation.findUniqueOrThrow({ where: { listingId_renterId: { listingId: listing.id, renterId: asker.id } } });
    expect(await unreadCount(owner.id)).toBe(1);
    expect(await unreadCount(asker.id)).toBe(0);
    const box = await inbox(owner.id);
    expect(box[0]).toMatchObject({ id: conv.id, unread: true, asOwner: true });
    const opened = await openConversation(owner.id, conv.id);
    expect(opened?.messages.map((m) => m.body)).toEqual(["Hola, ¿está libre el sábado?", "¿Y el domingo?"]);
    expect(await unreadCount(owner.id)).toBe(0);
    await sendMessage(owner.id, conv.id, "Sí, los dos días");
    expect(await unreadCount(asker.id)).toBe(1);
    expect(await openConversation((await db.user.create({ data: { email: `x-${tag}@t.es`, name: "x", passwordHash: "x" } })).id, conv.id)).toBeNull();
  });

  it("un solo email por tanda de mensajes sin leer", async () => {
    const conv = await db.conversation.findUniqueOrThrow({ where: { listingId_renterId: { listingId: listing.id, renterId: asker.id } } });
    await db.conversation.update({ where: { id: conv.id }, data: { ownerEmailedAt: null, ownerReadAt: null } });
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await notify(conv.id, "owner");
    await notify(conv.id, "owner");
    expect(log.mock.calls.filter((c) => String(c[0]).includes(`dueno-${tag}`))).toHaveLength(1);
    // Cuando lo lee, el siguiente mensaje vuelve a avisar.
    await new Promise((r) => setTimeout(r, 5));
    await db.conversation.update({ where: { id: conv.id }, data: { ownerReadAt: new Date() } });
    await notify(conv.id, "owner");
    expect(log.mock.calls.filter((c) => String(c[0]).includes(`dueno-${tag}`))).toHaveLength(2);
    log.mockRestore();
  });

  it("el chat de una reserva es la misma conversación", async () => {
    const bk = await db.booking.create({
      data: { listingId: listing.id, renterId: asker.id, ownerId: owner.id, startDate: new Date("2027-01-10"), endDate: new Date("2027-01-11"), days: 2, priceCents: 3000, depositCents: 0 },
    });
    const conv = await conversationForBooking(asker.id, bk.id);
    const before = await db.conversation.findUniqueOrThrow({ where: { listingId_renterId: { listingId: listing.id, renterId: asker.id } } });
    expect(conv.id).toBe(before.id);
    await expect(conversationForBooking((await db.user.create({ data: { email: `y-${tag}@t.es`, name: "y", passwordHash: "x" } })).id, bk.id)).rejects.toThrow(/no encontrada/);
  });

  it("frena el envío masivo (y no manda un email por cada mensaje)", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const conv = await db.conversation.findUniqueOrThrow({ where: { listingId_renterId: { listingId: listing.id, renterId: asker.id } } });
    await expect(async () => {
      for (let i = 0; i < 40; i++) await sendMessage(asker.id, conv.id, `spam ${i}`);
    }).rejects.toThrow(/muchos mensajes/);
    await new Promise((r) => setTimeout(r, 50));
    expect(log.mock.calls.filter((c) => String(c[0]).includes(`dueno-${tag}`))).toHaveLength(0);
    log.mockRestore();
  });
});
