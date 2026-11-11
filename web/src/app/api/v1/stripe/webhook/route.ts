import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { handleStripeEvent } from "@/lib/payments";

// Stripe avisa aquí de pagos de packs y cambios en suscripciones Pro. Repetir un aviso no tiene efecto (idempotente).
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return NextResponse.json({ error: "not configured" }, { status: 400 });
  let event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  const result = await handleStripeEvent(event);
  return NextResponse.json({ received: true, result });
}
