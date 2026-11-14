import Link from "next/link";
import { register } from "@/app/actions/auth";
import { cookies } from "next/headers";
import { REF_COOKIE, safeNext } from "@/lib/auth";
import { inviterByCode } from "@/lib/referrals";
import { Notice } from "@/components/ui";

export const metadata = { title: "Crear cuenta" };

export default async function Registro({ searchParams }: { searchParams: Promise<{ error?: string; next?: string; ref?: string }> }) {
  const { error, next, ref } = await searchParams;
  const n = safeNext(next);
  const refCode = ref ?? (await cookies()).get(REF_COOKIE)?.value;
  const inviter = refCode ? await inviterByCode(refCode) : null;
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="h1">Crea tu cuenta</h1>
      {inviter && (
        <p className="rounded-xl border border-ok/30 bg-ok-soft px-4 py-3 text-sm font-medium text-ok">
          {inviter.name.split(" ")[0]} te ha invitado a Alquilaap. Crea tu cuenta gratis y publica lo que quieras alquilar.
        </p>
      )}
      <Notice error={error} />
      <form action={register} className="card space-y-3 p-5">
        <input type="hidden" name="next" value={n} />
        {inviter && <input type="hidden" name="ref" value={refCode} />}
        <label className="block">
          <span className="label">Nombre</span>
          <input name="name" required autoComplete="name" className="input" />
        </label>
        <label className="block">
          <span className="label">Email</span>
          <input name="email" type="email" required autoComplete="email" className="input" />
        </label>
        <label className="block">
          <span className="label">Contraseña (mínimo 8 caracteres)</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </label>
        <label className="flex items-start gap-2 text-sm text-ink-2">
          <input type="checkbox" name="terms" required className="mt-0.5" />
          <span>
            Acepto las{" "}
            <Link href="/condiciones" target="_blank" className="font-semibold text-brand">
              condiciones de uso
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" target="_blank" className="font-semibold text-brand">
              política de privacidad
            </Link>
            .
          </span>
        </label>
        <button className="btn-primary w-full">Crear cuenta gratis</button>
      </form>
      <p className="text-center text-sm text-ink-2">
        ¿Ya tienes cuenta?{" "}
        <Link href={`/entrar?next=${encodeURIComponent(n)}`} className="font-semibold text-brand">
          Entra
        </Link>
      </p>
    </div>
  );
}
