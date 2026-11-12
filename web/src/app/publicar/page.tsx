import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createListing } from "@/app/actions/listings";
import { ListingForm } from "@/components/ListingForm";
import { Notice } from "@/components/ui";

export const metadata = { title: "Publicar un anuncio" };

export default async function Publicar({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser("/publicar");
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="h1">Publica un objeto</h1>
      <Notice error={error} />
      {user.kycStatus !== "verified" && (
        <div className="card flex flex-wrap items-center gap-3 border-ok/30 bg-ok-soft p-4 text-sm">
          <p className="min-w-0 flex-1">
            <span className="font-semibold">Consejo:</span> los anuncios de personas con la identidad verificada llevan el sello «✓ Verificado» y reciben más
            reservas. Es opcional y solo se hace una vez.
          </p>
          <Link href="/perfil#verificacion" className="btn-ghost">
            Verificarme
          </Link>
        </div>
      )}
      <ListingForm action={createListing} submit="Publicar gratis" photosRequired />
    </div>
  );
}
