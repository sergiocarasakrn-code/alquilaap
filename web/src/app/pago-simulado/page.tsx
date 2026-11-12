import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { devPaymentsAllowed } from "@/lib/stripe";
import { PACKS, PAID_FEATURES, type PackCode } from "@/lib/config";
import { money } from "@/lib/format";
import { confirmDevPayment } from "@/app/actions/account";

// Solo en desarrollo y sin claves de Stripe: sustituye a la pantalla de pago de Stripe.
export default async function PagoSimulado({ searchParams }: { searchParams: Promise<{ compra?: string }> }) {
  if (!PAID_FEATURES || !devPaymentsAllowed()) notFound();
  const { compra } = await searchParams;
  const user = await requireUser("/mis-anuncios");
  const p = compra ? await db.packPurchase.findUnique({ where: { id: compra }, include: { listing: true } }) : null;
  if (!p || p.userId !== user.id) notFound();
  return (
    <div className="card mx-auto max-w-md space-y-3 p-6">
      <p className="pill bg-warn-soft text-warn">Modo prueba: no se cobra nada</p>
      <h1 className="h2">
        {PACKS[p.packCode as PackCode].name} · {money(p.amountCents)}
      </h1>
      <p className="text-ink-2">{p.listing.title}</p>
      <form action={confirmDevPayment.bind(null, p.id)}>
        <button className="btn-primary w-full">Simular pago correcto</button>
      </form>
    </div>
  );
}
