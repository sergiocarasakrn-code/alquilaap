import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PACK_LIST, PAID_FEATURES } from "@/lib/config";
import { money } from "@/lib/format";
import { buyPack } from "@/app/actions/account";
import { Notice } from "@/components/ui";

export const metadata = { title: "Destacar anuncio" };

export default async function Destacar({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  if (!PAID_FEATURES) notFound();
  const { id } = await params;
  const user = await requireUser(`/destacar/${id}`);
  const l = await db.listing.findUnique({ where: { id } });
  if (!l || l.ownerId !== user.id || l.status === "deleted") notFound();
  const { error } = await searchParams;
  // Una clave por visita: si se pulsa dos veces o se recarga tras pagar, no se cobra dos veces.
  const key = randomUUID();
  return (
    <div className="space-y-4">
      <h1 className="h1">Destaca «{l.title}»</h1>
      <p className="text-ink-2">Tu anuncio ya se ve gratis. Con un pack sale antes en las búsquedas y en la portada.</p>
      <Notice error={error} />
      <div className="grid gap-3 md:grid-cols-3">
        {PACK_LIST.map((p) => (
          <form key={p.code} action={buyPack.bind(null, l.id)} className={`card flex flex-col p-5 ${p.popular ? "border-2 border-brand" : ""}`}>
            <input type="hidden" name="pack" value={p.code} />
            <input type="hidden" name="idempotencyKey" value={`${key}-${p.code}`} />
            {p.popular && <span className="pill mb-2 self-start bg-brand text-brand-ink">El más elegido</span>}
            <p className="font-semibold">{p.name}</p>
            <p className="font-display text-3xl font-extrabold">{money(p.priceCents)}</p>
            <ul className="my-4 flex-1 space-y-1 text-sm text-ink-2">
              {p.perks.map((x) => (
                <li key={x}>✓ {x}</li>
              ))}
            </ul>
            <button className={p.popular ? "btn-primary" : "btn-ghost"}>Destacar por {money(p.priceCents)}</button>
          </form>
        ))}
      </div>
      <p className="text-xs text-ink-3">Pago seguro con Stripe. Pago único, sin renovación automática.</p>
    </div>
  );
}
