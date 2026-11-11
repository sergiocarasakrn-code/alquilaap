import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { UserError } from "./errors";

// Fotos y documentos:
// - En producción, en un bucket privado de Cloudflare R2 (o cualquier S3). Variables S3_*.
// - En local, en la carpeta storage-data/.
// Nada se sirve directamente desde el bucket: las fotos de anuncios pasan por /media/... y los
// documentos de identidad solo los ve un administrador.

const MAX = 8 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const EXT_TYPE: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
const KEY_RE = /^(listings|kyc)\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

export const isValidKey = (key: string) => KEY_RE.test(key);

let s3: S3Client | null = null;
function bucket() {
  const { S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET } = process.env;
  if (!S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) return null;
  s3 ??= new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: S3_ENDPOINT || undefined,
    credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
    // Cloudflare R2 no admite todas las sumas de control que el SDK añade por defecto.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return { client: s3, name: S3_BUCKET };
}

const localPath = (key: string) => path.join(process.cwd(), "storage-data", key);

export async function saveImage(file: File, folder: "listings" | "kyc"): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new StorageError("Formato de imagen no permitido (usa JPG, PNG o WebP)");
  if (file.size > MAX) throw new StorageError("La imagen supera 8 MB");
  const key = `${folder}/${randomUUID()}.${ext}`;
  const body = Buffer.from(await file.arrayBuffer());
  const b = bucket();
  if (b) {
    await b.client.send(new PutObjectCommand({ Bucket: b.name, Key: key, Body: body, ContentType: file.type }));
  } else {
    if (process.env.NODE_ENV === "production" && !process.env.ALLOW_LOCAL_STORAGE)
      throw new Error("Falta configurar S3_* para guardar archivos en producción");
    await mkdir(path.dirname(localPath(key)), { recursive: true });
    await writeFile(localPath(key), body);
  }
  // Las fotos de anuncios se enlazan por /media; los documentos se guardan como referencia privada.
  return folder === "kyc" ? `private:${key}` : `/media/${key}`;
}

export async function readImage(key: string): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!isValidKey(key)) return null;
  const contentType = EXT_TYPE[key.split(".").pop()!];
  const b = bucket();
  try {
    if (b) {
      const res = await b.client.send(new GetObjectCommand({ Bucket: b.name, Key: key }));
      if (!res.Body) return null;
      return { body: await res.Body.transformToByteArray(), contentType };
    }
    return { body: await readFile(localPath(key)), contentType };
  } catch {
    return null;
  }
}

export class StorageError extends UserError {}
