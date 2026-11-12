import Link from "next/link";
import { requireUser, isProUser } from "@/lib/auth";
import { userStats } from "@/lib/listings";
import { submitKyc } from "@/app/actions/account";
import { logout } from "@/app/actions/auth";
import { shortDate } from "@/lib/format";
import { Notice, Trust, first } from "@/components/ui";

export const metadata = { title: "Mi perfil" };

export default async function Perfil({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/perfil");
  const sp = await searchParams;
  const stats = await userStats(user.id);
  const pro = isProUser(user);
  const ok = first(sp.verificado)
    ? user.kycStatus === "verified"
      ? "Identidad verificada. Ya puedes publicar y reservar."
      : "Hemos recibido tus datos. Te avisaremos cuando estén verificados."
    : first(sp.pro)
      ? "¡Bienvenido a Alquilaap Pro!"
      : first(sp.bienvenida)
        ? "Cuenta creada. Verifica tu identidad para empezar a publicar y reservar."
        : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="h1">{user.name}</h1>
        <p className="text-ink-3">{user.email}</p>
      </div>
      <Notice error={sp.error} ok={ok} />
      <div className="card p-4">
        <Trust stats={stats} verified={user.kycStatus === "verified"} pro={pro} />
      </div>

      <section id="verificacion" className="card space-y-3 p-5">
        <h2 className="h2">Verificación de identidad</h2>
        {user.kycStatus === "verified" && (
          <p className="text-ink-2">
            ✓ Verificada{user.kycVerifiedAt ? ` el ${shortDate(user.kycVerifiedAt)}` : ""}. Documento terminado en {user.idNumberLast4}.
          </p>
        )}
        {user.kycStatus === "pending" && <p className="text-ink-2">Estamos revisando tus datos.</p>}
        {(user.kycStatus === "unverified" || user.kycStatus === "rejected") && (
          <>
            <p className="text-sm text-ink-2">
              Para evitar robos, pedimos estos datos a todas las personas que publican o alquilan. No se muestran a nadie: el otro usuario solo ve el sello «Identidad
              verificada». No guardamos tu número de documento en claro.
            </p>
            {user.kycStatus === "rejected" && <p className="text-sm font-medium text-bad">No pudimos verificar tus datos. Revísalos y vuelve a enviarlos.</p>}
            <form action={submitKyc} className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="label">Nombre y apellidos (como en el documento)</span>
                <input name="legalName" required className="input" autoComplete="name" />
              </label>
              <label>
                <span className="label">DNI o NIE</span>
                <input name="idNumber" required className="input" placeholder="12345678Z" />
              </label>
              <label>
                <span className="label">Fecha de nacimiento</span>
                <input name="birthDate" type="date" required className="input" />
              </label>
              <label>
                <span className="label">Teléfono</span>
                <input name="phone" type="tel" required className="input" autoComplete="tel" placeholder="+34 600 000 000" />
              </label>
              <label>
                <span className="label">Dirección</span>
                <input name="address" required className="input" autoComplete="street-address" />
              </label>
              <label>
                <span className="label">Foto del documento</span>
                <input name="document" type="file" accept="image/jpeg,image/png,image/webp" required className="input" />
              </label>
              <label>
                <span className="label">Selfie</span>
                <input name="selfie" type="file" accept="image/jpeg,image/png,image/webp" capture="user" required className="input" />
              </label>
              <div className="sm:col-span-2">
                <button className="btn-primary">Enviar y verificar</button>
              </div>
            </form>
          </>
        )}
      </section>

      <section className="card space-y-2 p-5">
        <h2 className="h2">Alquilaap Pro</h2>
        {pro ? (
          <p className="text-ink-2">
            Tienes Pro activo{user.subscription?.currentPeriodEnd ? ` hasta el ${shortDate(user.subscription.currentPeriodEnd)}` : ""}. Tus anuncios salen por delante de los
            gratuitos y las reservas se aceptan al momento.
          </p>
        ) : (
          <>
            <p className="text-ink-2">Para tiendas y quien alquila a menudo: más visibilidad, reserva inmediata y sello «Tienda Pro».</p>
            <Link href="/pro" className="btn-primary">
              Ver Alquilaap Pro
            </Link>
          </>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form action={logout}>
          <button className="btn-ghost">Cerrar sesión</button>
        </form>
        <Link href="/borrar-cuenta" className="text-sm font-semibold text-bad">
          Borrar mi cuenta
        </Link>
      </div>
    </div>
  );
}
