import "server-only";
import Stripe from "stripe";

export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;

let client: Stripe | null = null;
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe no está configurado");
  return (client ??= new Stripe(process.env.STRIPE_SECRET_KEY));
}

/** Sin claves de Stripe y fuera de producción se puede simular el pago para probar la app. */
export const devPaymentsAllowed = () => !stripeEnabled() && process.env.NODE_ENV !== "production";

export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
