import { NextResponse, type NextRequest } from "next/server";

// Una sola dirección para Google: alquilaap.com (sin www) redirige siempre a https://www.alquilaap.com,
// así no hay dos copias de cada página compitiendo en los resultados.
// /.well-known queda fuera: Android comprueba ahí la app de Google Play y no sigue redirecciones.
const APEX = "alquilaap.com";
const CANONICAL = "https://www.alquilaap.com";

export function middleware(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (host !== APEX) return NextResponse.next();
  const { pathname, search } = req.nextUrl;
  return NextResponse.redirect(`${CANONICAL}${pathname}${search}`, 308);
}

export const config = { matcher: ["/((?!\\.well-known/|_next/static|_next/image).*)"] };
