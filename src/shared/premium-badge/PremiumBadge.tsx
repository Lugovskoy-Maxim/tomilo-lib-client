"use client";

import { Crown } from "lucide-react";

type Size = "xs" | "sm" | "md";

const sizeClasses: Record<Size, string> = {
  xs: "w-3 h-3",
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
};

interface PremiumBadgeProps {
  /** Размер иконки */
  size?: Size;
  /** Дополнительные классы для обёртки */
  className?: string;
  /** Только иконка (по умолчанию с title для доступности) */
  ariaLabel?: string;
}

/**
 * Значок премиум-подписчика (корона). Используется рядом с именем или на аватаре.
 */
export function PremiumBadge({ size = "sm", className = "", ariaLabel = "Премиум" }: PremiumBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center text-amber-500 shrink-0 ${className}`}
      title={ariaLabel}
      aria-label={ariaLabel}
      role="img"
    >
      <Crown className={sizeClasses[size]} />
    </span>
  );
}

/**
 * Оверлей короны на аватаре (правый нижний угол).
 */
export function PremiumAvatarOverlay({ iconSize = "sm" }: { iconSize?: Size }) {
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white border-2 border-[var(--background)] shadow-sm z-10"
      title="Премиум"
      aria-label="Премиум"
      role="img"
    >
      <Crown className={sizeClasses[iconSize]} />
    </span>
  );
}
