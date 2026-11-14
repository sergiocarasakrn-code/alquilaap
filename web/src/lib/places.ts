// Ubicaciones de Alquilaap: comunidades autónomas, provincias y utilidades de distancia.
// Este fichero también se usa en el navegador: los 8.132 municipios están en localidades.ts (solo servidor).

export const REGIONS: Record<string, string> = {
  andalucia: "Andalucía",
  aragon: "Aragón",
  asturias: "Asturias",
  baleares: "Islas Baleares",
  canarias: "Canarias",
  cantabria: "Cantabria",
  "castilla-la-mancha": "Castilla-La Mancha",
  "castilla-y-leon": "Castilla y León",
  cataluna: "Cataluña",
  "comunidad-valenciana": "Comunidad Valenciana",
  extremadura: "Extremadura",
  galicia: "Galicia",
  madrid: "Comunidad de Madrid",
  murcia: "Región de Murcia",
  navarra: "Navarra",
  "pais-vasco": "País Vasco",
  "la-rioja": "La Rioja",
  ceuta: "Ceuta",
  melilla: "Melilla",
};

export const PROVINCES: Record<string, { name: string; region: string }> = {
  almeria: { name: "Almería", region: "andalucia" },
  cadiz: { name: "Cádiz", region: "andalucia" },
  cordoba: { name: "Córdoba", region: "andalucia" },
  granada: { name: "Granada", region: "andalucia" },
  huelva: { name: "Huelva", region: "andalucia" },
  jaen: { name: "Jaén", region: "andalucia" },
  malaga: { name: "Málaga", region: "andalucia" },
  sevilla: { name: "Sevilla", region: "andalucia" },
  huesca: { name: "Huesca", region: "aragon" },
  teruel: { name: "Teruel", region: "aragon" },
  zaragoza: { name: "Zaragoza", region: "aragon" },
  asturias: { name: "Asturias", region: "asturias" },
  baleares: { name: "Islas Baleares", region: "baleares" },
  "las-palmas": { name: "Las Palmas", region: "canarias" },
  "santa-cruz-de-tenerife": { name: "Santa Cruz de Tenerife", region: "canarias" },
  cantabria: { name: "Cantabria", region: "cantabria" },
  albacete: { name: "Albacete", region: "castilla-la-mancha" },
  "ciudad-real": { name: "Ciudad Real", region: "castilla-la-mancha" },
  cuenca: { name: "Cuenca", region: "castilla-la-mancha" },
  guadalajara: { name: "Guadalajara", region: "castilla-la-mancha" },
  toledo: { name: "Toledo", region: "castilla-la-mancha" },
  avila: { name: "Ávila", region: "castilla-y-leon" },
  burgos: { name: "Burgos", region: "castilla-y-leon" },
  leon: { name: "León", region: "castilla-y-leon" },
  palencia: { name: "Palencia", region: "castilla-y-leon" },
  salamanca: { name: "Salamanca", region: "castilla-y-leon" },
  segovia: { name: "Segovia", region: "castilla-y-leon" },
  soria: { name: "Soria", region: "castilla-y-leon" },
  valladolid: { name: "Valladolid", region: "castilla-y-leon" },
  zamora: { name: "Zamora", region: "castilla-y-leon" },
  barcelona: { name: "Barcelona", region: "cataluna" },
  girona: { name: "Girona", region: "cataluna" },
  lleida: { name: "Lleida", region: "cataluna" },
  tarragona: { name: "Tarragona", region: "cataluna" },
  alicante: { name: "Alicante", region: "comunidad-valenciana" },
  castellon: { name: "Castellón", region: "comunidad-valenciana" },
  valencia: { name: "Valencia", region: "comunidad-valenciana" },
  badajoz: { name: "Badajoz", region: "extremadura" },
  caceres: { name: "Cáceres", region: "extremadura" },
  "a-coruna": { name: "A Coruña", region: "galicia" },
  lugo: { name: "Lugo", region: "galicia" },
  ourense: { name: "Ourense", region: "galicia" },
  pontevedra: { name: "Pontevedra", region: "galicia" },
  madrid: { name: "Madrid", region: "madrid" },
  murcia: { name: "Murcia", region: "murcia" },
  navarra: { name: "Navarra", region: "navarra" },
  alava: { name: "Álava", region: "pais-vasco" },
  gipuzkoa: { name: "Gipuzkoa", region: "pais-vasco" },
  bizkaia: { name: "Bizkaia", region: "pais-vasco" },
  "la-rioja": { name: "La Rioja", region: "la-rioja" },
  ceuta: { name: "Ceuta", region: "ceuta" },
  melilla: { name: "Melilla", region: "melilla" },
};

export const isProvince = (v: unknown): v is string => typeof v === "string" && v in PROVINCES;
export const isRegion = (v: unknown): v is string => typeof v === "string" && v in REGIONS;

export const provincesInRegion = (region: string) => Object.keys(PROVINCES).filter((k) => PROVINCES[k].region === region);

/** Distancia en km entre dos puntos (fórmula del haversine). */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(bLat - aLat);
  const dLng = r(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Caja aproximada alrededor de un punto, para filtrar en la base de datos antes de calcular la distancia exacta. */
export function boundingBox(lat: number, lng: number, km: number) {
  const dLat = km / 111;
  const dLng = km / (111 * Math.cos((lat * Math.PI) / 180));
  return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
}

/** España (península, Baleares, Canarias, Ceuta y Melilla), para descartar coordenadas absurdas. */
export const inSpain = (lat: number, lng: number) => lat >= 27.5 && lat <= 44 && lng >= -18.5 && lng <= 4.5;

/** Redondeo a ~1 km: no publicamos la ubicación exacta de nadie. */
export const fuzz = (v: number) => Math.round(v * 100) / 100;

export const DISTANCES = [5, 10, 25, 50, 100] as const;

/** Texto sin tildes, en minúsculas y con espacios simples, para buscar «xilxes» o «castello». */
export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Sugerencia del buscador de lugares (API /api/v1/lugares). value: «l:<localidad>», «p:<provincia>» o «c:<comunidad>». */
export interface PlaceHit {
  value: string;
  name: string;
  detail: string;
}
