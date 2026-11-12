import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { LEGAL } from "@/lib/legal";
import { deleteMyAccount } from "@/app/actions/account";
import { Notice } from "@/components/ui";

export const metadata = { title: "Borrar mi cuenta", description: "Cómo borrar tu cuenta de Alquilaap y qué datos se eliminan." };

export default async function BorrarCuenta({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [user, { error }] = await Promise.all([currentUser(), searchParams]);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="h1">Borrar mi cuenta</h1>
      <div className="card space-y-3 p-5 text-ink-2">
        <p className="font-semibold text-ink">Qué se borra al momento</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Tu nombre, email, teléfono, dirección y fecha de nacimiento.</li>
          <li>La foto de tu documento y tu selfie.</li>
          <li>Todos tus anuncios y sus fotos.</li>
          <li>Las solicitudes de reserva pendientes, que se cancelan.</li>
          <li>Tu suscripción a Alquilaap Pro, si la tienes, que se cancela.</li>
        </ul>
        <p className="font-semibold text-ink">Qué se conserva, sin tu nombre</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>El historial de reservas, mensajes y reseñas, porque también es de la otra persona. Aparecerás como «Usuario eliminado».</li>
          <li>Si tuviste una incidencia, una huella cifrada de tu DNI durante 5 años, solo para prevenir fraudes.</li>
          <li>Las facturas de packs o suscripción, el tiempo que exige la ley.</li>
        </ul>
        <p className="text-sm">
          Más detalles en la <Link href="/privacidad" className="font-semibold text-brand">política de privacidad</Link>. Si no puedes entrar en tu cuenta, escríbenos
          a {LEGAL.email} desde el email con el que te registraste y la borraremos por ti.
        </p>
      </div>

      {user ? (
        <form action={deleteMyAccount} className="card space-y-3 border-bad/40 p-5">
          <Notice error={error} />
          <p className="text-sm text-ink-2">
            Vas a borrar la cuenta <strong className="text-ink">{user.email}</strong>. No se puede deshacer.
          </p>
          <label className="label" htmlFor="password">
            Escribe tu contraseña para confirmar
          </label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="confirm" required className="mt-0.5" />
            <span>Entiendo que mi cuenta y mis anuncios se borrarán para siempre.</span>
          </label>
          <button className="btn-danger w-full">Borrar mi cuenta para siempre</button>
        </form>
      ) : (
        <div className="card space-y-3 p-5">
          <p className="text-ink-2">Entra en tu cuenta para borrarla.</p>
          <Link href="/entrar?next=/borrar-cuenta" className="btn-primary">
            Entrar
          </Link>
        </div>
      )}
    </div>
  );
}
