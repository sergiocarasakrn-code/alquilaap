import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";
import { availableActions, type Status } from "@/lib/booking-rules";
import { StatusPill, first } from "@/components/ui";

export const metadata = { title: "Mis reservas" };

export default async function Reservas({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/reservas");
  const tab = first((await searchParams).ver) === "propietario" ? "owner" : "renter";
  const items = await db.booking.findMany({
    where: tab === "owner" ? { ownerId: user.id } : { renterId: user.id },
    include: { listing: { include: { photos: { take: 1, orderBy: { position: "asc" } } } }, renter: { select: { name: true } }, owner: { select: { name: true } } },
    orderBy: [{ startDate: "desc" }],
    take: 100,
  });
  const tabCls = (on: boolean) => `pill border px-3 py-1.5 text-sm ${on ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface"}`;
  return (
    <div className="space-y-4">
      <h1 className="h1">Reservas</h1>
      <div className="flex gap-2">
        <Link href="/reservas" className={tabCls(tab === "renter")}>
          Lo que alquilo
        </Link>
        <Link href="/reservas?ver=propietario" className={tabCls(tab === "owner")}>
          Mis objetos
        </Link>
      </div>
      {items.length === 0 && <div className="card p-8 text-center text-ink-2">No hay reservas todavía.</div>}
      <ul className="space-y-3">
        {items.map((b) => {
          const pending = availableActions(b, tab).filter((a) => a !== "incident" && a !== "cancel").length > 0;
          return (
            <li key={b.id}>
              <Link href={`/reservas/${b.id}`} className="card flex items-center gap-3 p-3 hover:border-brand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.listing.photos[0]?.url} alt="" className="h-16 w-16 shrink-0 rounded-xl bg-surface-2 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{b.listing.title}</p>
                  <p className="text-sm text-ink-3">
                    {shortDate(b.startDate)} – {shortDate(b.endDate)} · {money(b.priceCents)} · {tab === "owner" ? b.renter.name : b.owner.name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill s={b.status as Status} />
                  {pending && <span className="text-xs font-semibold text-warn">Te toca</span>}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
