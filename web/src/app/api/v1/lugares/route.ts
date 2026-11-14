import { NextResponse, type NextRequest } from "next/server";
import { PLACES, nearestPlace, placeDetail, searchPlaces } from "@/lib/localidades";
import { inSpain } from "@/lib/places";

// Buscador de lugares para los formularios:
//   ?q=xilx            → localidades que coinciden (con &zonas=1 también comunidades y provincias)
//   ?lat=39.78&lng=-0.19 → la localidad más cercana («Usar mi ubicación»)
export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const cache = { headers: { "Cache-Control": "public, max-age=86400" } };
  if (sp.has("lat")) {
    const lat = Number(sp.get("lat"));
    const lng = Number(sp.get("lng"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inSpain(lat, lng)) return NextResponse.json({ place: null });
    const slug = nearestPlace(lat, lng);
    return NextResponse.json({ place: { value: `l:${slug}`, name: PLACES[slug].name, detail: placeDetail(slug) } }, cache);
  }
  const q = (sp.get("q") ?? "").slice(0, 60);
  return NextResponse.json({ hits: searchPlaces(q, { withZones: sp.get("zonas") === "1" }) }, cache);
}
