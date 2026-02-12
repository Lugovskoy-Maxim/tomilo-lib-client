import React from "react";

// Simple cn utility function
function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string") {
      classes.push(input);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(" ");
}

interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  noPadding?: boolean;
  /** Отключить эффект hover (удобно для карточек-обёрток таблиц) */
  noHover?: boolean;
}

export function AdminCard({
  children,
  className,
  title,
  icon,
  action,
  footer,
  loading = false,
  noPadding = false,
  noHover = false,
}: AdminCardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden",
        "transition-all duration-200",
        !noHover && "hover:shadow-lg hover:border-[var(--primary)]/20",
        className
      )}
    >
      {/* Header */}
      {(title || icon || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--secondary)]/30">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                {icon}
              </div>
            )}
            {title && (
              <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">
                {title}
              </h3>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}

      {/* Content */}
      <div className={cn(!noPadding && "p-4")}>
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-[var(--muted)] rounded animate-pulse w-3/4" />
            <div className="h-4 bg-[var(--muted)] rounded animate-pulse w-1/2" />
            <div className="h-20 bg-[var(--muted)] rounded animate-pulse" />
          </div>
        ) : (
          children
        )}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--secondary)]/20">
          {footer}
        </div>
      )}
    </div>
  );
}

// Stat Card - специализированная карточка для статистики
interface StatCardProps {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "purple" | "orange" | "red" | "cyan" | "pink" | "yellow";
  loading?: boolean;
  onClick?: () => void;
}

const colorMap = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  green: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
};

export function StatCard({
  value,
  label,
  icon,
  trend,
  color = "blue",
  loading = false,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-[var(--card)] rounded-xl border p-4",
        "transition-all duration-200",
        "hover:shadow-md",
        onClick && "cursor-pointer hover:scale-[1.02]",
        colorMap[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          {loading ? (
            <>
              <div className="h-8 w-20 bg-[var(--muted)] rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-[var(--muted)] rounded animate-pulse" />
            </>
          ) : (
            <>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm opacity-80 mt-1">{label}</p>
            </>
          )}
        </div>
        <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20">{icon}</div>
      </div>

      {trend && !loading && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="opacity-60">vs прошлый период</span>
        </div>
      )}
    </div>
  );
}

// Mini Card - компактная карточка для мелких элементов
interface MiniCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

export function MiniCard({
  children,
  className,
  onClick,
  active = false,
}: MiniCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border transition-all duration-200",
        "bg-[var(--card)] border-[var(--border)]",
        onClick && "cursor-pointer hover:border-[var(--primary)]/50",
        active && "border-[var(--primary)] bg-[var(--primary)]/5",
        className
      )}
    >
      {children}
    </div>
  );
}
