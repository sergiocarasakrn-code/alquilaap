import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";

vi.mock("server-only", () => ({}));
const { isHeif, prepareImage, ImageError } = await import("../src/lib/images");

describe("preparar fotos", () => {
  it("convierte una foto HEIC de iPhone a JPEG y la reduce", async () => {
    const heic = await readFile(path.join(__dirname, "fixtures/sample.heic")); // 3000×2000
    expect(isHeif(heic)).toBe(true);
    const out = await prepareImage(heic, 1920);
    const meta = await sharp(out.body).metadata();
    expect(out.type).toBe("image/jpeg");
    expect(meta.format).toBe("jpeg");
    expect(Math.max(meta.width!, meta.height!)).toBe(1920);
  });

  it("quita la ubicación GPS y endereza la foto", async () => {
    // 400×200 con orientación 6 (girada 90°) y coordenadas GPS en el EXIF.
    const jpg = await sharp({ create: { width: 400, height: 200, channels: 3, background: "#0f6b5c" } })
      .jpeg()
      .withExif({ IFD3: { GPSLatitudeRef: "N", GPSLatitude: "39/1 28/1 0/1" } })
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const before = await sharp(jpg).metadata();
    expect(before.orientation).toBe(6);
    expect(before.exif).toBeDefined();
    const out = await prepareImage(jpg, 1920);
    const meta = await sharp(out.body).metadata();
    expect(meta.exif).toBeUndefined();
    expect([meta.width, meta.height]).toEqual([200, 400]);
  });

  it("no agranda fotos pequeñas y rechaza archivos que no son fotos", async () => {
    const png = await sharp({ create: { width: 300, height: 300, channels: 4, background: "#ffffff00" } }).png().toBuffer();
    expect((await sharp((await prepareImage(png, 1920)).body).metadata()).width).toBe(300);
    await expect(prepareImage(Buffer.from("esto no es una foto"), 1920)).rejects.toBeInstanceOf(ImageError);
  });
});
