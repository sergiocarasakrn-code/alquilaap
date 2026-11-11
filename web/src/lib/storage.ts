import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

// Fase 1: fotos en disco local. En producción se cambia por S3/R2 sin tocar el resto de la app.
const MAX = 8 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function saveImage(file: File, folder: "listings" | "kyc"): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new Error("Formato de imagen no permitido (usa JPG, PNG o WebP)");
  if (file.size > MAX) throw new Error("La imagen supera 8 MB");
  // Los documentos de identidad nunca se sirven públicamente.
  const isKyc = folder === "kyc";
  const dir = isKyc ? path.join(process.cwd(), "private-uploads", "kyc") : path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return isKyc ? `private:kyc/${name}` : `/uploads/${folder}/${name}`;
}
