import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "@/db";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";

export async function GET() {
  try {
    const url = getDatabaseUrl();
    const sql = neon(url);

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    const hasAuthUsers = tables.some((t) => t.table_name === "auth_users");

    await sql`SELECT 1 AS ok`;

    return jsonSuccess({
      ok: true,
      pooler: url.includes("-pooler"),
      tableCount: tables.length,
      hasAuthUsers,
      tables: tables.map((t) => t.table_name),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
