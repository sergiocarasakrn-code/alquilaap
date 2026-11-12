import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";
import { MAX_LENGTH, openConversation } from "@/lib/messages";
import { replyInConversation } from "@/app/actions/messages";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Notice, StatusPill } from "@/components/ui";
import type { Status } from "@/lib/booking-rules";

export const metadata = { title: "Conversación" };

const fmtTime = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

export default async function Conversacion({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/mensajes/${id}`);
  const c = await openConversation(user.id, id);
  if (!c) notFound();
  const { error } = await searchParams;
  const canWrite = c.listing.status !== "deleted" && !c.other.deletedAt;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <AutoRefresh seconds={10} />
      <Link href="/mensajes" className="text-sm font-semibold text-brand">
        ← Mensajes
      </Link>
      <div className="card flex items-center gap-3 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.listing.photos[0]?.url} alt="" className="h-16 w-16 shrink-0 rounded-xl bg-surface-2 object-cover" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {c.other.name}
            {c.other.kycStatus === "verified" && <span className="pill ml-2 bg-ok-soft text-ok">✓ Verificado</span>}
          </p>
          <Link href={`/anuncio/${c.listing.id}`} className="block truncate text-sm text-ink-2 hover:text-brand">
            {c.listing.title} · {money(c.listing.pricePerDayCents)}/día
          </Link>
        </div>
        {c.side === "renter" && c.listing.status === "active" && (
          <Link href={`/anuncio/${c.listing.id}#reservar`} className="btn-primary shrink-0 px-3">
            Reservar
          </Link>
        )}
      </div>
      {c.bookings.length > 0 && (
        <ul className="space-y-1">
          {c.bookings.map((b) => (
            <li key={b.id}>
              <Link href={`/reservas/${b.id}`} className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm hover:bg-brand-soft">
                <span>
                  Reserva {shortDate(b.startDate)} – {shortDate(b.endDate)}
                </span>
                <StatusPill s={b.status as Status} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="card space-y-3 p-4">
        <ul className="space-y-2">
          {c.messages.map((m) => (
            <li
              key={m.id}
              className={`max-w-[85%] whitespace-pre-line break-words rounded-2xl px-3 py-2 text-sm ${m.senderId === user.id ? "ml-auto bg-brand text-brand-ink" : "bg-surface-2"}`}
            >
              {m.body}
              <span className="mt-0.5 block text-[11px] opacity-70">{fmtTime.format(m.createdAt)}</span>
            </li>
          ))}
        </ul>
        <div id="escribir" />
        <Notice error={error} />
        {canWrite ? (
          <form action={replyInConversation.bind(null, c.id)} className="flex items-end gap-2">
            <textarea name="body" required maxLength={MAX_LENGTH} rows={2} className="input flex-1 resize-y" placeholder="Escribe un mensaje" aria-label="Mensaje" />
            <button className="btn-primary">Enviar</button>
          </form>
        ) : (
          <p className="text-sm text-ink-3">{c.other.deletedAt ? "Esta persona ha borrado su cuenta" : "Este anuncio se ha eliminado"}: ya no se pueden enviar mensajes.</p>
        )}
        <p className="text-xs text-ink-3">Por seguridad, entrega y paga siempre en persona. Alquilaap nunca te pedirá pagos por adelantado ni códigos.</p>
      </section>
    </div>
  );
}
