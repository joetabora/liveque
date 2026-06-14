import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db";
import { tenants, subscriptions } from "@/db/schema";
import { getStripe, PLAN_AMOUNTS, getPlanTierFromPriceId } from "@/lib/stripe/client";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanTier } from "@/db/schema/subscriptions";
import { jsonError, jsonSuccess } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return jsonError("Missing signature", 400);
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return jsonError("Invalid signature", 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;
        const planTier = (session.metadata?.planTier ?? "starter") as PlanTier;

        if (tenantId && session.subscription) {
          const subResponse = await getStripe().subscriptions.retrieve(
            session.subscription as string
          );
          const sub = subResponse as unknown as Stripe.Subscription & {
            current_period_start?: number;
            current_period_end?: number;
          };

          await db
            .update(tenants)
            .set({
              subscriptionStatus: "active",
              planTier,
              updatedAt: new Date(),
            })
            .where(eq(tenants.id, tenantId));

          const limits = PLAN_LIMITS[planTier];
          const [existingSub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.tenantId, tenantId))
            .limit(1);

          const subData = {
            tenantId,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0]?.price.id,
            status: sub.status,
            planTier,
            currentPeriodStart: sub.current_period_start
              ? new Date(sub.current_period_start * 1000)
              : null,
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : null,
            locationLimit: limits.locations ?? 1,
            displayLimit: limits.displays,
            staffLimit: limits.staff,
            updatedAt: new Date(),
          };

          if (existingSub) {
            await db
              .update(subscriptions)
              .set(subData)
              .where(eq(subscriptions.id, existingSub.id));
          } else {
            await db.insert(subscriptions).values(subData);
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription & {
          current_period_start?: number;
          current_period_end?: number;
        };

        const priceId = sub.items.data[0]?.price.id;
        const planTier =
          getPlanTierFromPriceId(priceId) ??
          (sub.metadata?.planTier as PlanTier | undefined);

        const [existingSub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, sub.id))
          .limit(1);

        const tenantId = sub.metadata?.tenantId ?? existingSub?.tenantId;

        if (tenantId) {
          const tenantUpdate: {
            subscriptionStatus: string;
            updatedAt: Date;
            planTier?: PlanTier;
          } = {
            subscriptionStatus: sub.status,
            updatedAt: new Date(),
          };

          if (planTier) {
            tenantUpdate.planTier = planTier;
          }

          await db
            .update(tenants)
            .set(tenantUpdate)
            .where(eq(tenants.id, tenantId));

          const limits = planTier ? PLAN_LIMITS[planTier] : null;
          await db
            .update(subscriptions)
            .set({
              status: sub.status,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              currentPeriodStart: sub.current_period_start
                ? new Date(sub.current_period_start * 1000)
                : null,
              currentPeriodEnd: sub.current_period_end
                ? new Date(sub.current_period_end * 1000)
                : null,
              ...(planTier ? { planTier } : {}),
              ...(priceId ? { stripePriceId: priceId } : {}),
              ...(limits
                ? {
                    locationLimit: limits.locations ?? 1,
                    displayLimit: limits.displays,
                    staffLimit: limits.staff,
                  }
                : {}),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubscriptionId, sub.id));
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const [tenant] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.stripeCustomerId, customerId))
          .limit(1);

        if (tenant) {
          await db
            .update(tenants)
            .set({ subscriptionStatus: "past_due", updatedAt: new Date() })
            .where(eq(tenants.id, tenant.id));
        }
        break;
      }
    }

    return jsonSuccess({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return jsonError("Webhook handler failed", 500);
  }
}
