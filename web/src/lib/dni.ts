import { createHmac } from "node:crypto";

const LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

/** Valida DNI (12345678Z) y NIE (X1234567L) con su letra de control. Devuelve el número normalizado o null. */
export function normalizeIdNumber(raw: string): string | null {
  const s = raw.toUpperCase().replace(/[\s-]/g, "");
  const m = /^([XYZ]?)(\d{7,8})([A-Z])$/.exec(s);
  if (!m) return null;
  const [, prefix, digits, letter] = m;
  if (prefix && digits.length !== 7) return null;
  if (!prefix && digits.length !== 8) return null;
  const nieDigit = prefix ? String("XYZ".indexOf(prefix)) : ""; // NIE: X=0, Y=1, Z=2
  const num = Number(nieDigit + digits);
  return LETTERS[num % 23] === letter ? s : null;
}

/** Guardamos solo un HMAC del documento: permite detectar cuentas duplicadas sin almacenar el número. */
export function hashIdNumber(normalized: string) {
  const secret = process.env.ID_HASH_SECRET;
  if (!secret) throw new Error("Falta ID_HASH_SECRET");
  return createHmac("sha256", secret).update(normalized).digest("hex");
}

export function ageOn(birth: Date, on = new Date()) {
  let age = on.getUTCFullYear() - birth.getUTCFullYear();
  const m = on.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && on.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}
