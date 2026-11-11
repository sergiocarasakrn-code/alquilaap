import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { boostRank, sortListings } from "./ranking";
import { isProUser } from "./auth";

const include = (now: Date) =>
  ({
    photos: { orderBy: { position: "asc" }, take: 1 },
    owner: { select: { id: true, name: true, kycStatus: true, subscription: true } },
    packPurchases: { where: { status: "paid", endsAt: { gt: now } }, select: { packCode: true, endsAt: true } },
  }) satisfies Prisma.ListingInclude;

type Row = Prisma.ListingGetPayload<{ include: ReturnType<typeof include> }>;
export type ListingCard = Row & { rank: number; featured: boolean; ownerPro: boolean };

function decorate(rows: Row[]): ListingCard[] {
  return rows.map((r) => {
    const ownerPro = isProUser(r.owner);
    const codes = r.packPurchases.map((p) => p.packCode);
    return { ...r, ownerPro, featured: codes.length > 0, rank: boostRank(codes, ownerPro) };
  });
}

export interface SearchParams {
  q?: string;
  category?: string;
  citySlug?: string;
  page?: number;
}

const PAGE = 24;

/**
 * Búsqueda con prioridad: packs (Premium > Pro > Básico) > Alquilaap Pro > gratuitos, y después los más recientes.
 * Fase 1: el orden se calcula en la app sobre como mucho 500 candidatos. Con más volumen se pasa a SQL (ver docs/schema-objetivo.sql).
 */
export async function searchListings({ q, category, citySlug, page = 1 }: SearchParams) {
  const now = new Date();
  const where: Prisma.ListingWhereInput = { status: "active" };
  if (category) where.category = category;
  if (citySlug) where.citySlug = citySlug;
  const term = q?.trim();
  if (term) where.OR = [{ title: { contains: term, mode: "insensitive" } }, { description: { contains: term, mode: "insensitive" } }];
  const rows = await db.listing.findMany({ where, include: include(now), orderBy: { createdAt: "desc" }, take: 500 });
  const sorted = sortListings(decorate(rows));
  const p = Math.max(1, page);
  return { items: sorted.slice((p - 1) * PAGE, p * PAGE), total: sorted.length, page: p, pages: Math.max(1, Math.ceil(sorted.length / PAGE)) };
}

/** Portada: anuncios con pack Pro o Premium activo. */
export async function featuredListings(limit = 8) {
  const now = new Date();
  const rows = await db.listing.findMany({
    where: { status: "active", packPurchases: { some: { status: "paid", endsAt: { gt: now }, packCode: { in: ["pro", "premium"] } } } },
    include: include(now),
    take: 50,
  });
  return sortListings(decorate(rows)).slice(0, limit);
}

export async function recentListings(limit = 8) {
  const now = new Date();
  const rows = await db.listing.findMany({ where: { status: "active" }, include: include(now), orderBy: { createdAt: "desc" }, take: limit });
  return decorate(rows);
}

export async function myListings(ownerId: string) {
  const now = new Date();
  const rows = await db.listing.findMany({ where: { ownerId, status: { not: "deleted" } }, include: include(now), orderBy: { createdAt: "desc" } });
  return decorate(rows);
}

/** Confianza: alquileres finalizados por ambas partes y media de reseñas recibidas. */
export async function userStats(userId: string) {
  const [completed, agg] = await Promise.all([
    db.booking.count({ where: { status: "completed", OR: [{ ownerId: userId }, { renterId: userId }] } }),
    db.review.aggregate({ where: { targetId: userId }, _avg: { rating: true }, _count: true }),
  ]);
  return { completed, reviews: agg._count, rating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null };
}
