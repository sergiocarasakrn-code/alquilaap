import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { ageOn } from "@/lib/dni";
import { shortDate } from "@/lib/format";
import { annulReferral, reviewKyc } from "@/app/actions/admin";
import Link from "next/link";

const REF_STATUS = {
  pending: { label: "Registrado, sin anuncio", cls: "bg-surface-2 text-ink-3" },
  qualified: { label: "Publicó · espera anuncio de quien invita", cls: "bg-tag-soft text-tag-ink" },
  rewarded: { label: "Destacado dado", cls: "bg-ok-soft text-ok" },
  rejected: { label: "No cuenta", cls: "bg-bad-soft text-bad" },
} as const;

export const metadata = { title: "Administración" };
export const dynamic = "force-dynamic";

const fileUrl = (ref: string | null) => (ref?.startsWith("private:") ? `/admin/archivo/${ref.slice("private:".length)}` : null);

export default async function Admin() {
  await requireAdmin();
  const [pending, incidents, referrals, refCounts] = await Promise.all([
    db.user.findMany({ where: { kycStatus: "pending" }, orderBy: { kycSubmittedAt: "asc" }, take: 50 }),
    db.booking.findMany({
      where: { status: "incident" },
      include: { listing: { select: { title: true } }, owner: { select: { name: true, email: true, phone: true } }, renter: { select: { name: true, email: true, phone: true } } },
      orderBy: { incidentAt: "asc" },
      take: 50,
    }),
    db.referral.findMany({
      include: { inviter: { select: { name: true, email: true } }, invitee: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.referral.groupBy({ by: ["status"], _count: true }),
  ]);
  const refCount = (s: string) => refCounts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="space-y-8">
      <h1 className="h1">Administración</h1>

      <section className="space-y-3">
        <h2 className="h2">Verificaciones pendientes ({pending.length})</h2>
        {pending.length === 0 && <p className="text-ink-3">No hay verificaciones pendientes.</p>}
        {pending.map((u) => (
          <div key={u.id} className="card grid gap-4 p-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-1 text-sm">
              <p className="font-semibold">
                {u.legalName} <span className="font-normal text-ink-3">({u.email})</span>
              </p>
              <p>
                Documento terminado en {u.idNumberLast4} · {u.birthDate ? `${ageOn(u.birthDate)} años` : ""} · {u.phone}
              </p>
              <p className="text-ink-2">{u.address}</p>
              <p className="text-ink-3">Enviado {u.kycSubmittedAt ? shortDate(u.kycSubmittedAt) : ""}</p>
              <div className="flex gap-2 pt-2">
                {[u.kycDocumentUrl, u.kycSelfieUrl].map((ref, i) => {
                  const url = fileUrl(ref);
                  return url ? (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={i === 0 ? "Documento" : "Selfie"} className="h-32 w-44 rounded-xl border border-line object-cover" />
                    </a>
                  ) : null;
                })}
              </div>
            </div>
            <div className="flex gap-2 md:flex-col">
              <form action={reviewKyc.bind(null, u.id, "verified")}>
                <button className="btn-primary w-full">Aprobar</button>
              </form>
              <form action={reviewKyc.bind(null, u.id, "rejected")}>
                <button className="btn-danger w-full">Rechazar</button>
              </form>
            </div>
          </div>
        ))}
      </section>

      <section id="invitaciones" className="space-y-3">
        <h2 className="h2">Invitaciones</h2>
        <p className="text-sm text-ink-2">
          {refCount("pending")} registrados sin anuncio · {refCount("qualified")} esperando · {refCount("rewarded")} premiados · {refCount("rejected")} no cuentan. Los
          destacados se dan solos cuando el invitado publica su primer anuncio.
        </p>
        {referrals.length === 0 && <p className="text-ink-3">Todavía nadie se ha registrado con un enlace de invitación.</p>}
        {referrals.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-ink-3">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Invita</th>
                  <th className="p-3">Invitado</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Primer anuncio</th>
                  <th className="p-3">Premio</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {referrals.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="p-3 whitespace-nowrap">{shortDate(r.createdAt)}</td>
                    <td className="p-3">
                      {r.inviter.name}
                      <br />
                      <span className="text-ink-3">{r.inviter.email}</span>
                    </td>
                    <td className="p-3">
                      {r.invitee.name}
                      <br />
                      <span className="text-ink-3">{r.invitee.email}</span>
                    </td>
                    <td className="p-3">
                      <span className={`pill ${REF_STATUS[r.status].cls}`}>{REF_STATUS[r.status].label}</span>
                      {r.rejectReason && <p className="mt-1 text-xs text-ink-3">{r.rejectReason}</p>}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {r.firstListingId ? (
                        <Link href={`/anuncio/${r.firstListingId}`} className="font-semibold text-brand">
                          Ver{r.qualifiedAt ? ` (${shortDate(r.qualifiedAt)})` : ""}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {r.rewardListingId ? (
                        <Link href={`/anuncio/${r.rewardListingId}`} className="font-semibold text-brand">
                          +{r.rewardDays} días{r.rewardEndsAt ? `, hasta ${shortDate(r.rewardEndsAt)}` : ""}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3">
                      {r.status !== "rejected" && (
                        <form action={annulReferral.bind(null, r.id)}>
                          <button className="btn-danger px-3 py-1 text-xs">Anular</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="h2">Incidencias abiertas ({incidents.length})</h2>
        {incidents.length === 0 && <p className="text-ink-3">No hay incidencias abiertas.</p>}
        {incidents.map((b) => (
          <div key={b.id} className="card space-y-1 p-4 text-sm">
            <p className="font-semibold">{b.listing.title}</p>
            <p className="text-bad">«{b.incidentText}»</p>
            <p>
              Propietario: {b.owner.name} · {b.owner.email} · {b.owner.phone}
            </p>
            <p>
              Cliente: {b.renter.name} · {b.renter.email} · {b.renter.phone}
            </p>
            <p className="text-ink-3">
              {shortDate(b.startDate)} – {shortDate(b.endDate)} · abierta {b.incidentAt ? shortDate(b.incidentAt) : ""}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
