import { CATEGORIES, categoryName } from "./config";
import { MUNICIPIOS } from "./localidades-data";

// Ayudas para Google: dirección pública de la web, ciudades con página propia y textos de las páginas de alquiler.

/** Dirección pública canónica (con www). En local, localhost. */
export const SITE_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const abs = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Ciudades grandes que siempre tienen página «alquiler de X en <ciudad>» (aunque todavía no haya anuncios). */
export const TOP_CITIES = MUNICIPIOS.slice(0, 40).map(([slug, name]) => ({ slug, name }));

export const catLower = (cat: string) => categoryName(cat).toLowerCase();

/** Texto de introducción de las páginas de categoría (contenido propio para Google, no solo la lista). */
export function categoryIntro(cat: string, city?: string) {
  const c = CATEGORIES.find((x) => x.slug === cat);
  const where = city ? `en ${city}` : "en toda España";
  const examples = c ? c.subs.filter((s) => s.slug !== "otros").slice(0, 4).map((s) => s.name.toLowerCase()) : [];
  const ej = examples.length ? ` (${examples.join(", ")}…)` : "";
  return `Alquila ${catLower(cat)}${ej} ${where} por días a particulares y tiendas de tu zona. Publicar y alquilar en Alquilaap es gratis y sin comisiones: el alquiler se paga en mano y las reseñas te ayudan a elegir.`;
}

/** Inserta datos estructurados (JSON-LD) en la página. */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });

/** Vista previa al compartir (WhatsApp, redes). Next no mezcla openGraph entre niveles, así que cada página lo pide completo. */
export function og(o: { title: string; description: string; url?: string; image?: string; type?: "website" | "article" }) {
  return {
    openGraph: {
      type: o.type ?? "website",
      siteName: "Alquilaap",
      locale: "es_ES",
      title: o.title,
      description: o.description,
      url: o.url,
      images: [o.image ? { url: o.image } : { url: "/og.png", width: 1024, height: 500, alt: "Alquilaap, alquila cerca de ti" }],
    },
    twitter: { card: "summary_large_image" as const, title: o.title, description: o.description, images: [o.image ?? "/og.png"] },
  };
}
