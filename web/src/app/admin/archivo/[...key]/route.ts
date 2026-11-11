import { currentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { readImage } from "@/lib/storage";

// Documentos de identidad: solo para administradores y sin caché.
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const user = await currentUser();
  if (!user || !isAdmin(user)) return new Response("No encontrado", { status: 404 });
  const img = await readImage((await params).key.join("/"));
  if (!img) return new Response("No encontrado", { status: 404 });
  return new Response(Buffer.from(img.body), { headers: { "Content-Type": img.contentType, "Cache-Control": "private, no-store" } });
}
