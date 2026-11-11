import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "./auth";

/** Administradores: emails separados por comas en ADMIN_EMAILS. */
export function isAdmin(u: { email: string }) {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(u.email.toLowerCase());
}

export async function requireAdmin() {
  const u = await requireUser("/admin");
  if (!isAdmin(u)) notFound();
  return u;
}
