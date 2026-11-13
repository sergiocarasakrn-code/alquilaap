import type { NextConfig } from "next";

const config: NextConfig = {
  // heic-convert carga un módulo WebAssembly: mejor sin empaquetar.
  serverExternalPackages: ["heic-convert", "sharp"],
  experimental: { serverActions: { bodySizeLimit: "80mb" } }, // fotos de anuncios y del DNI
};
export default config;
