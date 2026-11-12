import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { UserError } from "./errors";
import { isProUser } from "./auth";
import { quote } from "./pricing";
import { todayUTC } from "./format";
import { BookingRuleError, transition, type Action, type Role } from "./booking-rules";

export class BookingError extends UserError {}

const MAX_DAYS = 60;

const isOverlapError = (e: unknown) => e instanceof Error && e.message.includes("booking_no_overlap");

async function overlaps(tx: Prisma.TransactionClient, listingId: string, start: Date, end: Date) {
  const n = await tx.booking.count({
    where: { listingId, status: { in: ["accepted", "in_progress", "incident"] }, startDate: { lte: end }, endDate: { gte: start } },
  });
  return n > 0;
}

export async function createBooking(userId: string, input: { listingId: string; start: Date; end: Date; insurance: boolean }) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.kycStatus !== "verified") throw new BookingError("Verifica tu identidad antes de reservar");
  const listing = await db.listing.findUnique({ where: { id: input.listingId }, include: { owner: { include: { subscription: true } } } });
  if (!listing || listing.status !== "active") throw new BookingError("Este anuncio ya no está disponible");
  if (listing.ownerId === userId) throw new BookingError("No puedes reservar tu propio anuncio");
  if (input.start < todayUTC()) throw new BookingError("La fecha de inicio ya ha pasado");
  if (input.end < input.start) throw new BookingError("La fecha de fin debe ser posterior a la de inicio");
  const q = quote(listing.pricePerDayCents, listing.depositCents, input.start, input.end, input.insurance);
  if (q.days > MAX_DAYS) throw new BookingError(`Máximo ${MAX_DAYS} días por reserva`);

  // Alquilaap Pro: reserva inmediata, sin esperar a que el propietario acepte.
  const instant = isProUser(listing.owner);
  try {
    return await db.$transaction(async (tx) => {
      if (await overlaps(tx, listing.id, input.start, input.end)) throw new BookingError("Esas fechas ya están reservadas");
      const b = await tx.booking.create({
        data: {
          listingId: listing.id,
          renterId: userId,
          ownerId: listing.ownerId,
          startDate: input.start,
          endDate: input.end,
          days: q.days,
          priceCents: q.rentCents,
          depositCents: q.depositCents,
          insuranceCents: q.insuranceCents,
          status: instant ? "accepted" : "requested",
        },
      });
      await tx.bookingEvent.create({ data: { bookingId: b.id, actorId: userId, type: instant ? "created_instant" : "created" } });
      return b;
    });
  } catch (e) {
    if (isOverlapError(e)) throw new BookingError("Esas fechas ya están reservadas");
    throw e;
  }
}

/**
 * Aplica una acción a una reserva. Idempotente (repetir «alquilado» no hace nada) y con bloqueo optimista:
 * si la reserva cambió desde que el usuario la vio (version distinta), se rechaza para no pisar al otro usuario.
 */
export async function actOnBooking(userId: string, bookingId: string, action: Action, expectedVersion: number, incidentText?: string) {
  try {
    return await db.$transaction(async (tx) => {
      const b = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!b) throw new BookingError("Reserva no encontrada");
      const role: Role | null = b.ownerId === userId ? "owner" : b.renterId === userId ? "renter" : null;
      if (!role) throw new BookingError("Reserva no encontrada");

      const t = transition(b, role, action, new Date(), incidentText);
      if (!t.changed) return b;
      if (b.version !== expectedVersion) throw new BookingError("La reserva ha cambiado mientras la mirabas. Revisa su estado y vuelve a intentarlo.");
      if (t.patch.status === "accepted" && (await overlaps(tx, b.listingId, b.startDate, b.endDate)))
        throw new BookingError("Ya has aceptado otra reserva en esas fechas");

      const data: Prisma.BookingUpdateManyMutationInput = { ...t.patch, version: { increment: 1 } };
      if (action === "incident") data.incidentById = userId;
      const res = await tx.booking.updateMany({ where: { id: b.id, version: b.version }, data });
      if (res.count !== 1) throw new BookingError("La reserva ha cambiado mientras la mirabas. Revisa su estado y vuelve a intentarlo.");
      await tx.bookingEvent.create({ data: { bookingId: b.id, actorId: userId, type: t.event, data: { role } } });
      return tx.booking.findUniqueOrThrow({ where: { id: b.id } });
    });
  } catch (e) {
    if (e instanceof BookingRuleError) throw new BookingError(e.message);
    if (isOverlapError(e)) throw new BookingError("Ya has aceptado otra reserva en esas fechas");
    throw e;
  }
}

/** Reseña: solo cuando ambas partes han marcado «finalizado», una por persona y reserva. */
export async function leaveReview(userId: string, bookingId: string, rating: number, text: string) {
  const b = await db.booking.findUnique({ where: { id: bookingId } });
  if (!b || (b.ownerId !== userId && b.renterId !== userId)) throw new BookingError("Reserva no encontrada");
  if (b.status !== "completed") throw new BookingError("Podrás valorar cuando los dos marquéis «finalizado»");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new BookingError("Elige de 1 a 5 estrellas");
  const targetId = b.ownerId === userId ? b.renterId : b.ownerId;
  try {
    return await db.review.create({ data: { bookingId, authorId: userId, targetId, rating, text: text.trim().slice(0, 1000) } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new BookingError("Ya has valorado esta reserva");
    throw e;
  }
}
