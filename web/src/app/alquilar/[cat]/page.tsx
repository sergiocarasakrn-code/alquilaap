import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isCategory } from "@/lib/config";
import { abs, catLower, categoryIntro, jsonLd, og } from "@/lib/seo";
import Buscar from "@/app/buscar/page";
import { CategoryLinks, CityLinks } from "../links";

// Páginas SEO «alquiler de <categoría>» en toda España, p. ej. /alquilar/bicis
type P = Promise<{ cat: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const { cat } = await params;
  if (!isCategory(cat)) return {};
  const title = `Alquiler de ${catLower(cat)} entre particulares`;
  const description = `Alquila ${catLower(cat)} por días cerca de ti, a particulares y tiendas de toda España. Publicar y alquilar es gratis y sin comisiones.`;
  return { title, description, alternates: { canonical: `/alquilar/${cat}` }, ...og({ title: `${title} · Alquilaap`, description, url: `/alquilar/${cat}` }) };
}

export default async function Categoria({ params }: { params: P }) {
  const { cat } = await params;
  if (!isCategory(cat)) notFound();
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Alquilaap", item: abs("/") },
      { "@type": "ListItem", position: 2, name: `Alquiler de ${catLower(cat)}`, item: abs(`/alquilar/${cat}`) },
    ],
  };
  return (
    <div className="space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbs)} />
      <h1 className="h1">Alquiler de {catLower(cat)}</h1>
      <p className="max-w-3xl text-ink-2">{categoryIntro(cat)}</p>
      <Buscar searchParams={Promise.resolve({ cat })} />
      <CityLinks cat={cat} />
      <CategoryLinks except={cat} />
    </div>
  );
}
