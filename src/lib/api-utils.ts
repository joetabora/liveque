import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError(error.issues[0]?.message ?? "Validation error", 400);
  }
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return jsonError("Unauthorized", 401);
    }
    if (error.message === "User not found") {
      return jsonError("Unauthorized", 401);
    }
    if (error.message === "Forbidden") {
      return jsonError("Forbidden", 403);
    }
    if (error.message === "Tenant not found") {
      return jsonError("Tenant not found", 404);
    }
    if (
      error.message === "DATABASE_URL is not configured" ||
      error.message === "DATABASE_URL is still a placeholder"
    ) {
      console.error("Database config error:", error.message);
      return jsonError(
        "Database is not configured on this deployment. Set DATABASE_URL in Vercel (Preview scope) and redeploy.",
        503
      );
    }
    const cause = "cause" in error ? String((error as { cause?: unknown }).cause) : "";
    console.error("API error:", error.message, cause);
    if (error.message.startsWith("Failed query:")) {
      return jsonError(
        "Database error. Confirm DATABASE_URL is set for Preview in Vercel, run npm run db:push, then redeploy.",
        503
      );
    }
    if (
      error.message.includes("Firebase Admin is not configured") ||
      error.message.includes("DECODER routines") ||
      error.message.includes("PEM") ||
      error.message.includes("UNAUTHENTICATED") ||
      error.message.includes("invalid_grant")
    ) {
      return jsonError(
        "Firebase Admin error. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Vercel Preview env.",
        503
      );
    }
    if (error.message === "Subscription inactive. Please update billing.") {
      return jsonError(error.message, 402);
    }
    return jsonError(error.message, 500);
  }
  console.error("Unknown API error:", error);
  return jsonError("Internal server error", 500);
}

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
