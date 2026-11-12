import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { UserError } from "./errors";
import { deleteStored } from "./storage";
import { stripe, stripeEnabled } from "./stripe";

export class AccountError extends UserError {}

const ACTIVE = ["accepted", "in_progress", "incident"] as const;

/**
 * Borra la cuenta: elimina los datos personales, los documentos de identidad y los anuncios,
 * cancela las solicitudes pendientes y cierra todas las sesiones.
 * Se conserva, sin datos personales, el historial de reservas, mensajes y reseñas que también es de la otra persona.
 * La huella cifrada del DNI solo se guarda si hubo una incidencia (prevención del fraude).
 */
export async function deleteAccount(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, include: { subscription: true } });
  if (user.deletedAt) return;
  const active = await db.booking.count({ where: { status: { in: [...ACTIVE] }, OR: [{ ownerId: userId }, { renterId: userId }] } });
  if (active > 0)
    throw new AccountError("Tienes reservas aceptadas o en curso. Termínalas (o cancélalas) antes de borrar la cuenta.");
  const hadIncident = (await db.booking.count({ where: { incidentAt: { not: null }, OR: [{ ownerId: userId }, { renterId: userId }] } })) > 0;
  const photos = await db.listingPhoto.findMany({ where: { listing: { ownerId: userId } }, select: { url: true } });
  const now = new Date();

  await db.$transaction([
    db.booking.updateMany({ where: { renterId: userId, status: "requested" }, data: { status: "cancelled", version: { increment: 1 } } }),
    db.booking.updateMany({ where: { ownerId: userId, status: "requested" }, data: { status: "declined", version: { increment: 1 } } }),
    db.listing.updateMany({ where: { ownerId: userId }, data: { status: "deleted" } }),
    db.listingPhoto.deleteMany({ where: { listing: { ownerId: userId } } }),
    db.session.deleteMany({ where: { userId } }),
    db.user.update({
      where: { id: userId },
      data: {
        deletedAt: now,
        email: `borrada-${userId}@alquilaap.invalid`,
        name: "Usuario eliminado",
        passwordHash: `!${randomBytes(16).toString("hex")}`, // no corresponde a ninguna contraseña
        legalName: null,
        birthDate: null,
        phone: null,
        address: null,
        kycDocumentUrl: null,
        kycSelfieUrl: null,
        idNumberHash: hadIncident ? user.idNumberHash : null,
        idNumberLast4: null,
      },
    }),
  ]);

  // Archivos y suscripción: después de la transacción y sin bloquear el borrado si algo falla.
  await Promise.allSettled([user.kycDocumentUrl, user.kycSelfieUrl, ...photos.map((p) => p.url)].map((r) => deleteStored(r)));
  const subId = user.subscription?.stripeSubscriptionId;
  if (subId && stripeEnabled() && user.subscription?.status !== "canceled") {
    await stripe()
      .subscriptions.cancel(subId)
      .catch((e) => console.error("No se pudo cancelar la suscripción al borrar la cuenta", e));
  }
}
