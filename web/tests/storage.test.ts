import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("subida de fotos", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("limpia el endpoint que copia Cloudflare (con el bucket al final o sin https)", async () => {
    const { endpointOrigin } = await import("../src/lib/storage");
    expect(endpointOrigin("https://abc123.r2.cloudflarestorage.com/alquilaap")).toBe("https://abc123.r2.cloudflarestorage.com");
    expect(endpointOrigin(" abc123.r2.cloudflarestorage.com ")).toBe("https://abc123.r2.cloudflarestorage.com");
  });

  it("si el almacenamiento falla, da un aviso claro en vez de romper la página", async () => {
    vi.stubEnv("S3_ENDPOINT", "http://127.0.0.1:9");
    vi.stubEnv("S3_BUCKET", "alquilaap");
    vi.stubEnv("S3_ACCESS_KEY_ID", "x");
    vi.stubEnv("S3_SECRET_ACCESS_KEY", "y");
    const { saveImage, StorageError } = await import("../src/lib/storage");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const file = new File([new Uint8Array([1, 2, 3])], "a.jpg", { type: "image/jpeg" });
    await expect(saveImage(file, "listings")).rejects.toBeInstanceOf(StorageError);
  });
});
