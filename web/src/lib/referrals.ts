import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { REFERRALS, referralRewardDays } from "./config";
import { cleanReferralCode, emailKey, newReferralCode, referralRejection } from "./referral-rules";

const DAY = 86_400_000;

/** Código de invitación del usuario; se crea la primera vez que hace falta. */
export async function ensureReferralCode(userId: string) {
  const u = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } });
  if (u.referralCode) return u.referralCode;
  for (let i = 0; i < 5; i++) {
    const code = newReferralCode();
    try {
      const r = await db.user.updateMany({ where: { id: userId, referralCode: null }, data: { referralCode: code } });
      if (r.count === 1) return code;
      return (await db.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } })).referralCode!;
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e; // código repetido: probamos otro
    }
  }
  throw new Error("No se pudo crear el código de invitación");
}

/** Quién invita con este código (solo cuentas activas). */
export async function inviterByCode(code: unknown) {
  const c = cleanReferralCode(code);
  if (!c) return null;
  return db.user.findFirst({ where: { referralCode: c, deletedAt: null }, select: { id: true, name: true, email: true } });
}

/**
 * Apunta quién invitó al usuario recién registrado. Nunca lanza errores al registro: una invitación que no cuenta
 * se guarda como «rechazada» con el motivo, para que el administrador lo vea.
 */
export async function recordReferral(opts: { inviteeId: string; inviteeEmail: string; code: unknown; browserUserIds: string[] }) {
  const inviter = await inviterByCode(opts.code);
  if (!inviter || inviter.id === opts.inviteeId) return null;
  const key = emailKey(opts.inviteeEmail);
  const emailInvitedBefore = (await db.referral.count({ where: { inviteeEmailKey: key } })) > 0;
  const reason = referralRejection({
    inviterEmail: inviter.email,
    inviteeEmail: opts.inviteeEmail,
    inviterUsedThisBrowser: opts.browserUserIds.includes(inviter.id),
    emailInvitedBefore,
  });
  try {
    return await db.referral.create({
      data: { inviterId: inviter.id, inviteeId: opts.inviteeId, inviteeEmailKey: key, status: reason ? "rejected" : "pending", rejectReason: reason },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return null; // ya tenía invitación
    throw e;
  }
}

/**
 * Se llama cada vez que alguien publica (o reactiva) un anuncio. Hace todo el trabajo automático:
 * 1. Si es su primer anuncio y vino invitado, la invitación pasa a «ganada».
 * 2. Da los destacados ganados a quien le invitó.
 * 3. Da a este usuario los destacados que tuviera ganados y esperando a que tuviera un anuncio.
 */
export async function onListingPublished(userId: string, listingId: string, now = new Date()) {
  const ref = await db.referral.findUnique({ where: { inviteeId: userId } });
  if (ref && ref.status === "pending") {
    await db.referral.updateMany({
      where: { id: ref.id, status: "pending" },
      data: { status: "qualified", qualifiedAt: now, firstListingId: listingId },
    });
  }
  if (ref) await grantPendingRewards(ref.inviterId, now);
  await grantPendingRewards(userId, now);
}

/**
 * Convierte las invitaciones ganadas de un usuario en días de destacado sobre su anuncio activo.
 * Se ejecuta con un bloqueo por usuario, así dos publicaciones a la vez no dan el premio dos veces.
 * El premio se acumula: si ya tiene un destacado por invitar, los días nuevos empiezan cuando acaba el actual.
 */
export async function grantPendingRewards(inviterId: string, now = new Date()) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"referral:" + inviterId}))`;
    const waiting = await tx.referral.findMany({ where: { inviterId, status: "qualified" }, orderBy: { qualifiedAt: "asc" } });
    if (!waiting.length) return 0;
    const inviter = await tx.user.findUnique({ where: { id: inviterId }, select: { deletedAt: true } });
    if (!inviter || inviter.deletedAt) return 0;

    // Anuncio que recibe el premio: el que ya está destacado por invitar; si no, el más reciente activo.
    const current = await tx.packPurchase.findFirst({
      where: { userId: inviterId, packCode: REFERRALS.packCode, status: "paid", endsAt: { gt: now }, listing: { status: "active" } },
      orderBy: { endsAt: "desc" },
    });
    const listingId =
      current?.listingId ??
      (await tx.listing.findFirst({ where: { ownerId: inviterId, status: "active" }, orderBy: { createdAt: "desc" }, select: { id: true } }))?.id;
    if (!listingId) return 0; // sin anuncio activo: el premio espera a que publique o reactive uno

    let rewarded = await tx.referral.count({ where: { inviterId, status: "rewarded" } });
    let recent = await tx.referral.count({ where: { inviterId, status: "rewarded", rewardedAt: { gt: new Date(now.getTime() - 30 * DAY) } } });
    let start = current?.endsAt && current.endsAt > now ? current.endsAt : now;
    let granted = 0;
    for (const r of waiting) {
      if (recent >= REFERRALS.maxRewardsPer30Days) break; // tope anti-abuso: espera
      const days = referralRewardDays(rewarded + 1);
      const endsAt = new Date(start.getTime() + days * DAY);
      const moved = await tx.referral.updateMany({
        where: { id: r.id, status: "qualified" },
        data: { status: "rewarded", rewardedAt: now, rewardDays: days, rewardListingId: listingId, rewardEndsAt: endsAt },
      });
      if (moved.count !== 1) continue;
      await tx.packPurchase.create({
        data: {
          listingId,
          userId: inviterId,
          packCode: REFERRALS.packCode,
          amountCents: 0,
          status: "paid",
          idempotencyKey: `referral-${r.id}`, // único: un invitado nunca da dos premios
          startsAt: start,
          endsAt,
        },
      });
      start = endsAt;
      rewarded++;
      recent++;
      granted++;
    }
    return granted;
  });
}

/** Resumen para el perfil del usuario. */
export async function referralSummary(userId: string, now = new Date()) {
  const rows = await db.referral.findMany({
    where: { inviterId: userId },
    include: { invitee: { select: { name: true, deletedAt: true } } },
    orderBy: { createdAt: "desc" },
  });
  const active = await db.packPurchase.findFirst({
    where: { userId, packCode: REFERRALS.packCode, status: "paid", endsAt: { gt: now } },
    orderBy: { endsAt: "desc" },
    include: { listing: { select: { id: true, title: true } } },
  });
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const rewarded = count("rewarded");
  return {
    rows,
    registered: rows.filter((r) => r.status !== "rejected").length,
    waitingToPublish: count("pending"),
    waitingForListing: count("qualified"),
    rewarded,
    daysEarned: rows.reduce((s, r) => s + (r.rewardDays ?? 0), 0),
    nextIsBonus: (rewarded + 1) % REFERRALS.bonusEvery === 0,
    toNextBonus: REFERRALS.bonusEvery - (rewarded % REFERRALS.bonusEvery),
    activeUntil: active?.endsAt ?? null,
    activeListing: active?.listing ?? null,
  };
}

/** Anula una invitación (administrador): si ya dio destacado, lo termina ahora. */
export async function revokeReferral(referralId: string, now = new Date()) {
  await db.$transaction(async (tx) => {
    const r = await tx.referral.findUnique({ where: { id: referralId } });
    if (!r || r.status === "rejected") return;
    await tx.referral.update({ where: { id: r.id }, data: { status: "rejected", rejectReason: "Anulada por el administrador" } });
    const p = await tx.packPurchase.findUnique({ where: { idempotencyKey: `referral-${r.id}` } });
    if (p && p.endsAt && p.endsAt > now) {
      // Si aún no había empezado, se queda sin duración; si estaba en curso, acaba ahora.
      const end = p.startsAt && p.startsAt > now ? p.startsAt : now;
      await tx.packPurchase.update({ where: { id: p.id }, data: { endsAt: end } });
    }
  });
}
