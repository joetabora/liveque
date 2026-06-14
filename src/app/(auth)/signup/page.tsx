"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { IronQueueLogo } from "@/components/IronQueueLogo";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Signup failed");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-iron-black px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <IronQueueLogo size="md" />
          <p className="mt-4 text-gray-500">Create your LiveQue account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-iron-panel border border-iron-border rounded-2xl p-6">
          {error && (
            <div className="text-sm text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary/50"
              required
            />
          </div>

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
              minLength={8}
              className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-primary/50"
              required
            />
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Create Account
          </Button>

          <p className="text-sm text-center text-gray-500 pt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
