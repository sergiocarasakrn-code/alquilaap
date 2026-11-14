import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { myListings } from "@/lib/listings";
import { setListingStatus } from "@/app/actions/listings";
import { categoryName, PAID_FEATURES } from "@/lib/config";
import { packName } from "@/lib/ranking";
import { money, shortDate } from "@/lib/format";
import { Notice, first } from "@/components/ui";

export const metadata = { title: "Mis anuncios" };

export default async function MisAnuncios({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/mis-anuncios");
  const sp = await searchParams;
  const items = await myListings(user.id);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="h1">Mis anuncios</h1>
        <Link href="/publicar" className="btn-primary">
          Publicar
        </Link>
      </div>
      <Notice error={sp.error} ok={first(sp.pagado) ? "Pago recibido: tu anuncio ya está destacado." : undefined} />
      {items.length === 0 && <div className="card p-8 text-center text-ink-2">Aún no tienes anuncios.</div>}
      <ul className="space-y-3">
        {items.map((l) => {
          const pack = l.packPurchases.sort((a, b) => b.endsAt!.getTime() - a.endsAt!.getTime())[0];
          return (
            <li key={l.id} className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              <Link href={`/anuncio/${l.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.photos[0]?.url} alt="" className="h-16 w-20 shrink-0 rounded-xl bg-surface-2 object-cover" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{l.title}</p>
                  <p className="text-sm text-ink-3">
                    {categoryName(l.category)} · {l.city} · {money(l.pricePerDayCents)}/día
                  </p>
                  <p className="mt-1 flex flex-wrap gap-1">
                    {l.status === "paused" && <span className="pill bg-surface-2 text-ink-3">En pausa</span>}
                    {pack ? (
                      <span className="pill bg-tag-soft text-tag-ink">
                        {packName(pack.packCode)} hasta {shortDate(pack.endsAt!)}
                      </span>
                    ) : (
                      PAID_FEATURES && <span className="pill bg-surface-2 text-ink-3">Visibilidad normal (gratis)</span>
                    )}
                  </p>
                </div>
              </Link>
              <div className="flex flex-wrap gap-2">
                {PAID_FEATURES && (
                  <Link href={`/destacar/${l.id}`} className="btn bg-tag text-tag-ink">
                    Destacar
                  </Link>
                )}
                <Link href={`/anuncio/${l.id}/editar`} className="btn-ghost">
                  Editar
                </Link>
                <form action={setListingStatus.bind(null, l.id, l.status === "paused" ? "active" : "paused")}>
                  <button className="btn-ghost">{l.status === "paused" ? "Reactivar" : "Pausar"}</button>
                </form>
                <form action={setListingStatus.bind(null, l.id, "deleted")}>
                  <button className="btn-danger">Borrar</button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
