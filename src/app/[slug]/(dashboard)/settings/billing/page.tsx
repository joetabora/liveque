import { Suspense } from "react";
import BillingSettingsContent from "./BillingSettingsContent";

export default function BillingSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-8 w-48 bg-iron-panel rounded animate-pulse" />
          <div className="h-40 bg-iron-panel rounded-xl animate-pulse" />
        </div>
      }
    >
      <BillingSettingsContent />
    </Suspense>
  );
}
