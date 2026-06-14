import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { authUsers, authVerificationTokens } from "@/db/schema";
import { handleApiError, jsonSuccess } from "@/lib/api-utils";
import { z } from "zod";
import { authRateLimit, checkRateLimit } from "@/lib/rate-limit";
import { APP_URL } from "@/lib/constants";
import { getClientIp } from "@/lib/tenant-utils";

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request) ?? "unknown";
    const rateCheck = await checkRateLimit(authRateLimit, `forgot:${ip}`);
    if (!rateCheck.success) {
      return handleApiError(new Error("Too many requests"));
    }

    const { email } = schema.parse(await request.json());
    const normalizedEmail = email.toLowerCase();

    const [user] = await db
      .select()
      .from(authUsers)
      .where(eq(authUsers.email, normalizedEmail))
      .limit(1);

    if (user && process.env.RESEND_API_KEY) {
      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await db
        .delete(authVerificationTokens)
        .where(eq(authVerificationTokens.identifier, normalizedEmail));

      await db.insert(authVerificationTokens).values({
        identifier: normalizedEmail,
        token,
        expires,
      });

      const resend = new Resend(process.env.RESEND_API_KEY);
      const resetUrl = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "LiveQue <onboarding@liveque.com>",
        to: normalizedEmail,
        subject: "Reset your LiveQue password",
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
      });
    }

    return jsonSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
