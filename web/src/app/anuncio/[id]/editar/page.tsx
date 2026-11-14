import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { updateListing } from "@/app/actions/listings";
import { ListingForm } from "@/components/ListingForm";
import { Notice } from "@/components/ui";

export const metadata = { title: "Editar anuncio" };

export default async function Editar({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/anuncio/${id}/editar`);
  const l = await db.listing.findUnique({ where: { id }, include: { photos: { orderBy: { position: "asc" } } } });
  if (!l || l.ownerId !== user.id || l.status === "deleted") notFound();
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="h1">Editar anuncio</h1>
      <Notice error={error} />
      <ListingForm action={updateListing.bind(null, l.id)} d={l} submit="Guardar cambios" photosRequired={false} />
    </div>
  );
}
