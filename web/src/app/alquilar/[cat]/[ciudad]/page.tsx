import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { isCategory } from "@/lib/config";
import { PLACES, isPlace } from "@/lib/localidades";
import { abs, catLower, categoryIntro, jsonLd, og } from "@/lib/seo";
import Buscar from "@/app/buscar/page";
import { CategoryLinks, CityLinks } from "../../links";

// Páginas SEO «alquiler de <categoría> en <ciudad>», p. ej. /alquilar/bicis/barcelona
type P = Promise<{ cat: string; ciudad: string }>;

export const dynamic = "force-dynamic";

const count = (cat: string, ciudad: string) => db.listing.count({ where: { status: "active", category: cat, citySlug: ciudad } });

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const { cat, ciudad } = await params;
  if (!isCategory(cat) || !isPlace(ciudad)) return {};
  const city = PLACES[ciudad].name;
  const title = `Alquiler de ${catLower(cat)} en ${city}`;
  const n = await count(cat, ciudad);
  const description = `${n > 0 ? `${n} ${n === 1 ? "anuncio" : "anuncios"} de` : "Alquila"} ${catLower(cat)} en ${city} por días, a particulares y tiendas. Gratis, sin comisiones y con reseñas.`;
  const url = `/alquilar/${cat}/${ciudad}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    ...og({ title: `${title} · Alquilaap`, description, url }),
    // Sin anuncios todavía: Google sigue los enlaces, pero no muestra la página vacía.
    robots: n > 0 ? undefined : { index: false, follow: true },
  };
}

export default async function Landing({ params }: { params: P }) {
  const { cat, ciudad } = await params;
  if (!isCategory(cat) || !isPlace(ciudad)) notFound();
  const city = PLACES[ciudad].name;
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Alquilaap", item: abs("/") },
      { "@type": "ListItem", position: 2, name: `Alquiler de ${catLower(cat)}`, item: abs(`/alquilar/${cat}`) },
      { "@type": "ListItem", position: 3, name: city, item: abs(`/alquilar/${cat}/${ciudad}`) },
    ],
  };
  return (
    <div className="space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbs)} />
      <h1 className="h1">
        Alquiler de {catLower(cat)} en {city}
      </h1>
      <p className="max-w-3xl text-ink-2">{categoryIntro(cat, city)}</p>
      <Buscar searchParams={Promise.resolve({ cat, ciudad })} />
      <CityLinks cat={cat} except={ciudad} />
      <CategoryLinks except={cat} ciudad={ciudad} />
    </div>
  );
}
