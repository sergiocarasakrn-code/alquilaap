import "server-only";
import sharp from "sharp";
import convertHeic from "heic-convert";

// Prepara las fotos antes de guardarlas:
// - acepta HEIC/HEIF (fotos de iPhone) y las pasa a JPEG,
// - endereza según la orientación de la cámara,
// - reduce las fotos grandes para que carguen rápido,
// - quita los metadatos (EXIF), incluida la ubicación GPS de donde se hizo la foto.

const HEIF_BRANDS = ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"];

export function isHeif(buf: Uint8Array) {
  if (buf.length < 12) return false;
  const tag = Buffer.from(buf.subarray(4, 8)).toString("ascii");
  const brand = Buffer.from(buf.subarray(8, 12)).toString("ascii");
  return tag === "ftyp" && HEIF_BRANDS.includes(brand);
}

export class ImageError extends Error {}

export async function prepareImage(input: Buffer, maxSide: number): Promise<{ body: Buffer; type: "image/jpeg"; ext: "jpg" }> {
  let src = input;
  if (isHeif(src)) {
    try {
      src = Buffer.from(await convertHeic({ buffer: src as unknown as ArrayBuffer, format: "JPEG", quality: 0.92 }));
    } catch {
      throw new ImageError("No hemos podido leer la foto HEIC. Prueba a hacerle una captura o exportarla como JPG.");
    }
  }
  try {
    const body = await sharp(src, { failOn: "error" })
      .rotate()
      .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    return { body, type: "image/jpeg", ext: "jpg" };
  } catch {
    throw new ImageError("Ese archivo no parece una foto válida. Usa JPG, PNG, WebP o HEIC.");
  }
}
