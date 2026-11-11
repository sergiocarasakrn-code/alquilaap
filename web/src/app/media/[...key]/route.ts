import { readImage } from "@/lib/storage";

// Fotos públicas de anuncios. Los documentos de identidad (kyc/) nunca se sirven aquí.
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  if (!key.startsWith("listings/")) return new Response("No encontrado", { status: 404 });
  const img = await readImage(key);
  if (!img) return new Response("No encontrado", { status: 404 });
  return new Response(Buffer.from(img.body), {
    headers: { "Content-Type": img.contentType, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
