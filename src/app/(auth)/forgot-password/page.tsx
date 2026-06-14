"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IronQueueLogo } from "@/components/IronQueueLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-iron-black px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <IronQueueLogo size="md" />
          <p className="mt-4 text-gray-500">Reset your password</p>
        </div>

        {sent ? (
          <div className="bg-iron-panel border border-iron-border rounded-2xl p-6 text-center">
            <p className="text-gray-300">If an account exists, we sent reset instructions.</p>
            <Link href="/login" className="inline-block mt-4 text-brand-primary hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-iron-panel border border-iron-border rounded-2xl p-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-iron-dark border border-iron-border rounded-xl px-4 py-2.5 text-white"
                required
              />
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              Send Reset Link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
