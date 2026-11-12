import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { inbox } from "@/lib/messages";
import { AutoRefresh } from "@/components/AutoRefresh";

export const metadata = { title: "Mensajes" };

const fmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" });
const fmtTime = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
const when = (d: Date) => (Date.now() - d.getTime() < 86_400_000 ? fmtTime.format(d) : fmt.format(d));

export default async function Mensajes() {
  const user = await requireUser("/mensajes");
  const items = await inbox(user.id);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <AutoRefresh seconds={20} />
      <h1 className="h1">Mensajes</h1>
      {items.length === 0 && (
        <div className="card space-y-2 p-8 text-center text-ink-2">
          <p>Todavía no tienes mensajes.</p>
          <p className="text-sm text-ink-3">Para preguntar algo antes de reservar, entra en un anuncio y pulsa «Enviar mensaje».</p>
        </div>
      )}
      <ul className="card divide-y divide-line overflow-hidden">
        {items.map((c) => (
          <li key={c.id}>
            <Link href={`/mensajes/${c.id}`} className="flex items-center gap-3 p-3 hover:bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.listing.photos[0]?.url} alt="" className="h-14 w-14 shrink-0 rounded-xl bg-surface-2 object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`truncate ${c.unread ? "font-bold" : "font-semibold"}`}>{c.other.name}</p>
                  <span className={`shrink-0 text-xs ${c.unread ? "font-semibold text-brand" : "text-ink-3"}`}>{when(c.lastMessageAt)}</span>
                </div>
                <p className="truncate text-xs text-ink-3">
                  {c.asOwner ? "Interesado en tu anuncio · " : ""}
                  {c.listing.title}
                </p>
                <p className={`truncate text-sm ${c.unread ? "font-medium text-ink" : "text-ink-2"}`}>
                  {c.last?.senderId === user.id ? "Tú: " : ""}
                  {c.last?.body}
                </p>
              </div>
              {c.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand" aria-label="Sin leer" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
