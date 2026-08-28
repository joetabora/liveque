import "./load-env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as schema from "../src/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const MKEHD_SLUG = process.env.LEGACY_TENANT_SLUG ?? "mkehd";
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const MKE_STAFF_EMAILS = (process.env.MKE_STAFF_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function ensurePortraitDisplay(tenantId: string) {
  const [existing] = await db
    .select()
    .from(schema.displays)
    .where(
      and(
        eq(schema.displays.tenantId, tenantId),
        eq(schema.displays.slug, "portrait")
      )
    )
    .limit(1);

  if (existing) {
    console.log(`Portrait display already exists (${existing.id})`);
    return;
  }

  await db.insert(schema.displays).values({
    tenantId,
    slug: "portrait",
    name: "Portrait Kiosk",
    publicToken: randomUUID(),
    layout: { type: "portrait" },
    isActive: true,
  });

  console.log(`Created portrait display for tenant ${MKEHD_SLUG}`);
}

async function ensureStaffMemberships(tenantId: string) {
  if (MKE_STAFF_EMAILS.length === 0) {
    console.log(
      "No MKE_STAFF_EMAILS set — sign up staff accounts, then re-run with MKE_STAFF_EMAILS=email@example.com"
    );
    return;
  }

  for (const email of MKE_STAFF_EMAILS) {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user) {
      console.log(`Staff email ${email} not found — sign up first, then re-run seed`);
      continue;
    }

    const [existing] = await db
      .select()
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.tenantId, tenantId),
          eq(schema.memberships.userId, user.id)
        )
      )
      .limit(1);

    if (existing) {
      console.log(`Membership already exists for ${email} (${existing.role})`);
      continue;
    }

    await db.insert(schema.memberships).values({
      tenantId,
      userId: user.id,
      role: "owner",
    });

    console.log(`Granted owner membership to ${email} for tenant ${MKEHD_SLUG}`);
  }
}

async function seed() {
  console.log("Seeding LiveQue database...");

  const [existing] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, MKEHD_SLUG))
    .limit(1);

  if (existing) {
    console.log(`Tenant "${MKEHD_SLUG}" already exists (${existing.id})`);
    await ensurePortraitDisplay(existing.id);
    await ensureStaffMemberships(existing.id);

    if (SUPER_ADMIN_EMAIL) {
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, SUPER_ADMIN_EMAIL.toLowerCase()))
        .limit(1);

      if (user) {
        await db
          .insert(schema.platformAdmins)
          .values({ userId: user.id })
          .onConflictDoNothing();
        console.log(`Granted platform admin to ${SUPER_ADMIN_EMAIL}`);
      }
    }

    return existing;
  }

  const tenantId = randomUUID();

  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      id: tenantId,
      slug: MKEHD_SLUG,
      name: "Milwaukee Harley-Davidson",
      logoUrl: "/mkehd2.png",
      brandColor: "#0065a6",
      accentColor: "#004f85",
      welcomeMessage: "Welcome To",
      displayHeadline: "Today's Appointments",
      subscriptionStatus: "active",
      planTier: "enterprise",
      settings: {
        terminology: { guestLabel: "guests", queueLabel: "Appointments" },
        serviceTypes: [
          "Sales",
          "Oil Change",
          "Tire Service",
          "Engine Tune-Up",
          "Brake Service",
          "Custom Install",
          "Detailing",
          "General Service",
          "Inspection",
        ],
        timezone: "America/Chicago",
      },
    })
    .returning();

  await db.insert(schema.subscriptions).values({
    tenantId: tenant.id,
    status: "active",
    planTier: "enterprise",
    locationLimit: 99,
    displayLimit: 99,
    staffLimit: 99,
  });

  await db.insert(schema.displays).values({
    tenantId: tenant.id,
    slug: "main",
    name: "Main Display",
    publicToken: randomUUID(),
    layout: { type: "default" },
    isActive: true,
  });

  await ensurePortraitDisplay(tenant.id);

  console.log(`Created tenant "${MKEHD_SLUG}" with id ${tenant.id}`);

  await ensureStaffMemberships(tenant.id);

  if (SUPER_ADMIN_EMAIL) {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, SUPER_ADMIN_EMAIL.toLowerCase()))
      .limit(1);

    if (user) {
      await db
        .insert(schema.platformAdmins)
        .values({ userId: user.id })
        .onConflictDoNothing();
      console.log(`Granted platform admin to ${SUPER_ADMIN_EMAIL}`);
    } else {
      console.log(
        `Super admin email ${SUPER_ADMIN_EMAIL} not found — sign up first, then re-run seed`
      );
    }
  }

  return tenant;
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
