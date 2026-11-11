// Ubicaciones de Alquilaap: comunidades autónomas, provincias y localidades con coordenadas aproximadas.
// Los slugs de localidad están guardados en los anuncios (citySlug): nunca se cambian, solo se añaden nuevos.

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

type Place = { name: string; lat: number; lng: number; province: string };
const P = (name: string, lat: number, lng: number, province: string): Place => ({ name, lat, lng, province });

export const PLACES: Record<string, Place> = {
  almeria: P("Almería", 36.834, -2.464, "almeria"),
  cadiz: P("Cádiz", 36.527, -6.288, "cadiz"),
  "jerez-de-la-frontera": P("Jerez de la Frontera", 36.686, -6.137, "cadiz"),
  cordoba: P("Córdoba", 37.888, -4.779, "cordoba"),
  granada: P("Granada", 37.177, -3.599, "granada"),
  huelva: P("Huelva", 37.261, -6.945, "huelva"),
  jaen: P("Jaén", 37.779, -3.785, "jaen"),
  malaga: P("Málaga", 36.7213, -4.4214, "malaga"),
  marbella: P("Marbella", 36.51, -4.886, "malaga"),
  sevilla: P("Sevilla", 37.3891, -5.9845, "sevilla"),
  huesca: P("Huesca", 42.136, -0.409, "huesca"),
  teruel: P("Teruel", 40.345, -1.106, "teruel"),
  zaragoza: P("Zaragoza", 41.6488, -0.8891, "zaragoza"),
  oviedo: P("Oviedo", 43.362, -5.849, "asturias"),
  gijon: P("Gijón", 43.532, -5.661, "asturias"),
  palma: P("Palma", 39.5696, 2.6502, "baleares"),
  ibiza: P("Ibiza", 38.907, 1.432, "baleares"),
  "las-palmas-de-gran-canaria": P("Las Palmas de Gran Canaria", 28.124, -15.43, "las-palmas"),
  "santa-cruz-de-tenerife": P("Santa Cruz de Tenerife", 28.464, -16.251, "santa-cruz-de-tenerife"),
  santander: P("Santander", 43.462, -3.81, "cantabria"),
  albacete: P("Albacete", 38.994, -1.858, "albacete"),
  "ciudad-real": P("Ciudad Real", 38.985, -3.927, "ciudad-real"),
  cuenca: P("Cuenca", 40.07, -2.137, "cuenca"),
  guadalajara: P("Guadalajara", 40.633, -3.167, "guadalajara"),
  toledo: P("Toledo", 39.863, -4.027, "toledo"),
  avila: P("Ávila", 40.656, -4.7, "avila"),
  burgos: P("Burgos", 42.344, -3.697, "burgos"),
  leon: P("León", 42.599, -5.567, "leon"),
  palencia: P("Palencia", 42.01, -4.532, "palencia"),
  salamanca: P("Salamanca", 40.97, -5.663, "salamanca"),
  segovia: P("Segovia", 40.943, -4.109, "segovia"),
  soria: P("Soria", 41.764, -2.466, "soria"),
  valladolid: P("Valladolid", 41.652, -4.724, "valladolid"),
  zamora: P("Zamora", 41.503, -5.745, "zamora"),
  barcelona: P("Barcelona", 41.3874, 2.1686, "barcelona"),
  badalona: P("Badalona", 41.45, 2.2474, "barcelona"),
  castelldefels: P("Castelldefels", 41.2806, 1.9767, "barcelona"),
  "lhospitalet-de-llobregat": P("L'Hospitalet de Llobregat", 41.36, 2.1, "barcelona"),
  sabadell: P("Sabadell", 41.548, 2.107, "barcelona"),
  "sant-cugat": P("Sant Cugat", 41.4722, 2.0864, "barcelona"),
  sitges: P("Sitges", 41.237, 1.805, "barcelona"),
  terrassa: P("Terrassa", 41.563, 2.009, "barcelona"),
  girona: P("Girona", 41.9794, 2.8214, "girona"),
  lleida: P("Lleida", 41.617, 0.62, "lleida"),
  tarragona: P("Tarragona", 41.119, 1.245, "tarragona"),
  alicante: P("Alicante", 38.345, -0.481, "alicante"),
  benidorm: P("Benidorm", 38.541, -0.123, "alicante"),
  elche: P("Elche", 38.267, -0.698, "alicante"),
  castellon: P("Castellón de la Plana", 39.986, -0.051, "castellon"),
  valencia: P("Valencia", 39.4699, -0.3763, "valencia"),
  gandia: P("Gandia", 38.968, -0.181, "valencia"),
  badajoz: P("Badajoz", 38.879, -6.97, "badajoz"),
  caceres: P("Cáceres", 39.475, -6.372, "caceres"),
  "a-coruna": P("A Coruña", 43.362, -8.411, "a-coruna"),
  "santiago-de-compostela": P("Santiago de Compostela", 42.878, -8.544, "a-coruna"),
  lugo: P("Lugo", 43.012, -7.556, "lugo"),
  ourense: P("Ourense", 42.336, -7.864, "ourense"),
  pontevedra: P("Pontevedra", 42.431, -8.645, "pontevedra"),
  vigo: P("Vigo", 42.24, -8.721, "pontevedra"),
  madrid: P("Madrid", 40.4168, -3.7038, "madrid"),
  "alcala-de-henares": P("Alcalá de Henares", 40.482, -3.364, "madrid"),
  mostoles: P("Móstoles", 40.322, -3.865, "madrid"),
  murcia: P("Murcia", 37.992, -1.131, "murcia"),
  cartagena: P("Cartagena", 37.606, -0.986, "murcia"),
  pamplona: P("Pamplona", 42.812, -1.645, "navarra"),
  "vitoria-gasteiz": P("Vitoria-Gasteiz", 42.847, -2.672, "alava"),
  "san-sebastian": P("San Sebastián", 43.318, -1.981, "gipuzkoa"),
  bilbao: P("Bilbao", 43.263, -2.935, "bizkaia"),
  logrono: P("Logroño", 42.465, -2.445, "la-rioja"),
  ceuta: P("Ceuta", 35.889, -5.321, "ceuta"),
  melilla: P("Melilla", 35.292, -2.938, "melilla"),
};

export const isPlace = (v: unknown): v is string => typeof v === "string" && v in PLACES;
export const isProvince = (v: unknown): v is string => typeof v === "string" && v in PROVINCES;
export const isRegion = (v: unknown): v is string => typeof v === "string" && v in REGIONS;

export const placesInProvince = (prov: string) => Object.keys(PLACES).filter((k) => PLACES[k].province === prov);
export const placesInRegion = (region: string) => Object.keys(PLACES).filter((k) => PROVINCES[PLACES[k].province]?.region === region);
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

export function nearestPlace(lat: number, lng: number) {
  let best = "madrid";
  let bestD = Infinity;
  for (const [slug, p] of Object.entries(PLACES)) {
    const d = distanceKm(lat, lng, p.lat, p.lng);
    if (d < bestD) [best, bestD] = [slug, d];
  }
  return best;
}

/** España (península, Baleares, Canarias, Ceuta y Melilla), para descartar coordenadas absurdas. */
export const inSpain = (lat: number, lng: number) => lat >= 27.5 && lat <= 44 && lng >= -18.5 && lng <= 4.5;

/** Redondeo a ~1 km: no publicamos la ubicación exacta de nadie. */
export const fuzz = (v: number) => Math.round(v * 100) / 100;

export const DISTANCES = [5, 10, 25, 50, 100] as const;

/** Lugares agrupados por comunidad, ordenados, para los desplegables. */
export function groupedPlaces() {
  return Object.entries(REGIONS).map(([rslug, rname]) => ({
    slug: rslug,
    name: rname,
    provinces: provincesInRegion(rslug).map((p) => ({ slug: p, name: PROVINCES[p].name })),
    places: placesInRegion(rslug)
      .map((k) => ({ slug: k, name: PLACES[k].name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es")),
  }));
}
