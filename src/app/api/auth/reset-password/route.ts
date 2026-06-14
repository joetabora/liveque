import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { authUsers, authVerificationTokens, userCredentials } from "@/db/schema";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { resetPasswordSchema } from "@/lib/validation/schemas";
import { authRateLimit, checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/tenant-utils";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request) ?? "unknown";
    const rateCheck = await checkRateLimit(authRateLimit, `reset:${ip}`);
    if (!rateCheck.success) {
      return handleApiError(new Error("Too many requests"));
    }

    const body = await request.json();
    const { email, token, password } = resetPasswordSchema.parse(body);
    const normalizedEmail = email.toLowerCase();

    const [stored] = await db
      .select()
      .from(authVerificationTokens)
      .where(
        and(
          eq(authVerificationTokens.identifier, normalizedEmail),
          eq(authVerificationTokens.token, token),
          gt(authVerificationTokens.expires, new Date())
        )
      )
      .limit(1);

    if (!stored) {
      return handleApiError(new Error("Invalid or expired reset link"));
    }

    const [authUser] = await db
      .select()
      .from(authUsers)
      .where(eq(authUsers.email, normalizedEmail))
      .limit(1);

    if (!authUser) {
      return handleApiError(new Error("Invalid or expired reset link"));
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [existingCred] = await db
      .select()
      .from(userCredentials)
      .where(eq(userCredentials.userId, authUser.id))
      .limit(1);

    if (existingCred) {
      await db
        .update(userCredentials)
        .set({ passwordHash })
        .where(eq(userCredentials.userId, authUser.id));
    } else {
      await db.insert(userCredentials).values({
        userId: authUser.id,
        passwordHash,
      });
    }

    await db
      .delete(authVerificationTokens)
      .where(
        and(
          eq(authVerificationTokens.identifier, normalizedEmail),
          eq(authVerificationTokens.token, token)
        )
      );

    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
