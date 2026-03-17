"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  animate?: boolean;
}

export function Panel({
  children,
  className = "",
  glow = false,
  animate = true,
}: PanelProps) {
  const Wrapper = animate ? motion.div : "div";
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      }
    : {};

  return (
    <Wrapper
      className={`
        bg-iron-panel border border-iron-border rounded-2xl p-6
        ${glow ? "glow-orange border-harley-orange/30" : ""}
        ${className}
      `}
      {...animationProps}
    >
      {children}
    </Wrapper>
  );
}
