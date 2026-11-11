// Reglas de negocio de Alquilaap en un solo sitio.
// Publicar y alquilar es gratis: Alquilaap no cobra comisión ni retiene el pago del alquiler.

export type PackCode = "basico" | "pro" | "premium";

export const PACKS: Record<PackCode, { code: PackCode; name: string; priceCents: number; hours: number; rank: number; perks: string[]; popular?: boolean }> = {
  basico: { code: "basico", name: "Destacado 24 h", priceCents: 199, hours: 24, rank: 1, perks: ["Etiqueta «Destacado» en el anuncio", "Sube al principio de tu categoría durante 24 h", "Ideal para un fin de semana"] },
  pro: { code: "pro", name: "Pro 7 días", priceCents: 699, hours: 24 * 7, rank: 2, popular: true, perks: ["Top de las búsquedas durante 7 días", "Aparece en «Destacados» en la portada", "Etiqueta «Destacado»"] },
  premium: { code: "premium", name: "Premium 30 días", priceCents: 1999, hours: 24 * 30, rank: 3, perks: ["Todo lo del Pro durante 30 días", "Sello «Propietario destacado» en tu perfil", "Prioridad en la búsqueda local"] },
};
export const PACK_LIST = Object.values(PACKS);
export function isPackCode(v: unknown): v is PackCode {
  return typeof v === "string" && v in PACKS;
}

export const PRO_PLAN = {
  name: "Alquilaap Pro",
  priceCents: 2499,
  rank: 1.5, // por delante de los gratuitos, por detrás de los packs Pro y Premium
  perks: ["Todos tus anuncios por delante de los gratuitos", "Perfil con sello «Tienda Pro»", "Reserva inmediata: sin esperar a que aceptes", "Anuncios ilimitados"],
};

// Seguro opcional de una aseguradora asociada (cifras de ejemplo hasta cerrar acuerdo).
export const INSURANCE = { name: "Seguro de daños y robo", rate: 0.07, minCents: 300, coverCents: 150000 };

export const FREE_LISTING_LIMIT = 10; // anuncios activos sin Pro

export const CATEGORIES = [
  { slug: "bicis", name: "Bicicletas" },
  { slug: "movilidad", name: "Patinetes y movilidad" },
  { slug: "herramientas", name: "Herramientas" },
  { slug: "deportes", name: "Deportes" },
  { slug: "camping", name: "Camping" },
  { slug: "foto", name: "Foto y vídeo" },
  { slug: "electronica", name: "Electrónica" },
  { slug: "fiestas", name: "Fiestas y eventos" },
  { slug: "hogar", name: "Hogar y jardín" },
] as const;
export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export const categoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
export const isCategory = (v: unknown): v is CategorySlug => CATEGORIES.some((c) => c.slug === v);

export const CITIES: Record<string, { name: string; lat: number; lng: number }> = {
  barcelona: { name: "Barcelona", lat: 41.3874, lng: 2.1686 },
  valencia: { name: "Valencia", lat: 39.4699, lng: -0.3763 },
  madrid: { name: "Madrid", lat: 40.4168, lng: -3.7038 },
  sevilla: { name: "Sevilla", lat: 37.3891, lng: -5.9845 },
  malaga: { name: "Málaga", lat: 36.7213, lng: -4.4214 },
  bilbao: { name: "Bilbao", lat: 43.263, lng: -2.935 },
  zaragoza: { name: "Zaragoza", lat: 41.6488, lng: -0.8891 },
  palma: { name: "Palma", lat: 39.5696, lng: 2.6502 },
  girona: { name: "Girona", lat: 41.9794, lng: 2.8214 },
  castelldefels: { name: "Castelldefels", lat: 41.2806, lng: 1.9767 },
  badalona: { name: "Badalona", lat: 41.45, lng: 2.2474 },
  "sant-cugat": { name: "Sant Cugat", lat: 41.4722, lng: 2.0864 },
};
export const isCity = (v: unknown): v is string => typeof v === "string" && v in CITIES;
