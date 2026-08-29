import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const displays = pgTable(
  "displays",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    layout: jsonb("layout").$type<DisplayLayout>().default({ type: "default" }),
    isActive: boolean("is_active").default(true).notNull(),
    publicToken: text("public_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("displays_tenant_slug_idx").on(table.tenantId, table.slug),
    index("displays_tenant_id_idx").on(table.tenantId),
  ]
);

export interface DisplayLayout {
  type: "default" | "compact" | "portrait" | "media-portrait";
}

export type Display = typeof displays.$inferSelect;
export type NewDisplay = typeof displays.$inferInsert;
