"use client";

type BadgeVariant = "orange" | "green" | "gray" | "red";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  orange: "bg-harley-orange/20 text-harley-orange border-harley-orange/30",
  green: "bg-green-500/20 text-green-400 border-green-500/30",
  gray: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  red: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function Badge({ children, variant = "gray", pulse = false }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
        uppercase tracking-wider border
        ${variantStyles[variant]}
      `}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
