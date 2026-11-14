"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { revokeReferral } from "@/lib/referrals";

export async function reviewKyc(userId: string, decision: "verified" | "rejected") {
  await requireAdmin();
  // Solo se decide sobre verificaciones pendientes (repetir el clic no cambia nada).
  await db.user.updateMany({
    where: { id: userId, kycStatus: "pending" },
    data: { kycStatus: decision, kycVerifiedAt: decision === "verified" ? new Date() : null },
  });
  redirect("/admin");
}

export async function annulReferral(referralId: string) {
  await requireAdmin();
  await revokeReferral(referralId);
  redirect("/admin#invitaciones");
}
