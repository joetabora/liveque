"use client";

export function IronQueueLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={`flex items-center gap-3 ${sizeClasses[size]}`}>
      <div className="flex items-center">
        <span className="font-black tracking-tighter text-white">IRON</span>
        <span className="font-black tracking-tighter text-harley-orange">QUEUE</span>
      </div>
      <div className="h-6 w-px bg-iron-border" />
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
        Service Queue
      </span>
    </div>
  );
}
