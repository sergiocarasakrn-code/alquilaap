import { currentUser, isProUser } from "@/lib/auth";
import { PRO_PLAN } from "@/lib/config";
import { money } from "@/lib/format";
import { subscribePro } from "@/app/actions/account";
import { Notice } from "@/components/ui";

export const metadata = { title: "Alquilaap Pro para tiendas" };

export default async function Pro({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await currentUser();
  const { error } = await searchParams;
  const active = user ? isProUser(user) : false;
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="h1">{PRO_PLAN.name}</h1>
      <p className="text-ink-2">Para tiendas de alquiler y personas que alquilan a menudo.</p>
      <Notice error={error} />
      <div className="card space-y-4 border-2 border-brand p-6">
        <p>
          <span className="font-display text-4xl font-extrabold">{money(PRO_PLAN.priceCents)}</span>
          <span className="text-ink-3"> / mes</span>
        </p>
        <ul className="space-y-1 text-ink-2">
          {PRO_PLAN.perks.map((p) => (
            <li key={p}>✓ {p}</li>
          ))}
        </ul>
        {active ? (
          <p className="pill bg-ok-soft text-ok">Ya tienes Pro activo</p>
        ) : (
          <form action={subscribePro}>
            <button className="btn-primary w-full">{user ? "Hazte Pro" : "Entra para hacerte Pro"}</button>
          </form>
        )}
        <p className="text-xs text-ink-3">Sin permanencia. Cancela cuando quieras. Sin comisiones por alquiler.</p>
      </div>
    </div>
  );
}
