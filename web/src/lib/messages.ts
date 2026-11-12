import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { UserError } from "./errors";
import { messageEmail, sendEmail } from "./email";
import { appUrl } from "./stripe";

// Mensajes entre usuarios. Hay una conversación por anuncio y persona interesada:
// sirve para preguntar antes de reservar y es también el chat de sus reservas.

export class MessageError extends UserError {}

export const MAX_LENGTH = 2000;
const BURST = { count: 30, minutes: 10 }; // mensajes por persona
const NEW_CONVERSATIONS_PER_DAY = 20; // conversaciones nuevas por persona

type Side = "owner" | "renter";
const sideOf = (c: { ownerId: string; renterId: string }, userId: string): Side | null =>
  c.ownerId === userId ? "owner" : c.renterId === userId ? "renter" : null;

function cleanBody(body: string) {
  const text = body.replace(/\r\n/g, "\n").trim();
  if (!text) throw new MessageError("Escribe un mensaje");
  if (text.length > MAX_LENGTH) throw new MessageError(`El mensaje es demasiado largo (máximo ${MAX_LENGTH} caracteres)`);
  return text;
}

async function checkBurst(userId: string) {
  const since = new Date(Date.now() - BURST.minutes * 60_000);
  const n = await db.message.count({ where: { senderId: userId, createdAt: { gte: since } } });
  if (n >= BURST.count) throw new MessageError("Has enviado muchos mensajes seguidos. Espera unos minutos.");
}

/** Abre (o reutiliza) la conversación con el propietario de un anuncio y envía el primer mensaje. */
export async function contactOwner(userId: string, listingId: string, body: string) {
  const text = cleanBody(body);
  const listing = await db.listing.findUnique({ where: { id: listingId }, select: { ownerId: true, status: true } });
  if (!listing || listing.status === "deleted") throw new MessageError("Este anuncio ya no está disponible");
  if (listing.ownerId === userId) throw new MessageError("Este anuncio es tuyo");
  let conv = await db.conversation.findUnique({ where: { listingId_renterId: { listingId, renterId: userId } } });
  if (!conv) {
    if (listing.status !== "active") throw new MessageError("Este anuncio está en pausa");
    const today = await db.conversation.count({ where: { renterId: userId, createdAt: { gte: new Date(Date.now() - 86_400_000) } } });
    if (today >= NEW_CONVERSATIONS_PER_DAY) throw new MessageError("Has escrito a muchos anunciantes hoy. Vuelve a intentarlo mañana.");
    try {
      conv = await db.conversation.create({ data: { listingId, ownerId: listing.ownerId, renterId: userId } });
    } catch (e) {
      // Dos envíos a la vez: la otra petición ya la ha creado.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
      conv = await db.conversation.findUniqueOrThrow({ where: { listingId_renterId: { listingId, renterId: userId } } });
    }
  }
  return sendMessage(userId, conv.id, text);
}

/** La conversación que corresponde a una reserva (la crea si aún no existe). */
export async function conversationForBooking(userId: string, bookingId: string) {
  const b = await db.booking.findUnique({ where: { id: bookingId }, select: { listingId: true, ownerId: true, renterId: true } });
  if (!b || (b.ownerId !== userId && b.renterId !== userId)) throw new MessageError("Reserva no encontrada");
  return db.conversation.upsert({
    where: { listingId_renterId: { listingId: b.listingId, renterId: b.renterId } },
    create: { listingId: b.listingId, ownerId: b.ownerId, renterId: b.renterId },
    update: {},
  });
}

export async function sendMessage(userId: string, conversationId: string, body: string, bookingId?: string) {
  const text = cleanBody(body);
  const conv = await db.conversation.findUnique({ where: { id: conversationId }, include: { listing: { select: { status: true } } } });
  const side = conv && sideOf(conv, userId);
  if (!conv || !side) throw new MessageError("Conversación no encontrada");
  if (conv.listing.status === "deleted") throw new MessageError("Este anuncio se ha eliminado y ya no admite mensajes");
  await checkBurst(userId);
  const now = new Date();
  const [message] = await db.$transaction([
    db.message.create({ data: { conversationId, senderId: userId, body: text, bookingId, createdAt: now } }),
    db.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now, lastSenderId: userId, ...(side === "owner" ? { ownerReadAt: now } : { renterReadAt: now }) },
    }),
  ]);
  // El aviso por email no debe retrasar ni romper el envío.
  const notified = notify(conversationId, side === "owner" ? "renter" : "owner").catch((e) => {
    console.error("Aviso por email fallido", e);
    return false;
  });
  return { message, conversationId, notified };
}

/**
 * Avisa por email a quien recibe el mensaje, pero solo una vez hasta que lo lea:
 * si le escriben diez mensajes seguidos, recibe un único email.
 */
export async function notify(conversationId: string, to: Side): Promise<boolean> {
  const f = db.conversation.fields;
  const now = new Date();
  const claim =
    to === "owner"
      ? { OR: [{ ownerEmailedAt: null }, { ownerEmailedAt: { lte: f.ownerReadAt } }] }
      : { OR: [{ renterEmailedAt: null }, { renterEmailedAt: { lte: f.renterReadAt } }] };
  const { count } = await db.conversation.updateMany({
    where: { id: conversationId, ...claim },
    data: to === "owner" ? { ownerEmailedAt: now } : { renterEmailedAt: now },
  });
  if (count === 0) return false;
  const c = await db.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: {
      listing: { select: { title: true } },
      owner: { select: { name: true, email: true } },
      renter: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true } },
    },
  });
  const [recipient, sender] = to === "owner" ? [c.owner, c.renter] : [c.renter, c.owner];
  return sendEmail(
    recipient.email,
    messageEmail({
      toName: recipient.name.split(" ")[0],
      fromName: sender.name.split(" ")[0],
      listingTitle: c.listing.title,
      preview: c.messages[0]?.body ?? "",
      url: `${appUrl()}/mensajes/${c.id}`,
    }),
  );
}

/** Conversación con sus mensajes, solo para sus dos participantes. Al abrirla, queda leída. */
export async function openConversation(userId: string, conversationId: string) {
  const c = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: { select: { id: true, title: true, pricePerDayCents: true, status: true, city: true, photos: { take: 1, orderBy: { position: "asc" } } } },
      owner: { select: { id: true, name: true, kycStatus: true } },
      renter: { select: { id: true, name: true, kycStatus: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 500 },
    },
  });
  const side = c && sideOf(c, userId);
  if (!c || !side) return null;
  await markRead(userId, c);
  const bookings = await db.booking.findMany({
    where: { listingId: c.listingId, renterId: c.renterId },
    select: { id: true, status: true, startDate: true, endDate: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
  return { ...c, side, other: side === "owner" ? c.renter : c.owner, bookings };
}

type ReadState = { id: string; ownerId: string; renterId: string; lastSenderId: string | null; lastMessageAt: Date; ownerReadAt: Date | null; renterReadAt: Date | null };

/** Marca la conversación como leída por esta persona (si tenía algo sin leer). */
export async function markRead(userId: string, c: ReadState) {
  const side = sideOf(c, userId);
  if (!side || !c.lastSenderId || c.lastSenderId === userId) return;
  const readAt = side === "owner" ? c.ownerReadAt : c.renterReadAt;
  if (readAt && readAt >= c.lastMessageAt) return;
  await db.conversation.update({ where: { id: c.id }, data: side === "owner" ? { ownerReadAt: new Date() } : { renterReadAt: new Date() } });
}

const unreadWhere = (userId: string): Prisma.ConversationWhereInput => {
  const f = db.conversation.fields;
  return {
    lastSenderId: { not: userId },
    OR: [
      { ownerId: userId, OR: [{ ownerReadAt: null }, { ownerReadAt: { lt: f.lastMessageAt } }] },
      { renterId: userId, OR: [{ renterReadAt: null }, { renterReadAt: { lt: f.lastMessageAt } }] },
    ],
  };
};

export const unreadCount = (userId: string) => db.conversation.count({ where: unreadWhere(userId) });

export async function inbox(userId: string) {
  const [list, unread] = await Promise.all([
    db.conversation.findMany({
      where: { OR: [{ ownerId: userId }, { renterId: userId }], lastSenderId: { not: null } },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      include: {
        listing: { select: { id: true, title: true, photos: { take: 1, orderBy: { position: "asc" } } } },
        owner: { select: { id: true, name: true } },
        renter: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, senderId: true } },
      },
    }),
    db.conversation.findMany({ where: unreadWhere(userId), select: { id: true } }),
  ]);
  const unreadIds = new Set(unread.map((u) => u.id));
  return list.map((c) => ({
    id: c.id,
    listing: c.listing,
    other: c.ownerId === userId ? c.renter : c.owner,
    asOwner: c.ownerId === userId,
    last: c.messages[0],
    lastMessageAt: c.lastMessageAt,
    unread: unreadIds.has(c.id),
  }));
}
