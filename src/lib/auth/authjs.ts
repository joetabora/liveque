import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  authUsers,
  authAccounts,
  authSessions,
  authVerificationTokens,
  userCredentials,
  users,
} from "@/db/schema";
import type { AuthProvider } from "./provider";
import type { AuthSession, AuthUser } from "./provider";

function getAuthAdapter() {
  if (!process.env.DATABASE_URL?.trim()) return undefined;

  return DrizzleAdapter(getDb(), {
    usersTable: authUsers,
    accountsTable: authAccounts,
    sessionsTable: authSessions,
    verificationTokensTable: authVerificationTokens,
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: getAuthAdapter(),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-email",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase();
        const password = String(credentials.password);

        const [authUser] = await getDb()
          .select()
          .from(authUsers)
          .where(eq(authUsers.email, email))
          .limit(1);

        if (!authUser) return null;

        const [cred] = await getDb()
          .select()
          .from(userCredentials)
          .where(eq(userCredentials.userId, authUser.id))
          .limit(1);

        if (!cred) return null;

        const valid = await bcrypt.compare(password, cred.passwordHash);
        if (!valid) return null;

        return {
          id: authUser.id,
          email: authUser.email,
          name: authUser.name,
        };
      },
    }),
    ...(process.env.RESEND_API_KEY
      ? [
          Resend({
            apiKey: process.env.RESEND_API_KEY,
            from: process.env.EMAIL_FROM ?? "LiveQue <onboarding@liveque.com>",
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async signIn({ user }) {
      if (!user.id || !user.email) return true;

      await syncAppUser(user.id, user.email, user.name ?? null);
      return true;
    },
  },
});

async function syncAppUser(
  authProviderId: string,
  email: string,
  name: string | null
) {
  const normalizedEmail = email.toLowerCase();
    const [existing] = await getDb()
    .select()
    .from(users)
    .where(eq(users.authProviderId, authProviderId))
    .limit(1);

  if (existing) {
    await getDb()
      .update(users)
      .set({ email: normalizedEmail, name, updatedAt: new Date() })
      .where(eq(users.id, existing.id));
    return;
  }

  await getDb().insert(users).values({
    authProviderId,
    email: normalizedEmail,
    name,
    emailVerifiedAt: new Date(),
  });
}

class AuthJsProvider implements AuthProvider {
  async getSession(): Promise<AuthSession | null> {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) return null;

    return {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  }

  async requireUser(): Promise<AuthUser> {
    const session = await this.getSession();
    if (!session) throw new Error("Unauthorized");

    const [appUser] = await getDb()
      .select()
      .from(users)
      .where(eq(users.authProviderId, session.userId))
      .limit(1);

    if (!appUser) throw new Error("User not found");

    return {
      id: appUser.id,
      email: session.email,
      name: session.name,
      emailVerified: !!appUser.emailVerifiedAt,
    };
  }

  async signOut(): Promise<void> {
    await signOut({ redirect: false });
  }
}

let authJsProvider: AuthJsProvider | null = null;

export function getAuthProvider(): AuthProvider {
  const type = process.env.AUTH_PROVIDER ?? "authjs";
  if (type === "clerk") {
    throw new Error("Clerk provider not yet implemented. Set AUTH_PROVIDER=authjs");
  }
  if (!authJsProvider) authJsProvider = new AuthJsProvider();
  return authJsProvider;
}

export async function getAppUserByAuthId(authProviderId: string) {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.authProviderId, authProviderId))
    .limit(1);
  return user ?? null;
}
