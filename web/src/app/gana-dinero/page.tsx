import Link from "next/link";
import { RentCalculator } from "@/components/RentCalculator";

export const metadata = {
  title: "Gana dinero alquilando",
  description: "Alquila lo que no usas o compra para alquilar. Calcula en cuántos meses lo amortizas con Alquilaap, gratis y sin comisiones.",
};

const WAYS = [
  ["¿Lo tienes guardado?", "Bicis, herramientas, cámaras, camping… Lo que usas pocas veces al año puede darte ingresos el resto del tiempo."],
  ["¿Buscas un pequeño negocio?", "Compra algo que se alquile mucho en tu zona y recupera la inversión en pocos meses. Publicarlo es gratis."],
  ["Sin comisiones", "Todo lo que cobras es para ti: el alquiler se paga en mano y Alquilaap no se queda nada."],
];

const TIPS = [
  "Mira qué se busca en tu ciudad y a qué precio se alquila antes de comprar.",
  "Fotos claras, buena descripción y respuesta rápida por el chat: es lo que más reservas trae.",
  "Pide fianza y activa «Solo usuarios verificados» si el objeto es caro.",
  "Revisa el objeto en cada devolución antes de marcar «finalizado».",
];

export default function GanaDinero() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="space-y-3">
        <h1 className="h1">Gana dinero alquilando</h1>
        <p className="text-ink-2">Alquila lo que no usas, o compra pensando en alquilarlo y conviértelo en una fuente de ingresos.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {WAYS.map(([t, d]) => (
          <div key={t} className="card p-4">
            <p className="font-semibold">{t}</p>
            <p className="mt-1 text-sm text-ink-2">{d}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="h2">¿En cuánto tiempo lo amortizas?</h2>
        <RentCalculator />
      </section>

      <section className="space-y-3">
        <h2 className="h2">Consejos para alquilar más</h2>
        <ul className="card list-disc space-y-1 p-5 pl-9 text-ink-2">
          {TIPS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <p className="card p-4 text-sm text-ink-2">
        <strong>Impuestos:</strong> los ingresos por alquiler se declaran en la renta. Si alquilas de forma habitual como negocio, puede que tengas que darte de alta como
        autónomo. Consulta con tu asesor o con la Agencia Tributaria.
      </p>

      <div className="flex flex-wrap gap-2">
        <Link href="/publicar" className="btn-primary">
          Publicar gratis
        </Link>
        <Link href="/buscar" className="btn-ghost">
          Ver qué se alquila
        </Link>
      </div>
    </div>
  );
}
