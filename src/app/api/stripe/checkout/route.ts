import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants, subscriptions } from "@/db/schema";
import { requireAuth } from "@/lib/auth/permissions";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { checkoutSchema } from "@/lib/validation/schemas";
import { getStripe, PLAN_PRICES } from "@/lib/stripe/client";
import { APP_URL } from "@/lib/constants";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { planTier, tenantId } = checkoutSchema.parse(body);

    const priceId = PLAN_PRICES[planTier];
    if (!priceId) {
      return handleApiError(new Error("Stripe price not configured"));
    }

    let tenant;
    if (tenantId) {
      [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);
    }

    const stripe = getStripe();

    let customerId = tenant?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { tenantId: tenant?.id ?? "" },
      });
      customerId = customer.id;

      if (tenant) {
        await db
          .update(tenants)
          .set({ stripeCustomerId: customerId, updatedAt: new Date() })
          .where(eq(tenants.id, tenant.id));
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { tenantId: tenant?.id ?? "", planTier },
      },
      success_url: `${APP_URL}/${tenant?.slug ?? "onboarding"}/settings/billing?success=1`,
      cancel_url: `${APP_URL}/onboarding/plan?canceled=1`,
      metadata: { tenantId: tenant?.id ?? "", planTier, userId: user.id },
    });

    return jsonSuccess({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
