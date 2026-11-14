import { DISTANCES, PROVINCES, REGIONS, fuzz, inSpain, isProvince, isRegion } from "./places";
import { PLACES, isPlace, placesInProvince, placesInRegion } from "./localidades";

// Filtro de ubicación de la búsqueda.
//  zona = "" (toda España) | "c:<comunidad>" | "p:<provincia>" | "l:<localidad>"   (también se acepta ?ciudad=<localidad>)
//  km   = radio en km alrededor de la localidad elegida o de «mi ubicación» (lat, lng)

export interface Zone {
  value: string; // valor para el desplegable
  label: string | null;
  name?: string; // nombre de la zona elegida, para mostrarlo en el buscador
  placeSlugs?: string[]; // anuncios en estas localidades (comunidad o provincia)
  center?: { lat: number; lng: number }; // centro para medir distancias
  km?: number;
  mine: boolean; // centro = ubicación del usuario
  citySlug?: string;
}

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseZone(sp: SP): Zone {
  const raw = one(sp.zona) ?? (isPlace(one(sp.ciudad)) ? `l:${one(sp.ciudad)}` : "");
  const kmRaw = Number(one(sp.km));
  const km = (DISTANCES as readonly number[]).includes(kmRaw) ? kmRaw : undefined;
  const lat = Number(one(sp.lat));
  const lng = Number(one(sp.lng));
  const hasMine = one(sp.lat) !== undefined && Number.isFinite(lat) && Number.isFinite(lng) && inSpain(lat, lng);

  // «Cerca de mí»: manda la ubicación del usuario (redondeada) y el radio, por defecto 25 km.
  if (hasMine) return { value: "", label: "cerca de ti", center: { lat: fuzz(lat), lng: fuzz(lng) }, km: km ?? 25, mine: true };

  const [kind, slug] = raw.split(":");
  if (kind === "l" && isPlace(slug)) {
    const p = PLACES[slug];
    return km
      ? { value: raw, label: `a menos de ${km} km de ${p.name}`, name: p.name, center: { lat: p.lat, lng: p.lng }, km, mine: false, citySlug: slug }
      : { value: raw, label: p.name, name: p.name, placeSlugs: [slug], center: { lat: p.lat, lng: p.lng }, mine: false, citySlug: slug };
  }
  if (kind === "p" && isProvince(slug)) return { value: raw, label: `provincia de ${PROVINCES[slug].name}`, name: `Provincia de ${PROVINCES[slug].name}`, placeSlugs: placesInProvince(slug), mine: false };
  if (kind === "c" && isRegion(slug)) return { value: raw, label: REGIONS[slug], name: REGIONS[slug], placeSlugs: placesInRegion(slug), mine: false };
  return { value: "", label: null, mine: false };
}

/** Parámetros de URL que representan la zona (para enlaces de paginación y filtros). */
export function zoneParams(z: Zone, u: URLSearchParams) {
  if (z.mine && z.center) {
    u.set("lat", String(z.center.lat));
    u.set("lng", String(z.center.lng));
  } else if (z.value) u.set("zona", z.value);
  if (z.km) u.set("km", String(z.km));
}
