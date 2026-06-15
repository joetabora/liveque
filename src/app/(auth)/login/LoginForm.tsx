"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { IronQueueLogo } from "@/components/IronQueueLogo";
import { resolvePostLoginPath } from "@/lib/auth/post-login";

async function fetchPostLoginDestination() {
  const res = await fetch("/api/me", { credentials: "include" });
  if (!res.ok) return "/onboarding";
  const data = await res.json();
  return resolvePostLoginPath("/", data.tenants ?? [], !!data.platformAdmin);
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;

    redirectAfterLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function redirectAfterLogin() {
    if (
      callbackUrl &&
      callbackUrl !== "/" &&
      !callbackUrl.startsWith("/login") &&
      !callbackUrl.startsWith("/signup")
    ) {
      router.replace(callbackUrl);
      router.refresh();
      return;
    }

    const destination = await fetchPostLoginDestination();
    router.replace(destination);
    router.refresh();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    await redirectAfterLogin();
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError("Enter your email first");
      return;
    }
    setLoading(true);
    const destination = callbackUrl ?? "/";
    await signIn("resend", { email, callbackUrl: destination, redirect: false });
    setLoading(false);
    router.push("/verify-email");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-iron-black px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <IronQueueLogo size="md" />
          <p className="mt-4 text-gray-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-iron-panel border border-iron-border rounded-2xl p-6">
          {error && (
            <div className="text-sm text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary/50"
              required
            />
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={handleMagicLink} disabled={loading}>
            Send Magic Link
          </Button>

          <div className="flex justify-between text-sm pt-2">
            <Link href="/forgot-password" className="text-gray-500 hover:text-brand-primary">
              Forgot password?
            </Link>
            <Link href="/signup" className="text-gray-500 hover:text-brand-primary">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
