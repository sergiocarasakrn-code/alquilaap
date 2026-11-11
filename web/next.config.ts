import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "20mb" } }, // fotos de anuncios y del DNI
};
export default config;
