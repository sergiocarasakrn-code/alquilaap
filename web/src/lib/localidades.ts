import { MUNICIPIOS } from "./localidades-data";
import { PROVINCES, REGIONS, distanceKm, normalize, type PlaceHit } from "./places";

// Todas las localidades de España (8.132 municipios). Solo en el servidor (~500 KB): no importar desde componentes "use client".
// Los slugs están guardados en los anuncios (citySlug): nunca se cambian, solo se añaden nuevos.

export type Place = { name: string; lat: number; lng: number; province: string; pop: number };

export const PLACES: Record<string, Place> = {};
const INDEX: { slug: string; keys: string[] }[] = []; // ordenado por población
for (const [slug, name, province, lat, lng, pop, official] of MUNICIPIOS) {
  PLACES[slug] = { name, lat, lng, province, pop };
  const names = [name, ...name.split(" / "), ...(official ? [official, ...official.split(" / ")] : [])];
  INDEX.push({ slug, keys: [...new Set(names.map(normalize))] });
}

export const isPlace = (v: unknown): v is string => typeof v === "string" && Object.hasOwn(PLACES, v);

const inProvince = new Map<string, string[]>();
for (const { slug } of INDEX) {
  const p = PLACES[slug].province;
  inProvince.set(p, [...(inProvince.get(p) ?? []), slug]);
}
export const placesInProvince = (prov: string) => inProvince.get(prov) ?? [];
export const placesInRegion = (region: string) =>
  Object.keys(PROVINCES)
    .filter((p) => PROVINCES[p].region === region)
    .flatMap(placesInProvince);

/** Localidad más cercana a unas coordenadas (para «Usar mi ubicación»). */
export function nearestPlace(lat: number, lng: number) {
  let best = "madrid";
  let bestD = Infinity;
  for (const [slug, p] of Object.entries(PLACES)) {
    const d = distanceKm(lat, lng, p.lat, p.lng);
    if (d < bestD) [best, bestD] = [slug, d];
  }
  return best;
}

/** «Xilxes» → 0 (empieza igual), «Vall d'Uixó» con «uixo» → 1 (empieza una palabra), si no -1. */
function score(keys: string[], q: string, qc: string) {
  let best = -1;
  for (const k of keys) {
    if (k === q) return 0;
    if (k.startsWith(q) || k.replace(/ /g, "").startsWith(qc)) best = best === -1 ? 1 : Math.min(best, 1);
    else if (k.includes(` ${q}`)) best = best === -1 ? 2 : best;
  }
  return best;
}

export const placeDetail = (slug: string) => {
  const prov = PROVINCES[PLACES[slug].province];
  return prov.name;
};

/**
 * Busca lugares por nombre, sin tildes. withZones añade comunidades y provincias (para el buscador de anuncios).
 * Las localidades más pobladas salen antes, a igual coincidencia.
 */
export function searchPlaces(query: string, { limit = 8, withZones = false } = {}): PlaceHit[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const qc = q.replace(/ /g, "");
  const hits: (PlaceHit & { s: number })[] = [];
  if (withZones) {
    for (const [slug, name] of Object.entries(REGIONS)) {
      const s = score([normalize(name)], q, qc);
      if (s >= 0) hits.push({ value: `c:${slug}`, name, detail: "Comunidad: todas las zonas", s: s - 0.5 });
    }
    for (const [slug, p] of Object.entries(PROVINCES)) {
      const s = score([normalize(p.name)], q, qc);
      if (s >= 0) hits.push({ value: `p:${slug}`, name: `Provincia de ${p.name}`, detail: REGIONS[p.region], s: s - 0.4 });
    }
  }
  const places: (PlaceHit & { s: number })[] = [];
  for (const { slug, keys } of INDEX) {
    const s = score(keys, q, qc);
    if (s < 0) continue;
    places.push({ value: `l:${slug}`, name: PLACES[slug].name, detail: placeDetail(slug), s });
    if (s === 0 && places.length >= limit * 4) break;
  }
  // sort es estable: a igual puntuación se mantiene el orden por población
  return [...hits, ...places]
    .sort((a, b) => a.s - b.s)
    .slice(0, limit)
    .map(({ s: _s, ...h }) => h);
}
