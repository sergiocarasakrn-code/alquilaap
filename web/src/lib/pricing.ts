import { INSURANCE } from "./config";

export function rentalDays(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1; // ambos días incluidos
}

export function insuranceCents(subtotalCents: number) {
  return Math.max(INSURANCE.minCents, Math.round(subtotalCents * INSURANCE.rate));
}

/** Presupuesto de un alquiler. El alquiler y la fianza se pagan en mano; el seguro, si se elige, es lo único que cobra la plataforma. */
export function quote(pricePerDayCents: number, depositCents: number, start: Date, end: Date, withInsurance: boolean) {
  const days = rentalDays(start, end);
  if (days < 1) throw new Error("Fechas no válidas");
  const rentCents = days * pricePerDayCents;
  const ins = withInsurance ? insuranceCents(rentCents) : 0;
  return { days, rentCents, depositCents, insuranceCents: ins, payInPersonCents: rentCents + depositCents };
}
