"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface RatingBadgeProps {
  rating: number;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "default" | "overlay" | "inline";
  showIcon?: boolean;
  className?: string;
}

const formatRating = (value?: number) => {
  const num = typeof value === "number" ? value : 0;
  return num.toFixed(1).replace(/\.0$/, "");
};

const RatingIcon = ({ className }: { className?: string }) => (
  <Sparkles className={className} />
);

export default function RatingBadge({
  rating,
  size = "sm",
  variant = "default",
  showIcon = true,
  className = "",
}: RatingBadgeProps) {
  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[10px] gap-0.5",
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-2.5 py-1.5 text-sm gap-1.5",
    lg: "px-3 py-2 text-base gap-2",
  };

  const iconSizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const getRatingColor = (value: number) => {
    if (value >= 8) return "text-[var(--primary)]";
    if (value >= 6) return "text-[var(--chart-2)]";
    return "text-[var(--muted-foreground)]";
  };

  const variantClasses = {
    default: `rounded-md border border-[var(--border)] bg-[var(--accent)] ${getRatingColor(rating)}`,
    overlay: `rounded-md bg-black/60 backdrop-blur-md border border-[var(--primary)]/30 text-white`,
    inline: `${getRatingColor(rating)}`,
  };

  return (
    <span
      className={`inline-flex items-center font-semibold ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {showIcon && <RatingIcon className={`${iconSizes[size]} shrink-0`} />}
      <span>{formatRating(rating)}</span>
    </span>
  );
}

export { RatingIcon, formatRating };
