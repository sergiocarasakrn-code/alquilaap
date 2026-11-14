import { PACKS, PRO_PLAN, REFERRALS, isPackCode } from "./config";

const rankOf = (code: string) => (isPackCode(code) ? PACKS[code].rank : code === REFERRALS.packCode ? REFERRALS.rank : 0);

/** Nombre de un destacado activo para mostrarlo al propietario. */
export const packName = (code: string) => (isPackCode(code) ? PACKS[code].name : code === REFERRALS.packCode ? REFERRALS.name : "Destacado");

/** Prioridad de un anuncio en búsquedas: destacado activo más alto (pagado o por invitar), si no Pro, si no 0 (gratuito). */
export function boostRank(activePackCodes: string[], ownerIsPro: boolean) {
  const packRank = Math.max(0, ...activePackCodes.map(rankOf));
  return Math.max(packRank, ownerIsPro ? PRO_PLAN.rank : 0);
}

export function sortListings<T extends { rank: number; createdAt: Date }>(items: T[]) {
  return [...items].sort((a, b) => b.rank - a.rank || b.createdAt.getTime() - a.createdAt.getTime());
}
