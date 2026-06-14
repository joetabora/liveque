import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
    });
  }
  return stripeInstance;
}

export const PLAN_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
} as const;

export const PLAN_AMOUNTS = {
  starter: 4900,
  professional: 9900,
} as const;

export type CheckoutPlanTier = keyof typeof PLAN_PRICES;

export function getPlanTierFromPriceId(
  priceId: string | null | undefined
): CheckoutPlanTier | null {
  if (!priceId) return null;
  if (priceId === PLAN_PRICES.starter) return "starter";
  if (priceId === PLAN_PRICES.professional) return "professional";
  return null;
}
