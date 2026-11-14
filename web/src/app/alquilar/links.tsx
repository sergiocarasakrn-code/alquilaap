import Link from "next/link";
import { db } from "@/lib/db";
import { CATEGORIES } from "@/lib/config";
import { PLACES, isPlace } from "@/lib/localidades";
import { TOP_CITIES, catLower } from "@/lib/seo";

// Enlaces internos entre páginas de alquiler: ayudan a Google a descubrirlas y a la gente a cambiar de ciudad o categoría.

/** Ciudades con anuncios de esta categoría (primero las que más tienen) y después las ciudades grandes. */
export async function CityLinks({ cat, except }: { cat: string; except?: string }) {
  const rows = await db.listing.groupBy({ by: ["citySlug"], where: { status: "active", category: cat }, _count: { _all: true } });
  const withAds = rows
    .filter((r) => isPlace(r.citySlug))
    .sort((a, b) => b._count._all - a._count._all)
    .map((r) => ({ slug: r.citySlug, name: PLACES[r.citySlug].name }));
  const seen = new Set<string>();
  const cities = [...withAds, ...TOP_CITIES].filter((c) => c.slug !== except && !seen.has(c.slug) && seen.add(c.slug)).slice(0, 40);
  return (
    <section className="space-y-2 pt-4">
      <h2 className="h2">Alquiler de {catLower(cat)} en otras ciudades</h2>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4 lg:grid-cols-5">
        {cities.map((c) => (
          <li key={c.slug}>
            <Link className="text-brand hover:underline" href={`/alquilar/${cat}/${c.slug}`}>
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Otras categorías en la misma ciudad (o en toda España). */
export function CategoryLinks({ except, ciudad }: { except: string; ciudad?: string }) {
  const where = ciudad ? ` en ${PLACES[ciudad].name}` : "";
  return (
    <section className="space-y-2 pt-2">
      <h2 className="h2">Más cosas para alquilar{where}</h2>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {CATEGORIES.filter((c) => c.slug !== except).map((c) => (
          <li key={c.slug}>
            <Link className="text-brand hover:underline" href={ciudad ? `/alquilar/${c.slug}/${ciudad}` : `/alquilar/${c.slug}`}>
              Alquiler de {c.name.toLowerCase()}
              {where}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
