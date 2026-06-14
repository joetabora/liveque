import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { NewAuditLog } from "@/db/schema";

export async function logAuditEvent(
  event: Omit<NewAuditLog, "id" | "createdAt">
) {
  try {
    await db.insert(auditLogs).values(event);
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
