import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { authUsers, userCredentials, users } from "@/db/schema";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { signupSchema } from "@/lib/validation/schemas";
import { authRateLimit, checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/tenant-utils";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request) ?? "unknown";
    const rateCheck = await checkRateLimit(authRateLimit, `signup:${ip}`);
    if (!rateCheck.success) {
      return handleApiError(new Error("Too many requests"));
    }

    const body = await request.json();
    const { email, password, name } = signupSchema.parse(body);
    const normalizedEmail = email.toLowerCase();

    const [existing] = await db
      .select()
      .from(authUsers)
      .where(eq(authUsers.email, normalizedEmail))
      .limit(1);

    if (existing) {
      return handleApiError(new Error("Email already registered"));
    }

    const authUserId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);

    await db.insert(authUsers).values({
      id: authUserId,
      email: normalizedEmail,
      name,
    });

    await db.insert(userCredentials).values({
      userId: authUserId,
      passwordHash,
    });

    await db.insert(users).values({
      authProviderId: authUserId,
      email: normalizedEmail,
      name,
    });

    return jsonSuccess({ ok: true }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
