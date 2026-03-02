import React from "react";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]): string {
  const classes: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string") {
      classes.push(input);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }
  return classes.join(" ");
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gradient" | "outlined";
  loading?: boolean;
  onClick?: () => void;
}

const colorStyles = {
  default: {
    bg: "bg-[var(--card)]",
    border: "border-[var(--border)]",
    icon: "text-[var(--muted-foreground)] bg-[var(--secondary)]",
    gradient: "",
  },
  primary: {
    bg: "bg-[var(--primary)]/5",
    border: "border-[var(--primary)]/20",
    icon: "text-[var(--primary)] bg-[var(--primary)]/15",
    gradient: "from-[var(--primary)]/10 to-[var(--primary)]/5",
  },
  success: {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    icon: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15",
    gradient: "from-emerald-500/10 to-emerald-500/5",
  },
  warning: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    icon: "text-amber-600 dark:text-amber-400 bg-amber-500/15",
    gradient: "from-amber-500/10 to-amber-500/5",
  },
  danger: {
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    icon: "text-red-600 dark:text-red-400 bg-red-500/15",
    gradient: "from-red-500/10 to-red-500/5",
  },
  info: {
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    icon: "text-blue-600 dark:text-blue-400 bg-blue-500/15",
    gradient: "from-blue-500/10 to-blue-500/5",
  },
};

const sizeStyles = {
  sm: {
    padding: "px-3 py-2.5",
    value: "text-lg",
    label: "text-[10px]",
    icon: "w-8 h-8",
    iconSize: "w-4 h-4",
  },
  md: {
    padding: "px-4 py-3",
    value: "text-xl sm:text-2xl",
    label: "text-xs",
    icon: "w-10 h-10",
    iconSize: "w-5 h-5",
  },
  lg: {
    padding: "px-5 py-4",
    value: "text-2xl sm:text-3xl",
    label: "text-sm",
    icon: "w-12 h-12",
    iconSize: "w-6 h-6",
  },
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  color = "default",
  size = "md",
  variant = "default",
  loading = false,
  onClick,
}: MetricCardProps) {
  const colorConfig = colorStyles[color];
  const sizeConfig = sizeStyles[size];

  const bgClass = variant === "gradient" 
    ? `bg-gradient-to-br ${colorConfig.gradient}` 
    : colorConfig.bg;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xl border overflow-hidden transition-all duration-200",
        sizeConfig.padding,
        bgClass,
        colorConfig.border,
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
        variant === "outlined" && "bg-transparent"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-[var(--muted-foreground)] font-medium uppercase tracking-wide",
            sizeConfig.label
          )}>
            {label}
          </p>
          
          {loading ? (
            <div className="h-7 w-20 mt-1.5 bg-[var(--muted)] rounded-lg animate-pulse" />
          ) : (
            <p className={cn(
              "font-bold text-[var(--foreground)] mt-1 tracking-tight",
              sizeConfig.value
            )}>
              {value}
            </p>
          )}

          {trend && !loading && (
            <div className="flex items-center gap-1.5 mt-2">
              <div
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                  trend.isPositive
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/15 text-red-600 dark:text-red-400"
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(trend.value)}%
              </div>
            </div>
          )}
        </div>

        {Icon && (
          <div className={cn(
            "rounded-xl flex items-center justify-center flex-shrink-0",
            sizeConfig.icon,
            colorConfig.icon
          )}>
            <Icon className={sizeConfig.iconSize} />
          </div>
        )}
      </div>
    </div>
  );
}

interface SummaryCardProps {
  items: Array<{
    label: string;
    value: string | number;
    icon?: LucideIcon;
    color?: "default" | "primary" | "success" | "warning" | "danger";
  }>;
  columns?: 2 | 3 | 4;
  size?: "sm" | "md";
}

export function SummaryCards({ items, columns = 4, size = "sm" }: SummaryCardProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-3", gridCols[columns])}>
      {items.map((item, index) => (
        <MetricCard
          key={index}
          label={item.label}
          value={item.value}
          icon={item.icon}
          color={item.color}
          size={size}
        />
      ))}
    </div>
  );
}

interface CompactStatProps {
  label: string;
  value: string | number;
  subValue?: string;
}

export function CompactStat({ label, value, subValue }: CompactStatProps) {
  return (
    <div className="rounded-lg bg-[var(--secondary)]/40 border border-[var(--border)] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)] font-medium">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-[var(--foreground)]">{value}</p>
      {subValue && (
        <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{subValue}</p>
      )}
    </div>
  );
}

interface ProgressStatProps {
  label: string;
  value: number;
  maxValue: number;
  unit?: string;
  color?: "primary" | "success" | "warning" | "danger";
}

const progressColors = {
  primary: "from-[var(--primary)] to-[var(--chart-1)]",
  success: "from-emerald-500 to-emerald-400",
  warning: "from-amber-500 to-amber-400",
  danger: "from-red-500 to-red-400",
};

export function ProgressStat({ label, value, maxValue, unit = "", color = "primary" }: ProgressStatProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
        <span className="text-sm font-semibold text-[var(--foreground)]">
          {value}{unit} <span className="text-[var(--muted-foreground)] font-normal">/ {maxValue}{unit}</span>
        </span>
      </div>
      <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 bg-gradient-to-r",
            progressColors[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 text-right">
        {percentage.toFixed(0)}% завершено
      </p>
    </div>
  );
}
