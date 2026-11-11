import Link from "next/link";
import { login } from "@/app/actions/auth";
import { safeNext } from "@/lib/auth";
import { Notice } from "@/components/ui";

export const metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const n = safeNext(next);
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="h1">Entrar</h1>
      <Notice error={error} />
      <form action={login} className="card space-y-3 p-5">
        <input type="hidden" name="next" value={n} />
        <label className="block">
          <span className="label">Email</span>
          <input name="email" type="email" required autoComplete="email" className="input" />
        </label>
        <label className="block">
          <span className="label">Contraseña</span>
          <input name="password" type="password" required autoComplete="current-password" className="input" />
        </label>
        <button className="btn-primary w-full">Entrar</button>
      </form>
      <p className="text-center text-sm text-ink-2">
        ¿No tienes cuenta?{" "}
        <Link href={`/registro?next=${encodeURIComponent(n)}`} className="font-semibold text-brand">
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
}
