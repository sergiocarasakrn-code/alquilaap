import "server-only";
import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { db } from "./db";
import { UserError } from "./errors";
import { PACKS, PRO_PLAN, type PackCode } from "./config";
import { appUrl, devPaymentsAllowed, stripe, stripeEnabled } from "./stripe";

export class PaymentError extends UserError {}

/**
 * Inicia la compra de un pack. Idempotente: la misma idempotencyKey (un clic repetido, una recarga)
 * reutiliza la misma compra y la misma sesión de Stripe, así nunca se cobra dos veces.
 */
export async function startPackPurchase(userId: string, listingId: string, packCode: PackCode, idempotencyKey: string) {
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.ownerId !== userId || listing.status === "deleted") throw new PaymentError("Anuncio no encontrado");
  const pack = PACKS[packCode];

  let purchase = await db.packPurchase.findUnique({ where: { idempotencyKey } });
  if (purchase && (purchase.userId !== userId || purchase.listingId !== listingId)) throw new PaymentError("Clave de compra no válida");
  if (!purchase) {
    try {
      purchase = await db.packPurchase.create({ data: { listingId, userId, packCode, amountCents: pack.priceCents, idempotencyKey } });
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
      purchase = await db.packPurchase.findUniqueOrThrow({ where: { idempotencyKey } });
    }
  }
  if (purchase.status === "paid") return `${appUrl()}/mis-anuncios?pagado=${purchase.id}`;

  if (!stripeEnabled()) {
    if (!devPaymentsAllowed()) throw new PaymentError("Los pagos no están disponibles ahora mismo");
    return `${appUrl()}/pago-simulado?compra=${purchase.id}`;
  }
  const session = await stripe().checkout.sessions.create(
    {
      mode: "payment",
      customer: await ensureCustomer(userId),
      line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: pack.priceCents, product_data: { name: `${pack.name}: ${listing.title}` } } }],
      metadata: { kind: "pack", purchaseId: purchase.id },
      success_url: `${appUrl()}/mis-anuncios?pagado=${purchase.id}`,
      cancel_url: `${appUrl()}/destacar/${listingId}`,
    },
    { idempotencyKey: `pack-${purchase.id}` },
  );
  await db.packPurchase.update({ where: { id: purchase.id }, data: { stripeSessionId: session.id } });
  return session.url!;
}

/** Activa un pack pagado. Solo pasa de pending a paid una vez, aunque Stripe repita el aviso. */
export async function activatePackPurchase(purchaseId: string, now = new Date()) {
  const p = await db.packPurchase.findUnique({ where: { id: purchaseId } });
  if (!p) return false;
  const hours = PACKS[p.packCode as PackCode]?.hours ?? 0;
  const res = await db.packPurchase.updateMany({
    where: { id: purchaseId, status: "pending" },
    data: { status: "paid", startsAt: now, endsAt: new Date(now.getTime() + hours * 3_600_000) },
  });
  return res.count === 1;
}

async function ensureCustomer(userId: string) {
  const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (u.stripeCustomerId) return u.stripeCustomerId;
  const c = await stripe().customers.create({ email: u.email, name: u.name, metadata: { userId } }, { idempotencyKey: `customer-${userId}` });
  await db.user.update({ where: { id: userId }, data: { stripeCustomerId: c.id } });
  return c.id;
}

export async function startProCheckout(userId: string) {
  if (!stripeEnabled()) {
    if (!devPaymentsAllowed()) throw new PaymentError("Los pagos no están disponibles ahora mismo");
    await setSubscription(userId, { status: "active", stripeSubscriptionId: null, currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000) });
    return `${appUrl()}/perfil?pro=1`;
  }
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: await ensureCustomer(userId),
    line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: PRO_PLAN.priceCents, recurring: { interval: "month" }, product_data: { name: PRO_PLAN.name } } }],
    metadata: { kind: "pro", userId },
    subscription_data: { metadata: { userId } },
    success_url: `${appUrl()}/perfil?pro=1`,
    cancel_url: `${appUrl()}/pro`,
  });
  return session.url!;
}

async function setSubscription(userId: string, data: { status: string; stripeSubscriptionId: string | null; currentPeriodEnd: Date | null }) {
  await db.subscription.upsert({ where: { userId }, create: { userId, ...data }, update: data });
}

/** Procesa un evento de Stripe una sola vez (el id del evento se guarda en la misma transacción). */
export async function handleStripeEvent(event: Stripe.Event) {
  try {
    await db.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return "duplicate";
    throw e;
  }
  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.metadata?.kind === "pack" && s.payment_status === "paid" && s.metadata.purchaseId) await activatePackPurchase(s.metadata.purchaseId);
      if (s.metadata?.kind === "pro" && s.metadata.userId && typeof s.subscription === "string") {
        const sub = await stripe().subscriptions.retrieve(s.subscription);
        await syncSubscription(sub);
      }
    }
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await syncSubscription(event.data.object as Stripe.Subscription);
    }
    return "ok";
  } catch (e) {
    // Si falla, borramos la marca para que el reintento de Stripe lo vuelva a procesar.
    await db.stripeEvent.delete({ where: { id: event.id } }).catch(() => {});
    throw e;
  }
}

async function syncSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) return;
  const end = sub.current_period_end;
  const status = sub.status === "active" || sub.status === "trialing" ? "active" : sub.status;
  await setSubscription(userId, { status, stripeSubscriptionId: sub.id, currentPeriodEnd: end ? new Date(end * 1000) : null });
}
