import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { db } from "./db";

const COOKIE = "aq_session";
const DAYS = 30;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DAYS * 86_400_000);
  await db.session.create({ data: { id: sha(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha(token) } });
  jar.delete(COOKIE);
}

export const currentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({
    where: { id: sha(token) },
    include: { user: { include: { subscription: true } } },
  });
  if (!s || s.expiresAt < new Date()) return null;
  return s.user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export async function requireUser(next = "/"): Promise<CurrentUser> {
  const u = await currentUser();
  if (!u) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  return u;
}

export function isProUser(u: { subscription?: { status: string; currentPeriodEnd: Date | null } | null }) {
  const s = u.subscription;
  return !!s && s.status === "active" && (!s.currentPeriodEnd || s.currentPeriodEnd > new Date());
}

/** Ruta interna segura para redirigir tras iniciar sesión (evita redirecciones a otros dominios). */
export function safeNext(v: unknown) {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/";
}
