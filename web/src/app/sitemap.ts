import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { CATEGORIES, isCategory } from "@/lib/config";
import { isPlace } from "@/lib/localidades";
import { abs } from "@/lib/seo";

// Mapa de la web para Google: páginas fijas, categorías, «alquiler de X en <ciudad>» y todos los anuncios activos.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const listings = await db.listing.findMany({
    where: { status: "active" },
    select: { id: true, category: true, citySlug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 45000, // un sitemap admite 50.000 direcciones
  });

  const page = (path: string, priority: number, lastModified: Date = now, changeFrequency: "daily" | "weekly" | "monthly" = "weekly") => ({
    url: abs(path),
    lastModified,
    changeFrequency,
    priority,
  });

  const fixed = [
    page("/", 1, now, "daily"),
    page("/categorias", 0.6),
    page("/gana-dinero", 0.6, now, "monthly"),
    page("/como-funciona", 0.5, now, "monthly"),
    page("/condiciones", 0.2, now, "monthly"),
    page("/privacidad", 0.2, now, "monthly"),
  ];
  const categories = CATEGORIES.map((c) => page(`/alquilar/${c.slug}`, 0.8, now, "daily"));

  // Ciudad + categoría: solo donde hay anuncios (una página vacía no le sirve a nadie y Google la penaliza).
  const combos = new Map<string, Date>();
  for (const l of listings) {
    if (!isCategory(l.category) || !isPlace(l.citySlug)) continue;
    const key = `/alquilar/${l.category}/${l.citySlug}`;
    const prev = combos.get(key);
    if (!prev || prev < l.updatedAt) combos.set(key, l.updatedAt);
  }
  const cityPages = [...combos].map(([path, d]) => page(path, 0.7, d, "daily"));

  const ads = listings.map((l) => page(`/anuncio/${l.id}`, 0.6, l.updatedAt));
  return [...fixed, ...categories, ...cityPages, ...ads];
}
