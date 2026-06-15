import "./load-env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { authUsers } from "../src/db/schema/auth";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }

  console.log("Using pooler:", url.includes("-pooler"));
  console.log("channel_binding:", url.includes("channel_binding"));

  const sql = neon(url);
  const db = drizzle(sql);

  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `;
  console.log("Tables:", tables.map((t) => t.table_name).join(", "));

  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'auth_users' ORDER BY ordinal_position
  `;
  console.log("auth_users columns:", cols.map((c) => c.column_name).join(", "));

  const rows = await db
    .select()
    .from(authUsers)
    .where(eq(authUsers.email, "brewcityriot@gmail.com"))
    .limit(1);
  console.log("auth_users query OK, rows:", rows.length);
}

main().catch((err) => {
  console.error("DB test failed:", err);
  process.exit(1);
});
