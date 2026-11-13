// Calculadora orientativa para quien compra algo con la intención de alquilarlo.
export type RentInput = { costEuros: number; pricePerDay: number; daysPerMonth: number; upkeepPct: number };
export type RentResult = { monthlyNet: number; paybackMonths: number | null; firstYear: number; yearAfter: number };

export function rentability({ costEuros, pricePerDay, daysPerMonth, upkeepPct }: RentInput): RentResult {
  const days = Math.min(Math.max(daysPerMonth, 0), 31);
  const upkeep = Math.min(Math.max(upkeepPct, 0), 100) / 100;
  const monthlyNet = Math.max(pricePerDay, 0) * days * (1 - upkeep);
  const cost = Math.max(costEuros, 0);
  return {
    monthlyNet,
    paybackMonths: monthlyNet > 0 ? Math.ceil(cost / monthlyNet) : null,
    firstYear: monthlyNet * 12 - cost,
    yearAfter: monthlyNet * 12,
  };
}

/** Ejemplos orientativos para la calculadora (no son datos de mercado). */
export const RENT_EXAMPLES = [
  { name: "Bici eléctrica", costEuros: 1200, pricePerDay: 25, daysPerMonth: 8 },
  { name: "Kayak doble", costEuros: 600, pricePerDay: 30, daysPerMonth: 4 },
  { name: "Tienda de campaña", costEuros: 250, pricePerDay: 12, daysPerMonth: 4 },
  { name: "Hidrolimpiadora", costEuros: 300, pricePerDay: 15, daysPerMonth: 5 },
  { name: "Proyector", costEuros: 400, pricePerDay: 20, daysPerMonth: 3 },
] as const;
