import Link from "next/link";
import type { ListingCard as Card } from "@/lib/listings";
import { categoryName, CATEGORIES, subcategoriesOf } from "@/lib/config";
import { CategoryIcon } from "./CategoryIcon";
import { money } from "@/lib/format";
import { STATUS_LABEL, type Status } from "@/lib/booking-rules";

export function Notice({ error, ok }: { error?: string | string[]; ok?: string }) {
  const e = Array.isArray(error) ? error[0] : error;
  if (e)
    return (
      <p role="alert" className="mb-4 rounded-xl border border-bad/30 bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
        {e}
      </p>
    );
  if (ok) return <p className="mb-4 rounded-xl border border-ok/30 bg-ok-soft px-4 py-3 text-sm font-medium text-ok">{ok}</p>;
  return null;
}

export function ListingCard({ l }: { l: Card }) {
  const photo = l.photos[0]?.url;
  return (
    <Link href={`/anuncio/${l.id}`} className="card group overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-[4/3] bg-surface-2">
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" />
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          {l.featured && <span className="pill bg-tag text-tag-ink">Destacado</span>}
          {l.ownerPro && <span className="pill bg-brand text-brand-ink">Tienda Pro</span>}
        </div>
      </div>
      <div className="p-3">
        <p className="line-clamp-1 font-semibold">{l.title}</p>
        <p className="mt-0.5 text-sm text-ink-3">
          {categoryName(l.category)} · {l.city}
          {l.distanceKm !== undefined && ` · ${l.distanceKm < 1 ? "<1" : Math.round(l.distanceKm)} km`}
        </p>
        <p className="mt-1.5 flex items-baseline justify-between gap-2">
          <span>
            <span className="font-display text-lg font-extrabold">{money(l.pricePerDayCents)}</span>
            <span className="text-sm text-ink-3"> / día</span>
          </span>
          {l.owner.kycStatus === "verified" && (
            <span className="shrink-0 text-xs font-semibold text-ok" title="Identidad verificada">
              ✓ Verificado
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

export function ListingGrid({ items, empty }: { items: Card[]; empty?: React.ReactNode }) {
  if (!items.length) return <div className="card p-8 text-center text-ink-2">{empty ?? "No hay anuncios todavía."}</div>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((l) => (
        <ListingCard key={l.id} l={l} />
      ))}
    </div>
  );
}

export function CategoryChips({ active, activeSub, zone }: { active?: string; activeSub?: string; zone?: Record<string, string> }) {
  const href = (slug?: string, sub?: string) => {
    const p = new URLSearchParams();
    if (slug) p.set("cat", slug);
    if (sub) p.set("sub", sub);
    for (const [k, v] of Object.entries(zone ?? {})) p.set(k, v);
    const s = p.toString();
    return `/buscar${s ? "?" + s : ""}`;
  };
  const chip = (on: boolean) => `pill shrink-0 border px-3 py-1.5 text-sm ${on ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface"}`;
  const subs = active ? subcategoriesOf(active) : [];
  return (
    <div className="space-y-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <Link href="/categorias" className={chip(false)}>
          <CategoryIcon slug="todas" className="h-4 w-4" /> Categorías
        </Link>
        <Link href={href()} className={chip(!active)}>
          Todo
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={href(c.slug)} className={chip(active === c.slug)}>
            <CategoryIcon slug={c.slug} className="h-4 w-4" /> {c.name}
          </Link>
        ))}
      </div>
      {subs.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Link href={href(active)} className={chip(!activeSub)}>
            Todo en {categoryName(active!)}
          </Link>
          {subs.map((s) => (
            <Link key={s.slug} href={href(active, s.slug)} className={chip(activeSub === s.slug)}>
              {s.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const PILL: Record<Status, string> = {
  requested: "bg-warn-soft text-warn",
  accepted: "bg-brand-soft text-brand",
  in_progress: "bg-brand text-brand-ink",
  completed: "bg-ok-soft text-ok",
  incident: "bg-bad-soft text-bad",
  declined: "bg-surface-2 text-ink-3",
  cancelled: "bg-surface-2 text-ink-3",
  expired: "bg-surface-2 text-ink-3",
};
export const StatusPill = ({ s }: { s: Status }) => <span className={`pill ${PILL[s]}`}>{STATUS_LABEL[s]}</span>;

export function Trust({ stats, verified, pro }: { stats: { completed: number; reviews: number; rating: number | null }; verified: boolean; pro?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
      {verified ? <span className="pill bg-ok-soft text-ok">✓ Identidad verificada</span> : <span className="pill bg-surface-2 text-ink-3">Sin verificar</span>}
      {pro && <span className="pill bg-brand text-brand-ink">Tienda Pro</span>}
      <span>
        {stats.rating ? `★ ${stats.rating.toLocaleString("es-ES")} (${stats.reviews})` : "Sin reseñas aún"} · {stats.completed} alquileres finalizados
      </span>
    </div>
  );
}

export const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
