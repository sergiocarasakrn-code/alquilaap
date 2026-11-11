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

// Categorías y subcategorías pensadas para alquilar. Los slugs son estables (están guardados en los anuncios
// y en las URL): para renombrar se cambia el nombre, nunca el slug. Añadir nuevas es seguro en cualquier momento.
export const CATEGORIES = [
  { slug: "motor", name: "Motor", subs: [{ slug: "coches", name: "Coches" }, { slug: "furgonetas", name: "Furgonetas" }, { slug: "motos", name: "Motos" }, { slug: "autocaravanas-y-campers", name: "Autocaravanas y campers" }, { slug: "remolques", name: "Remolques" }, { slug: "portabicis-y-cofres-de-techo", name: "Portabicis y cofres de techo" }] },
  { slug: "bicis", name: "Bicicletas", subs: [{ slug: "ciudad", name: "Ciudad" }, { slug: "electricas", name: "Eléctricas" }, { slug: "gravel", name: "Gravel" }, { slug: "carretera", name: "Carretera" }, { slug: "montana", name: "Montaña" }, { slug: "infantiles", name: "Infantiles" }, { slug: "accesorios-para-bici", name: "Accesorios para bici" }] },
  { slug: "movilidad", name: "Patinetes y movilidad", subs: [{ slug: "patinetes-electricos", name: "Patinetes eléctricos" }, { slug: "scooters", name: "Scooters" }, { slug: "sillas-de-ruedas-y-movilidad-reducida", name: "Sillas de ruedas y movilidad reducida" }, { slug: "otros", name: "Otros" }] },
  { slug: "deportes", name: "Deportes y náutica", subs: [{ slug: "kayak-y-paddle-surf", name: "Kayak y paddle surf" }, { slug: "surf-y-windsurf", name: "Surf y windsurf" }, { slug: "esqui-y-snowboard", name: "Esquí y snowboard" }, { slug: "buceo", name: "Buceo" }, { slug: "golf", name: "Golf" }, { slug: "fitness", name: "Fitness" }, { slug: "otros-deportes", name: "Otros deportes" }] },
  { slug: "camping", name: "Camping y viajes", subs: [{ slug: "tiendas-de-campana", name: "Tiendas de campaña" }, { slug: "sacos-y-colchones", name: "Sacos y colchones" }, { slug: "neveras-y-cocina", name: "Neveras y cocina" }, { slug: "maletas-y-mochilas", name: "Maletas y mochilas" }, { slug: "otros", name: "Otros" }] },
  { slug: "herramientas", name: "Herramientas y bricolaje", subs: [{ slug: "taladros-y-electricas", name: "Taladros y eléctricas" }, { slug: "escaleras-y-andamios", name: "Escaleras y andamios" }, { slug: "construccion", name: "Construcción" }, { slug: "jardineria", name: "Jardinería" }, { slug: "limpieza", name: "Limpieza" }, { slug: "otras-herramientas", name: "Otras herramientas" }] },
  { slug: "hogar", name: "Casa y jardín", subs: [{ slug: "electrodomesticos", name: "Electrodomésticos" }, { slug: "muebles", name: "Muebles" }, { slug: "jardin-y-terraza", name: "Jardín y terraza" }, { slug: "climatizacion", name: "Climatización" }, { slug: "otros", name: "Otros" }] },
  { slug: "foto", name: "Imagen y sonido", subs: [{ slug: "camaras", name: "Cámaras" }, { slug: "objetivos", name: "Objetivos" }, { slug: "drones", name: "Drones" }, { slug: "video-e-iluminacion", name: "Vídeo e iluminación" }, { slug: "proyectores-y-pantallas", name: "Proyectores y pantallas" }, { slug: "audio-y-altavoces", name: "Audio y altavoces" }] },
  { slug: "electronica", name: "Informática y electrónica", subs: [{ slug: "portatiles", name: "Portátiles" }, { slug: "tablets", name: "Tablets" }, { slug: "monitores", name: "Monitores" }, { slug: "impresoras", name: "Impresoras" }, { slug: "realidad-virtual", name: "Realidad virtual" }, { slug: "otros", name: "Otros" }] },
  { slug: "juegos", name: "Consolas y juegos", subs: [{ slug: "consolas", name: "Consolas" }, { slug: "videojuegos", name: "Videojuegos" }, { slug: "juegos-de-mesa", name: "Juegos de mesa" }, { slug: "simuladores", name: "Simuladores" }] },
  { slug: "fiestas", name: "Fiestas y eventos", subs: [{ slug: "carpas-y-mobiliario", name: "Carpas y mobiliario" }, { slug: "iluminacion-y-sonido", name: "Iluminación y sonido" }, { slug: "decoracion", name: "Decoración" }, { slug: "hinchables-y-atracciones", name: "Hinchables y atracciones" }, { slug: "otros", name: "Otros" }] },
  { slug: "bebes", name: "Bebés y niños", subs: [{ slug: "cochecitos", name: "Cochecitos" }, { slug: "sillas-de-coche", name: "Sillas de coche" }, { slug: "cunas-y-parques", name: "Cunas y parques" }, { slug: "tronas", name: "Tronas" }, { slug: "juguetes", name: "Juguetes" }] },
  { slug: "moda", name: "Moda y complementos", subs: [{ slug: "trajes", name: "Trajes" }, { slug: "vestidos-de-fiesta", name: "Vestidos de fiesta" }, { slug: "disfraces", name: "Disfraces" }, { slug: "bolsos-y-complementos", name: "Bolsos y complementos" }, { slug: "joyeria", name: "Joyería" }] },
  { slug: "musica", name: "Música y aficiones", subs: [{ slug: "guitarras-y-bajos", name: "Guitarras y bajos" }, { slug: "teclados-y-pianos", name: "Teclados y pianos" }, { slug: "baterias-y-percusion", name: "Baterías y percusión" }, { slug: "otros-instrumentos", name: "Otros instrumentos" }, { slug: "telescopios-y-prismaticos", name: "Telescopios y prismáticos" }, { slug: "manualidades", name: "Manualidades" }] },
  { slug: "mascotas", name: "Mascotas y campo", subs: [{ slug: "transportines-y-jaulas", name: "Transportines y jaulas" }, { slug: "accesorios-para-mascotas", name: "Accesorios para mascotas" }, { slug: "maquinaria-agricola", name: "Maquinaria agrícola" }, { slug: "otros", name: "Otros" }] },
  { slug: "espacios", name: "Espacios", subs: [{ slug: "trasteros", name: "Trasteros" }, { slug: "plazas-de-parking", name: "Plazas de parking" }, { slug: "locales-y-salas", name: "Locales y salas" }, { slug: "estudios-de-foto-y-musica", name: "Estudios de foto y música" }] },
] as const;
export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export const categoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
export const isCategory = (v: unknown): v is CategorySlug => CATEGORIES.some((c) => c.slug === v);
export const subcategoriesOf = (cat: string): readonly { slug: string; name: string }[] => CATEGORIES.find((c) => c.slug === cat)?.subs ?? [];
export const isSubcategory = (cat: string, sub: unknown) => typeof sub === "string" && subcategoriesOf(cat).some((s) => s.slug === sub);
export const subcategoryName = (cat: string, sub: string | null | undefined) => (sub ? subcategoriesOf(cat).find((s) => s.slug === sub)?.name : undefined);

// Localidades, provincias y comunidades: ver places.ts. CITIES se mantiene por compatibilidad.
import { PLACES, isPlace } from "./places";
export const CITIES = PLACES;
export const isCity = isPlace;
