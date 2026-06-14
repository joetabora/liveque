import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    logoUrl: text("logo_url"),
    brandColor: text("brand_color").default("#0065a6"),
    accentColor: text("accent_color").default("#004f85"),
    welcomeMessage: text("welcome_message").default("Welcome To"),
    displayHeadline: text("display_headline").default("Today's Appointments"),
    settings: jsonb("settings").$type<TenantSettings>().default({}),
    stripeCustomerId: text("stripe_customer_id"),
    subscriptionStatus: text("subscription_status").default("active"),
    planTier: text("plan_tier").default("enterprise"),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("tenants_slug_idx").on(table.slug)]
);

export interface TenantSettings {
  terminology?: {
    guestLabel?: string;
    queueLabel?: string;
  };
  serviceTypes?: string[];
  timezone?: string;
}

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
