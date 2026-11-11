import Link from "next/link";
import { CATEGORIES } from "@/lib/config";
import { ZoneFields } from "@/components/ZoneFields";
import { featuredListings, recentListings } from "@/lib/listings";
import { ListingGrid } from "@/components/ui";
import { CategoryIcon } from "@/components/CategoryIcon";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, recent] = await Promise.all([featuredListings(8), recentListings(12)]);
  return (
    <div className="space-y-10">
      <section className="card overflow-hidden bg-brand-soft p-6 sm:p-10">
        <h1 className="h1 max-w-2xl">Alquila lo que necesitas a gente de tu ciudad</h1>
        <p className="mt-3 max-w-xl text-ink-2">Bicis, herramientas, camping, cámaras y mucho más. Publicar y alquilar es gratis, y el alquiler se paga en mano.</p>
        <form action="/buscar" className="mt-6 flex max-w-3xl flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input name="q" className="input sm:min-w-64 sm:flex-1" placeholder="Busca: taladro, tienda de campaña, bici eléctrica…" aria-label="Qué buscas" />
          <ZoneFields withDistance={false} />
          <button className="btn-primary">Buscar</button>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="h2">Categorías</h2>
          <Link href="/categorias" className="text-sm font-semibold text-brand">
            Ver todas
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/buscar?cat=${c.slug}`} className="card flex flex-col items-center gap-2 px-2 py-4 text-center text-sm font-medium hover:border-brand">
              <CategoryIcon slug={c.slug} className="h-8 w-8" />
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section>
          <h2 className="h2 mb-3">Destacados</h2>
          <ListingGrid items={featured} />
        </section>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="h2">Recién publicados</h2>
          <Link href="/buscar" className="text-sm font-semibold text-brand">
            Ver todo
          </Link>
        </div>
        <ListingGrid items={recent} empty={<>Aún no hay anuncios. <Link className="font-semibold text-brand" href="/publicar">Publica el primero</Link>.</>} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["1. Reserva", "Elige fechas y envía la solicitud. Todos los usuarios tienen la identidad verificada."],
          ["2. Recoge y marca «alquilado»", "Al entregar el objeto, los dos lo marcáis en la app. El alquiler y la fianza se pagan en mano."],
          ["3. Devuelve y marca «finalizado»", "Cuando los dos lo marcáis, queda certificado que se devolvió en buen estado. Después, os valoráis."],
        ].map(([t, d]) => (
          <div key={t} className="card p-5">
            <p className="font-semibold">{t}</p>
            <p className="mt-1 text-sm text-ink-2">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
