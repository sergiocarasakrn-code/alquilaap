import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanReferralCode, newReferralCode, normalizeEmail, referralRejection } from "@/lib/referral-rules";
import { referralRewardDays, REFERRALS } from "@/lib/config";
import { boostRank } from "@/lib/ranking";
import { db } from "@/lib/db";
import { ensureReferralCode, grantPendingRewards, onListingPublished, recordReferral, revokeReferral } from "@/lib/referrals";
import { featuredListings, searchListings } from "@/lib/listings";

describe("reglas de invitaciones", () => {
  it("normaliza variantes del mismo email", () => {
    expect(normalizeEmail(" Ana.Garcia+promo@Gmail.com ")).toBe("anagarcia@gmail.com");
    expect(normalizeEmail("ana.garcia@googlemail.com")).toBe("anagarcia@gmail.com");
    expect(normalizeEmail("ana.garcia+x@hotmail.com")).toBe("ana.garcia@hotmail.com");
  });

  it("los códigos son cortos, legibles y se validan", () => {
    const c = newReferralCode();
    expect(c).toHaveLength(7);
    expect(cleanReferralCode(c.toLowerCase())).toBe(c);
    expect(cleanReferralCode("ABC")).toBeNull();
    expect(cleanReferralCode("ABCDEF0")).toBeNull(); // 0 no está en el alfabeto
    expect(cleanReferralCode(undefined)).toBeNull();
  });

  it("1 amigo = 7 días y 3 amigos = 30 días", () => {
    expect(referralRewardDays(1)).toBe(7);
    expect(referralRewardDays(2)).toBe(7);
    expect(referralRewardDays(3)).toBe(16);
    expect(referralRewardDays(1) + referralRewardDays(2) + referralRewardDays(3)).toBe(30);
    expect(referralRewardDays(6)).toBe(16);
  });

  it("rechaza autoinvitaciones y emails repetidos", () => {
    const base = { inviterEmail: "ana@gmail.com", inviteeEmail: "luis@gmail.com", inviterUsedThisBrowser: false, emailInvitedBefore: false };
    expect(referralRejection(base)).toBeNull();
    expect(referralRejection({ ...base, inviteeEmail: "a.n.a+2@gmail.com" })).toMatch(/Mismo email/);
    expect(referralRejection({ ...base, inviterUsedThisBrowser: true })).toMatch(/navegador/);
    expect(referralRejection({ ...base, emailInvitedBefore: true })).toMatch(/ya se registró/);
  });

  it("el destacado por invitar sube el anuncio como el pack Pro", () => {
    expect(boostRank([REFERRALS.packCode], false)).toBe(2);
    expect(boostRank([REFERRALS.packCode, "premium"], false)).toBe(3);
  });
});

// Flujo completo contra PostgreSQL real (TEST_DATABASE_URL). Se salta si no está configurada.
const enabled = !!process.env.TEST_DATABASE_URL;
const tag = `r${Date.now()}`;
const DAY = 86_400_000;

describe.skipIf(!enabled)("invitaciones en base de datos", () => {
  const mkUser = (n: string) => db.user.create({ data: { email: `${n}-${tag}@test.es`, name: n, passwordHash: "x" } });
  const mkListing = (ownerId: string, title: string) =>
    db.listing.create({ data: { ownerId, title: `${title} ${tag}`, description: "Anuncio de prueba para tests", category: "bicis", city: "Valencia", citySlug: "valencia", pricePerDayCents: 1500 } });

  let ana: { id: string; email: string };
  let code: string;
  beforeAll(async () => {
    ana = await mkUser("ana");
    code = await ensureReferralCode(ana.id);
  });
  afterAll(() => db.$disconnect());

  it("el código es estable", async () => {
    expect(await ensureReferralCode(ana.id)).toBe(code);
  });

  it("premia automáticamente al publicar el primer anuncio, una sola vez", async () => {
    const anaListing = await mkListing(ana.id, "Bici de Ana");
    const luis = await mkUser("luis");
    const r = await recordReferral({ inviteeId: luis.id, inviteeEmail: luis.email, code, browserUserIds: [] });
    expect(r?.status).toBe("pending");

    const now = new Date();
    const first = await mkListing(luis.id, "Taladro de Luis");
    await onListingPublished(luis.id, first.id, now);
    let ref = await db.referral.findUniqueOrThrow({ where: { inviteeId: luis.id } });
    expect(ref.status).toBe("rewarded");
    expect(ref.firstListingId).toBe(first.id);
    expect(ref.rewardListingId).toBe(anaListing.id);
    expect(ref.rewardDays).toBe(7);

    // Publicar otro anuncio no da otro premio.
    const second = await mkListing(luis.id, "Escalera de Luis");
    await onListingPublished(luis.id, second.id);
    await grantPendingRewards(ana.id);
    const purchases = await db.packPurchase.findMany({ where: { userId: ana.id, packCode: REFERRALS.packCode } });
    expect(purchases).toHaveLength(1);
    expect(purchases[0].amountCents).toBe(0);
    expect(purchases[0].endsAt!.getTime() - now.getTime()).toBe(7 * DAY);

    // El anuncio de Ana sale destacado en búsquedas y portada.
    const res = await searchListings({ q: tag });
    expect(res.items[0].id).toBe(anaListing.id);
    expect(res.items[0].featured).toBe(true);
    expect((await featuredListings(50)).some((l) => l.id === anaListing.id)).toBe(true);
    ref = await db.referral.findUniqueOrThrow({ where: { inviteeId: luis.id } });
    expect(ref.status).toBe("rewarded");
  });

  it("acumula días y el tercer amigo completa 30 días", async () => {
    const before = await db.packPurchase.findFirstOrThrow({ where: { userId: ana.id, packCode: REFERRALS.packCode }, orderBy: { endsAt: "desc" } });
    for (const n of ["marta", "pablo"]) {
      const u = await mkUser(n);
      await recordReferral({ inviteeId: u.id, inviteeEmail: u.email, code, browserUserIds: [] });
      const l = await mkListing(u.id, `Cosa de ${n}`);
      await onListingPublished(u.id, l.id);
    }
    const last = await db.packPurchase.findFirstOrThrow({ where: { userId: ana.id, packCode: REFERRALS.packCode }, orderBy: { endsAt: "desc" } });
    // 7 (luis) + 7 (marta) + 16 (pablo): los nuevos días empiezan cuando acaba el destacado anterior.
    expect(last.endsAt!.getTime() - before.endsAt!.getTime()).toBe(23 * DAY);
  });

  it("no cuenta autoinvitaciones, ni el mismo email dos veces", async () => {
    const self = await db.user.create({ data: { email: `ana-${tag}+2@test.es`, name: "ana2", passwordHash: "x" } });
    const r1 = await recordReferral({ inviteeId: self.id, inviteeEmail: self.email, code, browserUserIds: [] });
    expect(r1?.status).toBe("rejected");

    const fromSameBrowser = await mkUser("primo");
    const r2 = await recordReferral({ inviteeId: fromSameBrowser.id, inviteeEmail: fromSameBrowser.email, code, browserUserIds: [ana.id] });
    expect(r2?.status).toBe("rejected");
    const l = await mkListing(fromSameBrowser.id, "Rechazado");
    await onListingPublished(fromSameBrowser.id, l.id);
    expect((await db.referral.findUniqueOrThrow({ where: { inviteeId: fromSameBrowser.id } })).status).toBe("rejected");

    // Misma persona (luis) que borra la cuenta y se registra otra vez con su email: no vuelve a contar.
    const again = await db.user.create({ data: { email: `luis+nuevo-${tag}@test.es`, name: "luis", passwordHash: "x" } });
    const r3 = await recordReferral({ inviteeId: again.id, inviteeEmail: `luis-${tag}@test.es`, code, browserUserIds: [] });
    expect(r3?.status).toBe("rejected");
  });

  it("si quien invita no tiene anuncios, el premio espera y se da al publicar", async () => {
    const eva = await mkUser("eva");
    const evaCode = await ensureReferralCode(eva.id);
    const juan = await mkUser("juan");
    await recordReferral({ inviteeId: juan.id, inviteeEmail: juan.email, code: evaCode, browserUserIds: [] });
    const jl = await mkListing(juan.id, "Tienda de Juan");
    await onListingPublished(juan.id, jl.id);
    expect((await db.referral.findUniqueOrThrow({ where: { inviteeId: juan.id } })).status).toBe("qualified");

    const el = await mkListing(eva.id, "Kayak de Eva");
    await onListingPublished(eva.id, el.id);
    const ref = await db.referral.findUniqueOrThrow({ where: { inviteeId: juan.id } });
    expect(ref.status).toBe("rewarded");
    expect(ref.rewardListingId).toBe(el.id);
  });

  it("dos publicaciones a la vez no duplican el premio", async () => {
    const leo = await mkUser("leo");
    const leoCode = await ensureReferralCode(leo.id);
    await mkListing(leo.id, "Moto de Leo");
    const sara = await mkUser("sara");
    await recordReferral({ inviteeId: sara.id, inviteeEmail: sara.email, code: leoCode, browserUserIds: [] });
    const [a, b] = await Promise.all([mkListing(sara.id, "A"), mkListing(sara.id, "B")]);
    await Promise.all([onListingPublished(sara.id, a.id), onListingPublished(sara.id, b.id), grantPendingRewards(leo.id)]);
    expect(await db.packPurchase.count({ where: { userId: leo.id, packCode: REFERRALS.packCode } })).toBe(1);
  });

  it("el administrador puede anular un premio", async () => {
    const ref = await db.referral.findFirstOrThrow({ where: { inviterId: ana.id, status: "rewarded" }, orderBy: { rewardedAt: "asc" } });
    await revokeReferral(ref.id);
    expect((await db.referral.findUniqueOrThrow({ where: { id: ref.id } })).status).toBe("rejected");
    const p = await db.packPurchase.findUniqueOrThrow({ where: { idempotencyKey: `referral-${ref.id}` } });
    expect(p.endsAt!.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
