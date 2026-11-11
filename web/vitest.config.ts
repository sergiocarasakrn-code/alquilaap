import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src"), "server-only": path.resolve(__dirname, "tests/server-only-stub.ts") } },
  test: {
    environment: "node",
    fileParallelism: false,
    // Las pruebas de base de datos usan TEST_DATABASE_URL (nunca la base de datos de desarrollo).
    env: process.env.TEST_DATABASE_URL ? { DATABASE_URL: process.env.TEST_DATABASE_URL, ID_HASH_SECRET: "test" } : { ID_HASH_SECRET: "test" },
  },
});
