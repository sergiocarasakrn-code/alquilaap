import Link from "next/link";
import { requireUser, isProUser } from "@/lib/auth";
import { PAID_FEATURES, REFERRALS } from "@/lib/config";
import { ensureReferralCode, referralSummary } from "@/lib/referrals";
import { appUrl } from "@/lib/stripe";
import { InviteShare } from "@/components/InviteShare";
import { userStats } from "@/lib/listings";
import { submitKyc } from "@/app/actions/account";
import { logout } from "@/app/actions/auth";
import { shortDate } from "@/lib/format";
import { Notice, Trust, first } from "@/components/ui";

export const metadata = { title: "Mi perfil" };

export default async function Perfil({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/perfil");
  const sp = await searchParams;
  const [stats, code, inv] = await Promise.all([userStats(user.id), ensureReferralCode(user.id), referralSummary(user.id)]);
  const inviteUrl = `${appUrl()}/i/${code}`;
  const pro = isProUser(user);
  const ok = first(sp.verificado)
    ? user.kycStatus === "verified"
      ? "Identidad verificada. Ya tienes el sello «✓ Verificado»."
      : "Hemos recibido tus datos. Te avisaremos cuando estén verificados."
    : first(sp.pro)
      ? "¡Bienvenido a Alquilaap Pro!"
      : first(sp.bienvenida)
        ? "Cuenta creada. Ya puedes publicar, reservar y escribir mensajes. Si verificas tu identidad (opcional), tendrás el sello «✓ Verificado» y te reservarán más."
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

      <section id="invitar" className="card space-y-4 p-5">
        <div>
          <h2 className="h2">Invita amigos y gana destacados gratis</h2>
          <p className="mt-1 text-sm text-ink-2">
            Por cada amigo que se registre con tu enlace y publique su primer anuncio, tu anuncio sale <b>destacado {REFERRALS.daysPerInvite} días</b>{" "}
            (arriba en las búsquedas y en la portada). Cada {REFERRALS.bonusEvery} amigos, {REFERRALS.bonusDays} días extra de regalo:{" "}
            <b>{REFERRALS.bonusEvery} amigos = {REFERRALS.daysPerInvite * REFERRALS.bonusEvery + REFERRALS.bonusDays} días</b>. Se activa solo, no tienes que
            hacer nada.
          </p>
        </div>
        <InviteShare url={inviteUrl} text="Te invito a Alquilaap: alquila lo que necesites o gana dinero alquilando tus cosas. Es gratis." />
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-surface-2 p-3">
            <p className="font-display text-2xl font-extrabold">{inv.registered}</p>
            <p className="text-xs text-ink-3">registrados</p>
          </div>
          <div className="rounded-xl bg-surface-2 p-3">
            <p className="font-display text-2xl font-extrabold">{inv.rewarded + inv.waitingForListing}</p>
            <p className="text-xs text-ink-3">han publicado</p>
          </div>
          <div className="rounded-xl bg-surface-2 p-3">
            <p className="font-display text-2xl font-extrabold">{inv.daysEarned}</p>
            <p className="text-xs text-ink-3">días ganados</p>
          </div>
        </div>
        {inv.activeUntil && inv.activeListing && (
          <p className="text-sm text-ok">
            ★ «
            <Link href={`/anuncio/${inv.activeListing.id}`} className="font-semibold underline">
              {inv.activeListing.title}
            </Link>
            » está destacado hasta el {shortDate(inv.activeUntil)}.
          </p>
        )}
        {inv.waitingForListing > 0 && (
          <p className="text-sm font-medium text-tag-ink">
            Tienes {inv.waitingForListing === 1 ? "un destacado ganado" : `${inv.waitingForListing} destacados ganados`} esperando:{" "}
            <Link href="/publicar" className="underline">
              publica o reactiva un anuncio
            </Link>{" "}
            y se activa{inv.waitingForListing === 1 ? "" : "n"} solo{inv.waitingForListing === 1 ? "" : "s"}.
          </p>
        )}
        {inv.rewarded > 0 && inv.toNextBonus < REFERRALS.bonusEvery && (
          <p className="text-sm text-ink-2">
            Te falta{inv.toNextBonus === 1 ? "" : "n"} {inv.toNextBonus} amigo{inv.toNextBonus === 1 ? "" : "s"} para los {REFERRALS.bonusDays} días extra.
          </p>
        )}
        {inv.rows.length > 0 && (
          <ul className="divide-y divide-line text-sm">
            {inv.rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate">{r.invitee.deletedAt ? "Cuenta eliminada" : r.invitee.name.split(" ")[0]}</span>
                <span className="shrink-0 text-ink-3">
                  {r.status === "pending" && "Registrado · falta que publique"}
                  {r.status === "qualified" && "Ha publicado · destacado esperando"}
                  {r.status === "rewarded" && <span className="text-ok">+{r.rewardDays} días</span>}
                  {r.status === "rejected" && "No cuenta"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="verificacion" className="card space-y-3 p-5">
        <h2 className="h2">Verificación de identidad <span className="text-sm font-medium text-ink-3">(opcional)</span></h2>
        {user.kycStatus === "verified" && (
          <p className="text-ink-2">
            ✓ Verificada{user.kycVerifiedAt ? ` el ${shortDate(user.kycVerifiedAt)}` : ""}. Documento terminado en {user.idNumberLast4}.
          </p>
        )}
        {user.kycStatus === "pending" && <p className="text-ink-2">Estamos revisando tus datos.</p>}
        {(user.kycStatus === "unverified" || user.kycStatus === "rejected") && (
          <>
            <p className="text-sm text-ink-2">
              Es opcional, pero da mucha más confianza: tus anuncios y tu perfil llevarán el sello «✓ Verificado», podrás reservar en los anuncios que
              solo aceptan usuarios verificados y las tiendas Pro te aceptarán al momento. Tus datos no se muestran a nadie y no guardamos tu número de
              documento en claro.
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
                <input name="document" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" required className="input" />
              </label>
              <label>
                <span className="label">Selfie</span>
                <input name="selfie" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" capture="user" required className="input" />
              </label>
              <div className="sm:col-span-2">
                <button className="btn-primary">Enviar y verificar</button>
              </div>
            </form>
          </>
        )}
      </section>

      {PAID_FEATURES && (
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
      )}

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
