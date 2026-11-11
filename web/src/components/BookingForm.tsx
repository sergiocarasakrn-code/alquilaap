"use client";
import { useMemo, useState } from "react";
import { INSURANCE } from "@/lib/config";
import { money } from "@/lib/format";
import { quote } from "@/lib/pricing";

interface Props {
  action: (fd: FormData) => void;
  pricePerDayCents: number;
  depositCents: number;
  today: string;
  booked: { start: string; end: string }[];
  disabledReason?: string;
}

export function BookingForm({ action, pricePerDayCents, depositCents, today, booked, disabledReason }: Props) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [ins, setIns] = useState(false);

  const q = useMemo(() => {
    if (!start || !end || end < start) return null;
    return quote(pricePerDayCents, depositCents, new Date(start + "T00:00:00Z"), new Date(end + "T00:00:00Z"), ins);
  }, [start, end, ins, pricePerDayCents, depositCents]);
  const clash = !!start && !!end && booked.some((b) => b.start <= end && b.end >= start);

  return (
    <form action={action} className="card space-y-3 p-4">
      <p>
        <span className="font-display text-2xl font-extrabold">{money(pricePerDayCents)}</span>
        <span className="text-ink-3"> / día</span>
        {depositCents > 0 && <span className="block text-sm text-ink-3">Fianza {money(depositCents)} (se devuelve al finalizar)</span>}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="label">Recogida</span>
          <input type="date" name="start" min={today} required className="input" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label>
          <span className="label">Devolución</span>
          <input type="date" name="end" min={start || today} required className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      <label className="flex items-start gap-2 rounded-xl border border-line p-3 text-sm">
        <input type="checkbox" name="insurance" className="mt-0.5" checked={ins} onChange={(e) => setIns(e.target.checked)} />
        <span>
          <b>{INSURANCE.name}</b> (opcional). Cubre hasta {money(INSURANCE.coverCents)}. {Math.round(INSURANCE.rate * 100)} % del alquiler, mínimo {money(INSURANCE.minCents)}.
        </span>
      </label>
      {clash && <p className="text-sm font-medium text-bad">Esas fechas coinciden con otra reserva.</p>}
      {q && (
        <dl className="space-y-1 rounded-xl bg-surface-2 p-3 text-sm">
          <div className="flex justify-between">
            <dt>
              {money(pricePerDayCents)} × {q.days} {q.days === 1 ? "día" : "días"}
            </dt>
            <dd>{money(q.rentCents)}</dd>
          </div>
          {depositCents > 0 && (
            <div className="flex justify-between">
              <dt>Fianza</dt>
              <dd>{money(depositCents)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-1 font-semibold">
            <dt>A pagar en mano al recoger</dt>
            <dd>{money(q.payInPersonCents)}</dd>
          </div>
          {q.insuranceCents > 0 && (
            <div className="flex justify-between text-ink-2">
              <dt>Seguro</dt>
              <dd>{money(q.insuranceCents)}</dd>
            </div>
          )}
        </dl>
      )}
      {disabledReason ? (
        <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn">{disabledReason}</p>
      ) : (
        <button className="btn-primary w-full" disabled={!q || clash}>
          Solicitar reserva
        </button>
      )}
      <p className="text-xs text-ink-3">Alquilaap no cobra comisión. Pagas el alquiler y la fianza directamente al propietario.</p>
    </form>
  );
}
