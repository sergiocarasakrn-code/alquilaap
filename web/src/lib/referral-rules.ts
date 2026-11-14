// Reglas puras del programa de invitaciones (sin base de datos, para poder probarlas fácilmente).
import { createHash, randomInt } from "node:crypto";

/**
 * Email normalizado para detectar la misma persona con otra «variante» del email:
 * mayúsculas, alias con «+» (ana+2@...) y, en Gmail, los puntos (a.n.a@gmail.com = ana@gmail.com).
 */
export function normalizeEmail(email: string) {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 1) return e;
  let local = e.slice(0, at);
  let domain = e.slice(at + 1);
  local = local.split("+")[0];
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

/** Huella del email normalizado: sirve para comparar sin volver a guardar el email en otra tabla. */
export const emailKey = (email: string) => createHash("sha256").update(normalizeEmail(email)).digest("hex");

// Sin letras que se confunden al dictarlas o leerlas (0/O, 1/I/L).
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const REFERRAL_CODE_LENGTH = 7;

export function newReferralCode() {
  let s = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

/** Limpia un código escrito o recibido en un enlace; devuelve null si no tiene la forma correcta. */
export function cleanReferralCode(v: unknown) {
  if (typeof v !== "string") return null;
  const c = v.trim().toUpperCase();
  return new RegExp(`^[${ALPHABET}]{${REFERRAL_CODE_LENGTH}}$`).test(c) ? c : null;
}

/** Motivo para no contar una invitación, o null si es válida. */
export function referralRejection(opts: {
  inviterEmail: string;
  inviteeEmail: string;
  inviterUsedThisBrowser: boolean;
  emailInvitedBefore: boolean;
}) {
  if (opts.inviterUsedThisBrowser) return "Registrado desde el mismo navegador que quien invita";
  if (normalizeEmail(opts.inviterEmail) === normalizeEmail(opts.inviteeEmail)) return "Mismo email que quien invita";
  if (opts.emailInvitedBefore) return "Este email ya se registró antes con una invitación";
  return null;
}
