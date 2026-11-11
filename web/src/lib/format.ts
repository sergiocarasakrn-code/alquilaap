const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
export const money = (cents: number) => eur.format(cents / 100);

const dfmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
export const shortDate = (d: Date) => dfmt.format(d);

/** "2026-11-12" -> Date a medianoche UTC, o null si no es una fecha válida. */
export function parseDay(s: unknown): Date | null {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + "T00:00:00Z");
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
}
export const dayKey = (d: Date) => d.toISOString().slice(0, 10);
export function todayUTC(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Euros escritos por el usuario ("12,50", "12.5", "12") -> céntimos. */
export function parseEuros(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s|€/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(parseFloat(s) * 100);
}
