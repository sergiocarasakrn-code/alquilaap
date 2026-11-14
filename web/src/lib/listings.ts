import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { boostRank, sortListings } from "./ranking";
import { REFERRALS } from "./config";
import { isProUser } from "./auth";
import { boundingBox, distanceKm } from "./places";

const include = (now: Date) =>
  ({
    photos: { orderBy: { position: "asc" }, take: 1 },
    owner: { select: { id: true, name: true, kycStatus: true, subscription: true } },
    packPurchases: { where: { status: "paid", endsAt: { gt: now } }, select: { packCode: true, endsAt: true } },
  }) satisfies Prisma.ListingInclude;

type Row = Prisma.ListingGetPayload<{ include: ReturnType<typeof include> }>;
export type ListingCard = Row & { rank: number; featured: boolean; ownerPro: boolean; distanceKm?: number };

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
  subcategory?: string;
  citySlug?: string;
  /** Localidades permitidas (filtro por comunidad o provincia). */
  placeSlugs?: string[];
  /** Centro y radio para buscar por cercanía. */
  center?: { lat: number; lng: number };
  km?: number;
  page?: number;
}

const PAGE = 24;

/**
 * Búsqueda con prioridad: packs (Premium > Pro > Básico) > Alquilaap Pro > gratuitos, y después los más recientes.
 * Fase 1: el orden se calcula en la app sobre como mucho 500 candidatos. Con más volumen se pasa a SQL (ver docs/schema-objetivo.sql).
 */
export async function searchListings({ q, category, subcategory, citySlug, placeSlugs, center, km, page = 1 }: SearchParams) {
  const now = new Date();
  const where: Prisma.ListingWhereInput = { status: "active" };
  if (category) where.category = category;
  if (category && subcategory) where.subcategory = subcategory;
  if (citySlug) where.citySlug = citySlug;
  if (placeSlugs) where.citySlug = { in: placeSlugs };
  if (center && km) {
    const b = boundingBox(center.lat, center.lng, km);
    where.lat = { gte: b.minLat, lte: b.maxLat };
    where.lng = { gte: b.minLng, lte: b.maxLng };
  }
  const term = q?.trim();
  if (term) where.OR = [{ title: { contains: term, mode: "insensitive" } }, { description: { contains: term, mode: "insensitive" } }];
  const rows = await db.listing.findMany({ where, include: include(now), orderBy: { createdAt: "desc" }, take: 500 });
  let items = decorate(rows);
  if (center) {
    for (const it of items) if (it.lat != null && it.lng != null) it.distanceKm = distanceKm(center.lat, center.lng, it.lat, it.lng);
    if (km) items = items.filter((it) => it.distanceKm !== undefined && it.distanceKm <= km);
  }
  // Primero la visibilidad pagada; dentro del mismo nivel, lo más cercano (si hay centro) y luego lo más reciente.
  const sorted = center
    ? [...items].sort((a, b) => b.rank - a.rank || (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9) || b.createdAt.getTime() - a.createdAt.getTime())
    : sortListings(items);
  const p = Math.max(1, page);
  return { items: sorted.slice((p - 1) * PAGE, p * PAGE), total: sorted.length, page: p, pages: Math.max(1, Math.ceil(sorted.length / PAGE)) };
}

/** Portada: anuncios con pack Pro o Premium activo, o destacados por invitar. */
export async function featuredListings(limit = 8) {
  const now = new Date();
  const rows = await db.listing.findMany({
    where: { status: "active", packPurchases: { some: { status: "paid", endsAt: { gt: now }, packCode: { in: ["pro", "premium", REFERRALS.packCode] } } } },
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
