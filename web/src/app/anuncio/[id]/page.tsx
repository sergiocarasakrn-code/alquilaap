import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { currentUser, isProUser } from "@/lib/auth";
import { categoryName, subcategoryName } from "@/lib/config";
import { dayKey, money, shortDate, todayUTC } from "@/lib/format";
import { userStats } from "@/lib/listings";
import { requestBooking } from "@/app/actions/bookings";
import { contactListingOwner } from "@/app/actions/messages";
import { MAX_LENGTH } from "@/lib/messages";
import { BookingForm } from "@/components/BookingForm";
import { Notice, Trust, first } from "@/components/ui";

type P = Promise<{ id: string }>;
type SP = Promise<Record<string, string | string[] | undefined>>;

async function load(id: string) {
  return db.listing.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { position: "asc" } },
      owner: { select: { id: true, name: true, kycStatus: true, createdAt: true, subscription: true } },
    },
  });
}

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const l = await load((await params).id);
  if (!l || l.status === "deleted") return {};
  return { title: `${l.title} en alquiler en ${l.city}`, description: l.description.slice(0, 160), openGraph: { images: l.photos[0]?.url } };
}

export default async function Anuncio({ params, searchParams }: { params: P; searchParams: SP }) {
  const { id } = await params;
  const sp = await searchParams;
  const [l, user] = await Promise.all([load(id), currentUser()]);
  if (!l || l.status === "deleted") notFound();
  const isOwner = user?.id === l.ownerId;
  if (l.status === "paused" && !isOwner) notFound();

  const [stats, booked, reviews] = await Promise.all([
    userStats(l.ownerId),
    db.booking.findMany({
      where: { listingId: l.id, status: { in: ["accepted", "in_progress", "incident"] }, endDate: { gte: todayUTC() } },
      select: { startDate: true, endDate: true },
      orderBy: { startDate: "asc" },
    }),
    db.review.findMany({ where: { targetId: l.ownerId }, include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const ownerPro = isProUser(l.owner);
  const conversation =
    user && !isOwner ? await db.conversation.findUnique({ where: { listingId_renterId: { listingId: l.id, renterId: user.id } }, select: { id: true } }) : null;
  const firstName = l.owner.name.split(" ")[0];
  const msgError = first(sp.de) === "mensaje";

  let disabledReason: string | undefined;
  if (isOwner) disabledReason = "Este es tu anuncio.";
  else if (l.status !== "active") disabledReason = "Este anuncio está en pausa.";
  else if (user && user.kycStatus !== "verified") disabledReason = "Verifica tu identidad en tu perfil para poder reservar.";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <Notice error={msgError ? undefined : sp.error} ok={first(sp.publicado) ? "¡Anuncio publicado! Ya aparece en las búsquedas." : undefined} />
        <div className="grid gap-2 sm:grid-cols-2">
          {l.photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.id} src={p.url} alt={i === 0 ? l.title : ""} className={`w-full rounded-2xl bg-surface-2 object-cover ${i === 0 ? "aspect-[4/3] sm:col-span-2" : "aspect-square"}`} />
          ))}
        </div>
        <div>
          <p className="text-sm text-ink-3">
            <Link href={`/buscar?cat=${l.category}`}>{categoryName(l.category)}</Link>
            {subcategoryName(l.category, l.subcategory) && (
              <>
                {" › "}
                <Link href={`/buscar?cat=${l.category}&sub=${l.subcategory}`}>{subcategoryName(l.category, l.subcategory)}</Link>
              </>
            )}{" "}
            · <Link href={`/buscar?ciudad=${l.citySlug}`}>{l.city}</Link>
          </p>
          <h1 className="h1 mt-1">{l.title}</h1>
        </div>
        <p className="whitespace-pre-line text-ink-2">{l.description}</p>
        <div className="card space-y-2 p-4">
          <p className="font-semibold">{l.owner.name}</p>
          <Trust stats={stats} verified={l.owner.kycStatus === "verified"} pro={ownerPro} />
          {ownerPro && <p className="text-sm text-ink-2">Reserva inmediata: tu reserva queda aceptada al momento.</p>}
        </div>
        {booked.length > 0 && (
          <div>
            <h2 className="h2 mb-2">Fechas ocupadas</h2>
            <ul className="flex flex-wrap gap-2 text-sm">
              {booked.map((b, i) => (
                <li key={i} className="pill bg-surface-2 text-ink-2">
                  {shortDate(b.startDate)} – {shortDate(b.endDate)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {reviews.length > 0 && (
          <div>
            <h2 className="h2 mb-2">Reseñas de {l.owner.name.split(" ")[0]}</h2>
            <ul className="space-y-2">
              {reviews.map((r) => (
                <li key={r.id} className="card p-3 text-sm">
                  <p className="font-semibold">
                    {"★".repeat(r.rating)}
                    <span className="text-ink-3">{"★".repeat(5 - r.rating)}</span> · {r.author.name}
                  </p>
                  {r.text && <p className="mt-1 text-ink-2">{r.text}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        {isOwner && (
          <div className="flex gap-2">
            <Link href={`/anuncio/${l.id}/editar`} className="btn-ghost flex-1">
              Editar
            </Link>
            <Link href={`/destacar/${l.id}`} className="btn flex-1 bg-tag text-tag-ink">
              Destacar
            </Link>
          </div>
        )}
        <div id="reservar" />
        {user || isOwner ? (
          <BookingForm
            action={requestBooking.bind(null, l.id)}
            pricePerDayCents={l.pricePerDayCents}
            depositCents={l.depositCents}
            today={dayKey(todayUTC())}
            booked={booked.map((b) => ({ start: dayKey(b.startDate), end: dayKey(b.endDate) }))}
            disabledReason={disabledReason}
          />
        ) : (
          <div className="card space-y-3 p-4">
            <p>
              <span className="font-display text-2xl font-extrabold">{money(l.pricePerDayCents)}</span>
              <span className="text-ink-3"> / día</span>
            </p>
            <Link href={`/entrar?next=/anuncio/${l.id}`} className="btn-primary w-full">
              Entra para reservar
            </Link>
          </div>
        )}
        {!isOwner && (
          <div id="mensaje" className="card space-y-3 p-4">
            <p className="font-semibold">¿Tienes alguna duda?</p>
            {msgError && <Notice error={sp.error} />}
            {!user ? (
              <Link href={`/entrar?next=${encodeURIComponent(`/anuncio/${l.id}#mensaje`)}`} className="btn-ghost w-full">
                Entra para enviar un mensaje
              </Link>
            ) : conversation ? (
              <Link href={`/mensajes/${conversation.id}`} className="btn-ghost w-full">
                Ver tu conversación con {firstName}
              </Link>
            ) : l.status === "active" ? (
              <form action={contactListingOwner.bind(null, l.id)} className="space-y-2">
                <textarea
                  name="body"
                  required
                  maxLength={MAX_LENGTH}
                  rows={3}
                  className="input"
                  aria-label={`Mensaje para ${firstName}`}
                  defaultValue={`Hola ${firstName}, ¿está disponible para `}
                />
                <button className="btn-ghost w-full">Enviar mensaje a {firstName}</button>
              </form>
            ) : (
              <p className="text-sm text-ink-3">Este anuncio está en pausa.</p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
