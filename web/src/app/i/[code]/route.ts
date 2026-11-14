import { NextResponse, type NextRequest } from "next/server";
import { REFERRALS } from "@/lib/config";
import { REF_COOKIE } from "@/lib/auth";
import { cleanReferralCode } from "@/lib/referral-rules";
import { appUrl } from "@/lib/stripe";

// Enlace personal de invitación: alquilaap.com/i/CODIGO. Recuerda el código unos días y lleva a crear la cuenta.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const code = cleanReferralCode((await params).code);
  if (!code) return NextResponse.redirect(`${appUrl()}/registro`);
  const res = NextResponse.redirect(`${appUrl()}/registro?ref=${code}`);
  res.cookies.set(REF_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFERRALS.cookieDays * 86_400,
  });
  return res;
}
