import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";

export const dynamic = "force-dynamic"; // APP_URL se lee al arrancar, no al construir

// Google puede leer todo lo público; las zonas privadas o de cuenta no aportan nada en los resultados.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/mensajes", "/reservas", "/perfil", "/mis-anuncios", "/publicar", "/destacar", "/pago-simulado", "/i/", "/anuncio/*/editar"],
    },
    sitemap: abs("/sitemap.xml"),
  };
}
