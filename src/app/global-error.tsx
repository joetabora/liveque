"use client";

import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-iron-black text-white">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold">Application error</h2>
          <p className="mt-2 text-gray-500">{error.message}</p>
          <Button className="mt-6" onClick={reset}>
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
