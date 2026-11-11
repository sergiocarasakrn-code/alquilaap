import Link from "next/link";
import { CATEGORIES, CITIES } from "@/lib/config";
import { featuredListings, recentListings } from "@/lib/listings";
import { ListingGrid } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, recent] = await Promise.all([featuredListings(8), recentListings(12)]);
  return (
    <div className="space-y-10">
      <section className="card overflow-hidden bg-brand-soft p-6 sm:p-10">
        <h1 className="h1 max-w-2xl">Alquila lo que necesitas a gente de tu ciudad</h1>
        <p className="mt-3 max-w-xl text-ink-2">Bicis, herramientas, camping, cámaras y mucho más. Publicar y alquilar es gratis, y el alquiler se paga en mano.</p>
        <form action="/buscar" className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
          <input name="q" className="input flex-1" placeholder="Busca: taladro, tienda de campaña, bici eléctrica…" aria-label="Qué buscas" />
          <select name="ciudad" className="input sm:w-44" aria-label="Ciudad" defaultValue="">
            <option value="">Toda España</option>
            {Object.entries(CITIES).map(([slug, c]) => (
              <option key={slug} value={slug}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="btn-primary">Buscar</button>
        </form>
      </section>

      <section>
        <h2 className="h2 mb-3">Categorías</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/buscar?cat=${c.slug}`} className="card px-3 py-4 text-center text-sm font-semibold hover:border-brand">
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
