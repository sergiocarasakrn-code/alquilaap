import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CITIES, categoryName, isCategory, isCity } from "@/lib/config";
import Buscar from "@/app/buscar/page";

// Páginas SEO «alquiler de <categoría> en <ciudad>», p. ej. /alquilar/bicis/barcelona
type P = Promise<{ cat: string; ciudad: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const { cat, ciudad } = await params;
  if (!isCategory(cat) || !isCity(ciudad)) return {};
  const title = `Alquiler de ${categoryName(cat).toLowerCase()} en ${CITIES[ciudad].name}`;
  return {
    title,
    description: `${title} entre particulares y tiendas. Usuarios verificados, sin comisiones y con reseñas.`,
    alternates: { canonical: `/alquilar/${cat}/${ciudad}` },
  };
}

export default async function Landing({ params }: { params: P }) {
  const { cat, ciudad } = await params;
  if (!isCategory(cat) || !isCity(ciudad)) notFound();
  return (
    <div className="space-y-4">
      <h1 className="h1">
        Alquiler de {categoryName(cat).toLowerCase()} en {CITIES[ciudad].name}
      </h1>
      <Buscar searchParams={Promise.resolve({ cat, ciudad })} />
    </div>
  );
}
