import Link from "next/link";
import { IronQueueLogo } from "@/components/IronQueueLogo";
import { Button } from "@/components/ui/Button";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-iron-black px-4">
      <div className="w-full max-w-md text-center">
        <IronQueueLogo size="md" />
        <h1 className="mt-6 text-2xl font-bold">Check your email</h1>
        <p className="mt-3 text-gray-500">
          We sent you a sign-in link. Click it to verify your email and continue.
        </p>
        <Link href="/login" className="inline-block mt-8">
          <Button variant="secondary">Back to login</Button>
        </Link>
      </div>
    </div>
  );
}
