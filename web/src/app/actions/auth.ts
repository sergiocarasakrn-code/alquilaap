"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { browserUserIds, createSession, destroySession, REF_COOKIE, safeNext } from "@/lib/auth";
import { recordReferral } from "@/lib/referrals";
import { runOrBack, str, UserError } from "./util";

export async function register(fd: FormData) {
  const next = safeNext(str(fd, "next"));
  await runOrBack(`/registro?next=${encodeURIComponent(next)}`, async () => {
    const name = str(fd, "name");
    const email = str(fd, "email").toLowerCase();
    const password = str(fd, "password");
    if (name.length < 2) throw new UserError("Escribe tu nombre");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new UserError("Email no válido");
    if (password.length < 8) throw new UserError("La contraseña necesita al menos 8 caracteres");
    if (fd.get("terms") !== "on") throw new UserError("Acepta las condiciones para continuar");
    const jar = await cookies();
    const refCode = str(fd, "ref") || jar.get(REF_COOKIE)?.value;
    const seenHere = await browserUserIds(); // antes de crear la sesión nueva
    try {
      const u = await db.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
      await createSession(u.id);
      if (refCode) {
        // La invitación nunca debe impedir crear la cuenta.
        await recordReferral({ inviteeId: u.id, inviteeEmail: email, code: refCode, browserUserIds: seenHere }).catch((e) =>
          console.error("No se pudo guardar la invitación", e),
        );
        jar.delete(REF_COOKIE);
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new UserError("Ya existe una cuenta con ese email");
      throw e;
    }
  });
  redirect(next === "/" ? "/perfil?bienvenida=1" : next);
}

export async function login(fd: FormData) {
  const next = safeNext(str(fd, "next"));
  await runOrBack(`/entrar?next=${encodeURIComponent(next)}`, async () => {
    const email = str(fd, "email").toLowerCase();
    const u = await db.user.findUnique({ where: { email } });
    // Mismo mensaje exista o no la cuenta, para no revelar qué emails están registrados.
    if (!u || !(await verifyPassword(str(fd, "password"), u.passwordHash))) throw new UserError("Email o contraseña incorrectos");
    await createSession(u.id);
  });
  redirect(next);
}

export async function logout() {
  await destroySession();
  redirect("/");
}
