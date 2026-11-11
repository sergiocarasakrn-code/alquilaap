import type { MetadataRoute } from "next";

// La web se puede instalar en el móvil como app (PWA) mientras llegan las apps nativas.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alquilaap",
    short_name: "Alquilaap",
    description: "Alquila lo que necesitas a gente de tu ciudad",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f2",
    theme_color: "#0f6b5c",
    lang: "es",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
