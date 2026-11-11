import { PACKS, PRO_PLAN, isPackCode } from "./config";

/** Prioridad de un anuncio en búsquedas: pack activo más alto, si no Pro, si no 0 (gratuito). */
export function boostRank(activePackCodes: string[], ownerIsPro: boolean) {
  const packRank = Math.max(0, ...activePackCodes.filter(isPackCode).map((c) => PACKS[c].rank));
  return Math.max(packRank, ownerIsPro ? PRO_PLAN.rank : 0);
}

export function sortListings<T extends { rank: number; createdAt: Date }>(items: T[]) {
  return [...items].sort((a, b) => b.rank - a.rank || b.createdAt.getTime() - a.createdAt.getTime());
}
