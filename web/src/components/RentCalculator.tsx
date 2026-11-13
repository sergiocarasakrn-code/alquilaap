"use client";

import { useState } from "react";
import { RENT_EXAMPLES, rentability } from "@/lib/rentabilidad";

const eur = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")) || 0);

export function RentCalculator() {
  const first = RENT_EXAMPLES[0];
  const [cost, setCost] = useState(String(first.costEuros));
  const [price, setPrice] = useState(String(first.pricePerDay));
  const [days, setDays] = useState(String(first.daysPerMonth));
  const [upkeep, setUpkeep] = useState("10");
  const r = rentability({ costEuros: num(cost), pricePerDay: num(price), daysPerMonth: num(days), upkeepPct: num(upkeep) });

  return (
    <div className="card space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap gap-2" aria-label="Ejemplos">
        {RENT_EXAMPLES.map((e) => (
          <button
            key={e.name}
            type="button"
            className="pill bg-surface-2 text-ink-2 hover:bg-brand-soft"
            onClick={() => {
              setCost(String(e.costEuros));
              setPrice(String(e.pricePerDay));
              setDays(String(e.daysPerMonth));
            }}
          >
            {e.name}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="label">
          Lo que cuesta comprarlo (€)
          <input className="input mt-1" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
        </label>
        <label className="label">
          Precio de alquiler por día (€)
          <input className="input mt-1" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="label">
          Días alquilado al mes
          <input className="input mt-1" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
        </label>
        <label className="label">
          Mantenimiento y desgaste (% de lo que cobras)
          <input className="input mt-1" inputMode="numeric" value={upkeep} onChange={(e) => setUpkeep(e.target.value)} />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3" aria-live="polite">
        <div className="rounded-xl bg-brand-soft p-4">
          <p className="text-sm text-ink-2">Ganas al mes</p>
          <p className="text-2xl font-bold text-brand">{eur(r.monthlyNet)}</p>
        </div>
        <div className="rounded-xl bg-brand-soft p-4">
          <p className="text-sm text-ink-2">Lo amortizas en</p>
          <p className="text-2xl font-bold text-brand">{r.paybackMonths === null ? "—" : `${r.paybackMonths} ${r.paybackMonths === 1 ? "mes" : "meses"}`}</p>
        </div>
        <div className="rounded-xl bg-tag-soft p-4">
          <p className="text-sm text-ink-2">Después, al año</p>
          <p className="text-2xl font-bold text-tag-ink">{eur(r.yearAfter)}</p>
        </div>
      </div>
      <p className="text-xs text-ink-3">
        Cálculo orientativo: lo que ganes depende de la demanda en tu zona, de la temporada y del estado del objeto. No es una promesa de ingresos.
      </p>
    </div>
  );
}
