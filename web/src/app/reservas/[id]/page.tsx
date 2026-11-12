import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";
import { ACTION_LABEL, availableActions, type Role, type Status } from "@/lib/booking-rules";
import { bookingAction, postMessage, reviewBooking } from "@/app/actions/bookings";
import { Notice, StatusPill } from "@/components/ui";
import { markRead } from "@/lib/messages";

export const metadata = { title: "Reserva" };

const fmtTime = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

function Step({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs ${done ? "bg-ok text-white" : "border border-line"}`}>{done ? "✓" : ""}</span>
      <span className={done ? "" : "text-ink-3"}>{children}</span>
    </li>
  );
}

export default async function Reserva({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/reservas/${id}`);
  const b = await db.booking.findUnique({
    where: { id },
    include: {
      listing: { include: { photos: { take: 1, orderBy: { position: "asc" } } } },
      owner: { select: { id: true, name: true, phone: true, kycStatus: true } },
      renter: { select: { id: true, name: true, phone: true, kycStatus: true } },
      reviews: true,
    },
  });
  if (!b || (b.ownerId !== user.id && b.renterId !== user.id)) notFound();
  const { error } = await searchParams;
  // El chat de la reserva es la conversación entre estas dos personas sobre este anuncio.
  const conv = await db.conversation.findUnique({
    where: { listingId_renterId: { listingId: b.listingId, renterId: b.renterId } },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 500 } },
  });
  const messages = conv?.messages ?? [];
  if (conv) await markRead(user.id, conv);
  const role: Role = b.ownerId === user.id ? "owner" : "renter";
  const other = role === "owner" ? b.renter : b.owner;
  const actions = availableActions(b, role);
  const act = bookingAction.bind(null, b.id);
  const myReview = b.reviews.find((r) => r.authorId === user.id);
  const status = b.status as Status;
  // El teléfono del otro solo se comparte cuando la reserva está aceptada.
  const showPhone = ["accepted", "in_progress", "incident", "completed"].includes(status);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href={role === "owner" ? "/reservas?ver=propietario" : "/reservas"} className="text-sm font-semibold text-brand">
        ← Reservas
      </Link>
      <Notice error={error} />
      <div className="card flex items-center gap-3 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.listing.photos[0]?.url} alt="" className="h-20 w-20 rounded-xl bg-surface-2 object-cover" />
        <div className="min-w-0 flex-1">
          <Link href={`/anuncio/${b.listingId}`} className="font-semibold">
            {b.listing.title}
          </Link>
          <p className="text-sm text-ink-3">
            {shortDate(b.startDate)} – {shortDate(b.endDate)} · {b.days} {b.days === 1 ? "día" : "días"}
          </p>
          <p className="text-sm text-ink-2">
            {role === "owner" ? "Lo alquila" : "Propietario"}: {other.name}
            {showPhone && other.phone ? ` · ${other.phone}` : ""}
            {other.kycStatus === "verified" ? (
              <span className="ml-1.5 text-xs font-semibold text-ok">✓ Verificado</span>
            ) : (
              <span className="ml-1.5 text-xs text-ink-3">· Sin verificar</span>
            )}
          </p>
        </div>
        <StatusPill s={status} />
      </div>

      <dl className="card grid grid-cols-2 gap-2 p-4 text-sm">
        <dt className="text-ink-3">Alquiler (en mano)</dt>
        <dd className="text-right font-semibold">{money(b.priceCents)}</dd>
        <dt className="text-ink-3">Fianza (en mano)</dt>
        <dd className="text-right font-semibold">{money(b.depositCents)}</dd>
        {b.insuranceCents > 0 && (
          <>
            <dt className="text-ink-3">Seguro</dt>
            <dd className="text-right font-semibold">{money(b.insuranceCents)}</dd>
          </>
        )}
      </dl>

      <section className="card space-y-3 p-4">
        <h2 className="h2">Entrega y devolución</h2>
        <ol className="space-y-2 text-sm">
          <Step done={status !== "requested"}>Reserva aceptada</Step>
          <Step done={!!b.ownerPickedUpAt}>Propietario marca «alquilado»{b.ownerPickedUpAt && ` · ${fmtTime.format(b.ownerPickedUpAt)}`}</Step>
          <Step done={!!b.renterPickedUpAt}>Cliente marca «alquilado»{b.renterPickedUpAt && ` · ${fmtTime.format(b.renterPickedUpAt)}`}</Step>
          <Step done={!!b.ownerReturnedOkAt}>Propietario marca «finalizado»{b.ownerReturnedOkAt && ` · ${fmtTime.format(b.ownerReturnedOkAt)}`}</Step>
          <Step done={!!b.renterReturnedOkAt}>Cliente marca «finalizado»{b.renterReturnedOkAt && ` · ${fmtTime.format(b.renterReturnedOkAt)}`}</Step>
        </ol>
        {status === "completed" && <p className="rounded-xl bg-ok-soft p-3 text-sm text-ok">Los dos habéis confirmado que el objeto se devolvió en buen estado.</p>}
        {status === "incident" && (
          <p className="rounded-xl bg-bad-soft p-3 text-sm text-bad">
            Incidencia abierta: «{b.incidentText}». La reserva queda congelada y el equipo de Alquilaap os contactará.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {actions
            .filter((a) => a !== "incident" && a !== "return_ok")
            .map((a) => (
              <form key={a} action={act}>
                <input type="hidden" name="action" value={a} />
                <input type="hidden" name="version" value={b.version} />
                <button className={a === "decline" || a === "cancel" ? "btn-ghost" : "btn-primary"}>{ACTION_LABEL[a]}</button>
              </form>
            ))}
        </div>
        {actions.includes("return_ok") && (
          <form action={act} className="space-y-2 rounded-xl border border-line p-3">
            <input type="hidden" name="action" value="return_ok" />
            <input type="hidden" name="version" value={b.version} />
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="confirm" required className="mt-0.5" />
              <span>
                {role === "owner"
                  ? "Confirmo que me han devuelto el objeto en perfectas condiciones y he devuelto la fianza."
                  : "Confirmo que he devuelto el objeto en perfectas condiciones y he recuperado la fianza."}
              </span>
            </label>
            <button className="btn-primary">{ACTION_LABEL.return_ok}</button>
          </form>
        )}
        {actions.includes("incident") && (
          <details className="rounded-xl border border-line p-3 text-sm">
            <summary className="cursor-pointer font-semibold text-bad">Hay un problema</summary>
            <form action={act} className="mt-2 space-y-2">
              <input type="hidden" name="action" value="incident" />
              <input type="hidden" name="version" value={b.version} />
              <textarea name="incidentText" required minLength={5} rows={3} className="input" placeholder="Qué ha pasado: daños, retraso, no se presentó…" />
              <button className="btn-danger">Abrir incidencia</button>
            </form>
          </details>
        )}
      </section>

      {status === "completed" && (
        <section className="card space-y-2 p-4">
          <h2 className="h2">Valora a {other.name.split(" ")[0]}</h2>
          {myReview ? (
            <p className="text-sm text-ink-2">
              Tu valoración: {"★".repeat(myReview.rating)} {myReview.text}
            </p>
          ) : (
            <form action={reviewBooking.bind(null, b.id)} className="space-y-2">
              <div className="flex gap-3 text-sm">
                {[5, 4, 3, 2, 1].map((n) => (
                  <label key={n} className="flex items-center gap-1">
                    <input type="radio" name="rating" value={n} required defaultChecked={n === 5} /> {n}★
                  </label>
                ))}
              </div>
              <textarea name="text" rows={2} className="input" placeholder="Cuenta cómo fue (opcional)" />
              <button className="btn-primary">Publicar reseña</button>
            </form>
          )}
        </section>
      )}

      <section id="chat" className="card space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="h2">Mensajes</h2>
          {conv && (
            <Link href={`/mensajes/${conv.id}`} className="text-sm font-semibold text-brand">
              Abrir conversación
            </Link>
          )}
        </div>
        {messages.length === 0 && <p className="text-sm text-ink-3">Acordad aquí la hora y el lugar de recogida.</p>}
        <ul className="space-y-2">
          {messages.map((m) => (
            <li key={m.id} className={`max-w-[85%] rounded-2xl whitespace-pre-line px-3 py-2 text-sm ${m.senderId === user.id ? "ml-auto bg-brand text-brand-ink" : "bg-surface-2"}`}>
              {m.body}
              <span className="mt-0.5 block text-[11px] opacity-70">{fmtTime.format(m.createdAt)}</span>
            </li>
          ))}
        </ul>
        <form action={postMessage.bind(null, b.id)} className="flex gap-2">
          <input name="body" required maxLength={2000} className="input flex-1" placeholder="Escribe un mensaje" aria-label="Mensaje" />
          <button className="btn-primary">Enviar</button>
        </form>
      </section>
    </div>
  );
}
