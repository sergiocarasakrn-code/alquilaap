import type { MetadataRoute } from "next";

// Manifiesto de la app instalable. También es la base de la app de Android para Google Play (TWA):
// la app de Play Store abre esta web a pantalla completa.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Alquilaap: alquila cerca de ti",
    short_name: "Alquilaap",
    description: "Alquila bicis, herramientas, camping y mucho más a gente de tu ciudad. Publicar y alquilar es gratis.",
    start_url: "/?fuente=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f6f2",
    theme_color: "#0f6b5c",
    lang: "es",
    dir: "ltr",
    categories: ["shopping", "lifestyle", "business"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "Publicar un anuncio", url: "/publicar", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Mensajes", url: "/mensajes", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Mis reservas", url: "/reservas", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
