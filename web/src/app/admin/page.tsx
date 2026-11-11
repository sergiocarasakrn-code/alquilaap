import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { ageOn } from "@/lib/dni";
import { shortDate } from "@/lib/format";
import { reviewKyc } from "@/app/actions/admin";

export const metadata = { title: "Administración" };
export const dynamic = "force-dynamic";

const fileUrl = (ref: string | null) => (ref?.startsWith("private:") ? `/admin/archivo/${ref.slice("private:".length)}` : null);

export default async function Admin() {
  await requireAdmin();
  const [pending, incidents] = await Promise.all([
    db.user.findMany({ where: { kycStatus: "pending" }, orderBy: { kycSubmittedAt: "asc" }, take: 50 }),
    db.booking.findMany({
      where: { status: "incident" },
      include: { listing: { select: { title: true } }, owner: { select: { name: true, email: true, phone: true } }, renter: { select: { name: true, email: true, phone: true } } },
      orderBy: { incidentAt: "asc" },
      take: 50,
    }),
  ]);

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
