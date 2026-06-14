"use client";

import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-iron-black px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="mt-2 text-gray-500">{error.message}</p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
