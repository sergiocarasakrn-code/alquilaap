// Genera src/lib/localidades-data.ts con los 8.132 municipios de España.
// Fuente: Nomenclátor Geográfico de Municipios y Entidades de Población (CNIG, licencia CC BY 4.0),
// fichero MUNICIPIOS.csv (separado por «;», codificación Latin-1).
// Uso: node scripts/build-localidades.mjs ruta/a/MUNICIPIOS.csv
import { readFileSync, writeFileSync } from "node:fs";

// Código INE de provincia → slug de PROVINCES (places.ts)
const PROV = {
  "01": "alava", "02": "albacete", "03": "alicante", "04": "almeria", "05": "avila", "06": "badajoz", "07": "baleares",
  "08": "barcelona", "09": "burgos", 10: "caceres", 11: "cadiz", 12: "castellon", 13: "ciudad-real", 14: "cordoba",
  15: "a-coruna", 16: "cuenca", 17: "girona", 18: "granada", 19: "guadalajara", 20: "gipuzkoa", 21: "huelva", 22: "huesca",
  23: "jaen", 24: "leon", 25: "lleida", 26: "la-rioja", 27: "lugo", 28: "madrid", 29: "malaga", 30: "murcia", 31: "navarra",
  32: "ourense", 33: "asturias", 34: "palencia", 35: "las-palmas", 36: "pontevedra", 37: "salamanca", 38: "santa-cruz-de-tenerife",
  39: "cantabria", 40: "segovia", 41: "sevilla", 42: "soria", 43: "tarragona", 44: "teruel", 45: "toledo", 46: "valencia",
  47: "valladolid", 48: "bizkaia", 49: "zamora", 50: "zaragoza", 51: "ceuta", 52: "melilla",
};

// Localidades que ya existían (sus slugs están guardados en anuncios): se conservan slug y nombre.
const LEGACY = {
  almeria: "04013", cadiz: "11012", "jerez-de-la-frontera": "11020", cordoba: "14021", granada: "18087", huelva: "21041",
  jaen: "23050", malaga: "29067", marbella: "29069", sevilla: "41091", huesca: "22125", teruel: "44216", zaragoza: "50297",
  oviedo: "33044", gijon: "33024", palma: "07040", ibiza: "07026", "las-palmas-de-gran-canaria": "35016",
  "santa-cruz-de-tenerife": "38038", santander: "39075", albacete: "02003", "ciudad-real": "13034", cuenca: "16078",
  guadalajara: "19130", toledo: "45168", avila: "05019", burgos: "09059", leon: "24089", palencia: "34120",
  salamanca: "37274", segovia: "40194", soria: "42173", valladolid: "47186", zamora: "49275", barcelona: "08019",
  badalona: "08015", castelldefels: "08056", "lhospitalet-de-llobregat": "08101", sabadell: "08187", "sant-cugat": "08205",
  sitges: "08270", terrassa: "08279", girona: "17079", lleida: "25120", tarragona: "43148", alicante: "03014",
  benidorm: "03031", elche: "03065", castellon: "12040", valencia: "46250", gandia: "46131", badajoz: "06015",
  caceres: "10037", "a-coruna": "15030", "santiago-de-compostela": "15078", lugo: "27028", ourense: "32054",
  pontevedra: "36038", vigo: "36057", madrid: "28079", "alcala-de-henares": "28005", mostoles: "28092", murcia: "30030",
  cartagena: "30016", pamplona: "31201", "vitoria-gasteiz": "01059", "san-sebastian": "20069", bilbao: "48020",
  logrono: "26089", ceuta: "51001", melilla: "52001",
};
const LEGACY_NAME = {
  ibiza: "Ibiza", alicante: "Alicante", elche: "Elche", castellon: "Castellón de la Plana", valencia: "Valencia",
  "san-sebastian": "San Sebastián", pamplona: "Pamplona", "sant-cugat": "Sant Cugat", "las-palmas-de-gran-canaria": "Las Palmas de Gran Canaria",
};

export const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’·]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const num = (s) => Math.round(Number(s.replace(",", ".")) * 1000) / 1000;

const file = process.argv[2];
if (!file) throw new Error("Falta la ruta a MUNICIPIOS.csv");
const rows = new TextDecoder("latin1").decode(readFileSync(file)).split(/\r?\n/).slice(1).filter(Boolean).map((l) => l.split(";"));

const byCode = new Map(Object.entries(LEGACY).map(([slug, code]) => [code, slug]));
const out = [];
const used = new Set();
for (const r of rows) {
  const code = r[0].slice(0, 5);
  const prov = PROV[r[3]] ?? PROV[Number(r[3])];
  if (!prov) throw new Error(`Provincia desconocida ${r[3]}`);
  // «Chilches/Xilxes» → «Chilches / Xilxes»
  const official = r[5].replace(/\s*\/\s*/g, " / ");
  const legacy = byCode.get(code);
  const name = legacy ? (LEGACY_NAME[legacy] ?? official) : official;
  let slug = legacy ?? slugify(official);
  if (!legacy && (used.has(slug) || Object.hasOwn(LEGACY, slug))) slug = `${slug}-${prov}`;
  if (used.has(slug)) throw new Error(`Slug repetido ${slug}`);
  used.add(slug);
  out.push({ slug, name, official, prov, lat: num(r[14]), lng: num(r[13]), pop: Number(r[6]) || 0 });
}
for (const [slug] of Object.entries(LEGACY)) if (!used.has(slug)) throw new Error(`No encuentro la localidad antigua ${slug}`);
out.sort((a, b) => b.pop - a.pop);

const lines = out.map((p) => {
  const alias = p.official !== p.name ? `,${JSON.stringify(p.official)}` : "";
  return `[${JSON.stringify(p.slug)},${JSON.stringify(p.name)},${JSON.stringify(p.prov)},${p.lat},${p.lng},${p.pop}${alias}],`;
});
writeFileSync(
  new URL("../src/lib/localidades-data.ts", import.meta.url),
  `// GENERADO por scripts/build-localidades.mjs: no editar a mano.\n// Municipios de España (CNIG, Nomenclátor Geográfico de Municipios, CC BY 4.0), ordenados por población.\n// [slug, nombre, provincia, lat, lng, habitantes, nombre oficial si difiere]\nexport const MUNICIPIOS: [string, string, string, number, number, number, string?][] = [\n${lines.join("\n")}\n];\n`,
);
console.log(`${out.length} municipios`);
