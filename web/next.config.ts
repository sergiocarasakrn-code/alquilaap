import type { NextConfig } from "next";

const config: NextConfig = {
  // heic-convert carga un módulo WebAssembly: mejor sin empaquetar.
  serverExternalPackages: ["heic-convert", "sharp"],
  experimental: { serverActions: { bodySizeLimit: "170mb" } }, // hasta 8 fotos de móvil por anuncio (20 MB cada una) y las del DNI
};
export default config;
