import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireTenantRole } from "@/lib/auth/permissions";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { getStripe } from "@/lib/stripe/client";
import { APP_URL } from "@/lib/constants";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const { tenant } = await requireTenantRole(slug, "owner");

    if (!tenant.stripeCustomerId) {
      return handleApiError(new Error("No billing account found"));
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${APP_URL}/${slug}/settings/billing`,
    });

    return jsonSuccess({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
