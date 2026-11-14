import Link from "next/link";
import type { Metadata } from "next";
import { categoryName, isCategory, isSubcategory, subcategoryName } from "@/lib/config";
import { parseZone, zoneParams } from "@/lib/zone";
import { ZoneFields } from "@/components/ZoneFields";
import { searchListings } from "@/lib/listings";
import { CategoryChips, ListingGrid, first } from "@/components/ui";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const cat = first(sp.cat);
  const zone = parseZone(sp);
  const subName = isCategory(cat) ? subcategoryName(cat, first(sp.sub)) : undefined;
  const parts = [isCategory(cat) ? `Alquiler de ${(subName ?? categoryName(cat)).toLowerCase()}` : "Alquila objetos", zone.label && !zone.mine ? `en ${zone.label}` : ""];
  return { title: parts.join(" ").trim() };
}

export default async function Buscar({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = first(sp.q) ?? "";
  const cat = first(sp.cat);
  const sub = isCategory(cat) && isSubcategory(cat, first(sp.sub)) ? first(sp.sub) : undefined;
  const zone = parseZone(sp);
  const page = Number(first(sp.p) ?? 1) || 1;
  const res = await searchListings({ q, category: isCategory(cat) ? cat : undefined, subcategory: sub, placeSlugs: zone.placeSlugs, center: zone.center, km: zone.km, page });
  const zoneQuery = new URLSearchParams();
  zoneParams(zone, zoneQuery);
  const zoneObj = Object.fromEntries(zoneQuery);
  const pageHref = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (cat) u.set("cat", cat);
    if (sub) u.set("sub", sub);
    zoneParams(zone, u);
    u.set("p", String(p));
    return `/buscar?${u}`;
  };
  return (
    <div className="space-y-4">
      <form className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" action="/buscar">
        <input name="q" defaultValue={q} className="input sm:min-w-56 sm:flex-1" placeholder="¿Qué necesitas alquilar?" aria-label="Buscar" />
        {cat && <input type="hidden" name="cat" value={cat} />}
        {sub && <input type="hidden" name="sub" value={sub} />}
        <ZoneFields zone={zone.value} zoneName={zone.name} km={zone.km} mine={zone.mine ? zone.center : undefined} />
        <button className="btn-primary">Buscar</button>
      </form>
      <CategoryChips active={isCategory(cat) ? cat : undefined} activeSub={sub} zone={zoneObj} />
      <p className="text-sm text-ink-3">
        {res.total} {res.total === 1 ? "resultado" : "resultados"}
        {isCategory(cat) && ` en ${categoryName(cat)}`}
        {isCategory(cat) && sub && ` › ${subcategoryName(cat, sub)}`}
        {zone.label && ` · ${zone.label}`}
      </p>
      <ListingGrid items={res.items} empty={zone.km ? "No hay anuncios tan cerca. Prueba con más distancia u otra categoría." : "No hay anuncios con esos filtros. Prueba otra zona o categoría."} />
      {res.pages > 1 && (
        <nav className="flex justify-center gap-2 pt-2">
          {res.page > 1 && (
            <Link className="btn-ghost" href={pageHref(res.page - 1)}>
              Anterior
            </Link>
          )}
          <span className="btn">
            {res.page} / {res.pages}
          </span>
          {res.page < res.pages && (
            <Link className="btn-ghost" href={pageHref(res.page + 1)}>
              Siguiente
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
