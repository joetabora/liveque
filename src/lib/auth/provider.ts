export interface AuthSession {
  userId: string;
  email: string;
  name?: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  emailVerified: boolean;
}

export interface AuthProvider {
  getSession(): Promise<AuthSession | null>;
  requireUser(): Promise<AuthUser>;
  signOut(): Promise<void>;
}

export type AuthProviderType = "authjs" | "clerk";

export function getAuthProviderType(): AuthProviderType {
  const provider = process.env.AUTH_PROVIDER ?? "authjs";
  if (provider === "clerk") return "clerk";
  return "authjs";
}
