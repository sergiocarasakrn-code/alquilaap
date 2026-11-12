"use server";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { destroySession, requireUser } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { deleteAccount } from "@/lib/account";
import { ageOn, hashIdNumber, normalizeIdNumber } from "@/lib/dni";
import { parseDay } from "@/lib/format";
import { saveImage } from "@/lib/storage";
import { isPackCode } from "@/lib/config";
import { activatePackPurchase, startPackPurchase, startProCheckout } from "@/lib/payments";
import { devPaymentsAllowed } from "@/lib/stripe";
import { runOrBack, str, UserError } from "./util";

/** Verificación de identidad (antirrobo). En producción la comprueba Stripe Identity; en desarrollo puede aprobarse sola. */
export async function submitKyc(fd: FormData) {
  const user = await requireUser("/perfil");
  await runOrBack("/perfil#verificacion", async () => {
    if (user.kycStatus === "verified") return;
    const legalName = str(fd, "legalName");
    const idNumber = normalizeIdNumber(str(fd, "idNumber"));
    const birth = parseDay(str(fd, "birthDate"));
    const phone = str(fd, "phone").replace(/\s/g, "");
    const address = str(fd, "address");
    const doc = fd.get("document");
    const selfie = fd.get("selfie");
    if (legalName.split(" ").filter(Boolean).length < 2) throw new UserError("Escribe tu nombre y apellidos como en el documento");
    if (!idNumber) throw new UserError("DNI o NIE no válido (revisa la letra)");
    if (!birth || ageOn(birth) < 18) throw new UserError("Debes ser mayor de edad");
    if (!/^\+?\d{9,15}$/.test(phone)) throw new UserError("Teléfono no válido");
    if (address.length < 10) throw new UserError("Escribe tu dirección completa");
    if (!(doc instanceof File) || doc.size === 0) throw new UserError("Sube una foto de tu documento");
    if (!(selfie instanceof File) || selfie.size === 0) throw new UserError("Sube un selfie");

    const auto = process.env.KYC_AUTO_APPROVE === "true" && process.env.NODE_ENV !== "production";
    const now = new Date();
    try {
      await db.user.update({
        where: { id: user.id },
        data: {
          legalName,
          idNumberHash: hashIdNumber(idNumber),
          idNumberLast4: idNumber.slice(-4),
          birthDate: birth,
          phone,
          address,
          kycDocumentUrl: await saveImage(doc, "kyc"),
          kycSelfieUrl: await saveImage(selfie, "kyc"),
          kycSubmittedAt: now,
          kycStatus: auto ? "verified" : "pending",
          kycVerifiedAt: auto ? now : null,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new UserError("Ese documento ya está registrado en otra cuenta");
      throw e;
    }
  });
  redirect("/perfil?verificado=1");
}

export async function buyPack(listingId: string, fd: FormData) {
  const back = `/destacar/${listingId}`;
  const user = await requireUser(back);
  const url = await runOrBack(back, async () => {
    const code = str(fd, "pack");
    const key = str(fd, "idempotencyKey");
    if (!isPackCode(code)) throw new UserError("Elige un pack");
    if (!/^[\w-]{16,64}$/.test(key)) throw new UserError("Recarga la página e inténtalo de nuevo");
    return startPackPurchase(user.id, listingId, code, key);
  });
  redirect(url);
}

/** Solo desarrollo, sin claves de Stripe: simula que el pago del pack se completó. */
export async function confirmDevPayment(purchaseId: string) {
  const user = await requireUser("/mis-anuncios");
  if (!devPaymentsAllowed()) throw new Error("No disponible");
  const p = await db.packPurchase.findUnique({ where: { id: purchaseId } });
  if (!p || p.userId !== user.id) throw new Error("Compra no encontrada");
  await activatePackPurchase(purchaseId);
  redirect(`/mis-anuncios?pagado=${purchaseId}`);
}

export async function subscribePro() {
  const user = await requireUser("/pro");
  const url = await runOrBack("/pro", () => startProCheckout(user.id));
  redirect(url);
}

/** Borrar la cuenta (lo exige Google Play y el RGPD). Pide la contraseña para confirmar. */
export async function deleteMyAccount(fd: FormData) {
  const user = await requireUser("/borrar-cuenta");
  await runOrBack("/borrar-cuenta", async () => {
    if (fd.get("confirm") !== "on") throw new UserError("Marca la casilla para confirmar que quieres borrar la cuenta");
    if (!(await verifyPassword(str(fd, "password"), user.passwordHash))) throw new UserError("La contraseña no es correcta");
    await deleteAccount(user.id);
  });
  await destroySession();
  redirect("/?cuenta=borrada");
}
