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
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  noPadding?: boolean;
  variant?: "default" | "elevated" | "outlined" | "gradient";
  interactive?: boolean;
  onClick?: () => void;
}

export function AdminCard({
  children,
  className,
  title,
  description,
  icon,
  action,
  footer,
  loading = false,
  noPadding = false,
  variant = "default",
  interactive = false,
  onClick,
}: AdminCardProps) {
  const variantStyles = {
    default: "bg-[var(--card)] border-[var(--border)]",
    elevated: "bg-[var(--card)] border-[var(--border)] shadow-lg shadow-black/5",
    outlined: "bg-transparent border-[var(--border)] border-dashed",
    gradient: "bg-gradient-to-br from-[var(--card)] to-[var(--secondary)]/30 border-[var(--border)]",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border overflow-hidden transition-all duration-200",
        variantStyles[variant],
        interactive && "cursor-pointer hover:border-[var(--primary)]/50 hover:shadow-md hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        className
      )}
    >
      {(title || icon || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--secondary)]/20">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base truncate">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
        </div>
      )}

      <div className={cn(!noPadding && "p-4")}>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-[var(--muted)] rounded-lg w-3/4" />
            <div className="h-4 bg-[var(--muted)] rounded-lg w-1/2" />
            <div className="h-20 bg-[var(--muted)] rounded-lg" />
          </div>
        ) : (
          children
        )}
      </div>

      {footer && (
        <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--secondary)]/10">
          {footer}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: "blue" | "green" | "purple" | "orange" | "red" | "cyan" | "pink" | "yellow";
  loading?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "filled" | "outlined" | "gradient";
}

const colorConfigs = {
  blue: {
    filled: "bg-blue-500/12 text-blue-600 dark:text-blue-400 border-blue-500/25",
    outlined: "border-blue-500/40 text-blue-600 dark:text-blue-400",
    gradient: "bg-gradient-to-br from-blue-500/15 to-blue-600/5 border-blue-500/25 text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/20",
    progressBg: "from-blue-500 to-blue-400",
  },
  green: {
    filled: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    outlined: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
    gradient: "bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border-emerald-500/25 text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/20",
    progressBg: "from-emerald-500 to-emerald-400",
  },
  purple: {
    filled: "bg-violet-500/12 text-violet-600 dark:text-violet-400 border-violet-500/25",
    outlined: "border-violet-500/40 text-violet-600 dark:text-violet-400",
    gradient: "bg-gradient-to-br from-violet-500/15 to-violet-600/5 border-violet-500/25 text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-500/20",
    progressBg: "from-violet-500 to-violet-400",
  },
  orange: {
    filled: "bg-orange-500/12 text-orange-600 dark:text-orange-400 border-orange-500/25",
    outlined: "border-orange-500/40 text-orange-600 dark:text-orange-400",
    gradient: "bg-gradient-to-br from-orange-500/15 to-orange-600/5 border-orange-500/25 text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-500/20",
    progressBg: "from-orange-500 to-orange-400",
  },
  red: {
    filled: "bg-red-500/12 text-red-600 dark:text-red-400 border-red-500/25",
    outlined: "border-red-500/40 text-red-600 dark:text-red-400",
    gradient: "bg-gradient-to-br from-red-500/15 to-red-600/5 border-red-500/25 text-red-600 dark:text-red-400",
    iconBg: "bg-red-500/20",
    progressBg: "from-red-500 to-red-400",
  },
  cyan: {
    filled: "bg-cyan-500/12 text-cyan-600 dark:text-cyan-400 border-cyan-500/25",
    outlined: "border-cyan-500/40 text-cyan-600 dark:text-cyan-400",
    gradient: "bg-gradient-to-br from-cyan-500/15 to-cyan-600/5 border-cyan-500/25 text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-500/20",
    progressBg: "from-cyan-500 to-cyan-400",
  },
  pink: {
    filled: "bg-pink-500/12 text-pink-600 dark:text-pink-400 border-pink-500/25",
    outlined: "border-pink-500/40 text-pink-600 dark:text-pink-400",
    gradient: "bg-gradient-to-br from-pink-500/15 to-pink-600/5 border-pink-500/25 text-pink-600 dark:text-pink-400",
    iconBg: "bg-pink-500/20",
    progressBg: "from-pink-500 to-pink-400",
  },
  yellow: {
    filled: "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25",
    outlined: "border-amber-500/40 text-amber-600 dark:text-amber-400",
    gradient: "bg-gradient-to-br from-amber-500/15 to-amber-600/5 border-amber-500/25 text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/20",
    progressBg: "from-amber-500 to-amber-400",
  },
};

const sizeConfigs = {
  sm: {
    padding: "p-3",
    value: "text-xl",
    label: "text-xs",
    icon: "p-1.5",
    trend: "text-[10px]",
  },
  md: {
    padding: "p-4",
    value: "text-2xl",
    label: "text-sm",
    icon: "p-2",
    trend: "text-xs",
  },
  lg: {
    padding: "p-5",
    value: "text-3xl",
    label: "text-sm",
    icon: "p-2.5",
    trend: "text-xs",
  },
};

export function StatCard({
  value,
  label,
  icon,
  trend,
  color = "blue",
  loading = false,
  onClick,
  size = "md",
  variant = "filled",
}: StatCardProps) {
  const colorConfig = colorConfigs[color];
  const sizeConfig = sizeConfigs[size];

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border transition-all duration-200",
        sizeConfig.padding,
        colorConfig[variant],
        onClick && "cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {loading ? (
            <>
              <div className="h-8 w-20 bg-current/10 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-24 bg-current/10 rounded-lg animate-pulse" />
            </>
          ) : (
            <>
              <p className={cn("font-bold tracking-tight", sizeConfig.value)}>{value}</p>
              <p className={cn("opacity-70 mt-1 truncate", sizeConfig.label)}>{label}</p>
            </>
          )}
        </div>
        <div className={cn("rounded-xl flex-shrink-0", sizeConfig.icon, colorConfig.iconBg)}>
          {icon}
        </div>
      </div>

      {trend && !loading && (
        <div className="mt-3 flex items-center gap-2">
          <div
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
              sizeConfig.trend,
              "font-medium",
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
          {trend.label && (
            <span className={cn("opacity-50", sizeConfig.trend)}>{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}

interface MiniCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
  hoverable?: boolean;
}

export function MiniCard({
  children,
  className,
  onClick,
  active = false,
  hoverable = true,
}: MiniCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl border transition-all duration-200",
        "bg-[var(--card)] border-[var(--border)]",
        hoverable && onClick && "cursor-pointer hover:border-[var(--primary)]/50 hover:shadow-sm hover:-translate-y-0.5",
        active && "border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

interface QuickStatProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: "default" | "primary" | "success" | "warning" | "danger";
}

const quickStatColors = {
  default: "text-[var(--muted-foreground)]",
  primary: "text-[var(--primary)]",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
};

export function QuickStat({ icon: Icon, label, value, color = "default" }: QuickStatProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--secondary)]/50">
      <div className={cn("p-2 rounded-lg bg-[var(--background)]", quickStatColors[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[var(--muted-foreground)] truncate">{label}</p>
        <p className="text-sm font-semibold text-[var(--foreground)]">{value}</p>
      </div>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  badge?: string | number;
  badgeColor?: "default" | "primary" | "success" | "warning" | "danger";
  disabled?: boolean;
}

const badgeColors = {
  default: "bg-[var(--secondary)] text-[var(--foreground)]",
  primary: "bg-[var(--primary)] text-[var(--primary-foreground)]",
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
  danger: "bg-red-500 text-white",
};

export function ActionCard({
  title,
  description,
  icon,
  onClick,
  badge,
  badgeColor = "default",
  disabled = false,
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]",
        "text-left transition-all duration-200",
        "hover:border-[var(--primary)]/50 hover:shadow-md hover:-translate-y-0.5",
        "active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-[var(--foreground)] text-sm truncate">{title}</h4>
            {badge !== undefined && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                badgeColors[badgeColor]
              )}>
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">{description}</p>
          )}
        </div>
      </div>
    </button>
  );
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  copyable?: boolean;
}

export function InfoRow({ label, value, icon: Icon, copyable }: InfoRowProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!copyable || typeof value !== "string") return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        {Icon && <Icon className="w-4 h-4" />}
        <span>{label}</span>
      </div>
      <div 
        className={cn(
          "text-sm font-medium text-[var(--foreground)]",
          copyable && "cursor-pointer hover:text-[var(--primary)] transition-colors"
        )}
        onClick={handleCopy}
      >
        {copied ? (
          <span className="text-emerald-500">Скопировано!</span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
