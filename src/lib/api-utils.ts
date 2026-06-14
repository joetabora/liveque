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
    if (error.message === "Forbidden") {
      return jsonError("Forbidden", 403);
    }
    if (error.message === "Tenant not found") {
      return jsonError("Tenant not found", 404);
    }
    console.error("API error:", error.message);
    return jsonError(error.message, 500);
  }
  console.error("Unknown API error:", error);
  return jsonError("Internal server error", 500);
}

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
