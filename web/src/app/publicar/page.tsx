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
      {user.kycStatus !== "verified" ? (
        <div className="card space-y-3 p-5">
          <p>Para evitar robos, todas las personas que publican tienen la identidad verificada. Solo se hace una vez.</p>
          <Link href="/perfil#verificacion" className="btn-primary">
            Verificar mi identidad
          </Link>
        </div>
      ) : (
        <ListingForm action={createListing} submit="Publicar gratis" photosRequired />
      )}
    </div>
  );
}
