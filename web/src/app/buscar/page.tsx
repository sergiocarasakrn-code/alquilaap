import Link from "next/link";
import type { Metadata } from "next";
import { CITIES, categoryName, isCategory, isCity } from "@/lib/config";
import { searchListings } from "@/lib/listings";
import { CategoryChips, ListingGrid, first } from "@/components/ui";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const cat = first(sp.cat);
  const city = first(sp.ciudad);
  const parts = [isCategory(cat) ? `Alquiler de ${categoryName(cat).toLowerCase()}` : "Alquila objetos", isCity(city) ? `en ${CITIES[city].name}` : ""];
  return { title: parts.join(" ").trim() };
}

export default async function Buscar({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = first(sp.q) ?? "";
  const cat = first(sp.cat);
  const city = first(sp.ciudad);
  const page = Number(first(sp.p) ?? 1) || 1;
  const res = await searchListings({ q, category: isCategory(cat) ? cat : undefined, citySlug: isCity(city) ? city : undefined, page });
  const pageHref = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (cat) u.set("cat", cat);
    if (city) u.set("ciudad", city);
    u.set("p", String(p));
    return `/buscar?${u}`;
  };
  return (
    <div className="space-y-4">
      <form className="flex flex-col gap-2 sm:flex-row" action="/buscar">
        <input name="q" defaultValue={q} className="input flex-1" placeholder="¿Qué necesitas alquilar?" aria-label="Buscar" />
        {cat && <input type="hidden" name="cat" value={cat} />}
        <select name="ciudad" defaultValue={city ?? ""} className="input sm:w-48" aria-label="Ciudad">
          <option value="">Toda España</option>
          {Object.entries(CITIES).map(([slug, c]) => (
            <option key={slug} value={slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="btn-primary">Buscar</button>
      </form>
      <CategoryChips active={isCategory(cat) ? cat : undefined} city={isCity(city) ? city : undefined} />
      <p className="text-sm text-ink-3">
        {res.total} {res.total === 1 ? "resultado" : "resultados"}
        {isCategory(cat) && ` en ${categoryName(cat)}`}
        {isCity(city) && ` · ${CITIES[city].name}`}
      </p>
      <ListingGrid items={res.items} empty="No hay anuncios con esos filtros. Prueba otra ciudad o categoría." />
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
