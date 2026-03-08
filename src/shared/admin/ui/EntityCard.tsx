import React, { useState } from "react";
import {
  MoreHorizontal,
  Clock,
  User,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LucideIcon,
} from "lucide-react";

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

interface StatusBadgeProps {
  status: "open" | "resolved" | "pending" | "rejected" | "published" | "draft" | "hidden";
  size?: "sm" | "md";
}

const statusConfig = {
  open: {
    bg: "bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/25",
    label: "Открыта",
  },
  resolved: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/25",
    label: "Решена",
  },
  pending: {
    bg: "bg-blue-500/15",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/25",
    label: "Ожидание",
  },
  rejected: {
    bg: "bg-red-500/15",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/25",
    label: "Отклонена",
  },
  published: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/25",
    label: "Опубликован",
  },
  draft: {
    bg: "bg-slate-500/15",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/25",
    label: "Черновик",
  },
  hidden: {
    bg: "bg-orange-500/15",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/25",
    label: "Скрыт",
  },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium",
        config.bg,
        config.text,
        config.border,
        size === "sm" ? "text-[10px]" : "text-xs",
      )}
    >
      <span
        className={cn(
          "rounded-full",
          config.bg.replace("/15", ""),
          size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
        )}
      />
      {config.label}
    </span>
  );
}

interface TypeBadgeProps {
  type: string;
  color?: "red" | "blue" | "yellow" | "green" | "purple" | "gray";
  size?: "sm" | "md";
}

const typeBadgeColors = {
  red: "bg-red-500 text-white",
  blue: "bg-blue-500 text-white",
  yellow: "bg-amber-500 text-white",
  green: "bg-emerald-500 text-white",
  purple: "bg-violet-500 text-white",
  gray: "bg-slate-500 text-white",
};

export function TypeBadge({ type, color = "gray", size = "sm" }: TypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded-md font-medium",
        typeBadgeColors[color],
        size === "sm" ? "text-[10px]" : "text-xs",
      )}
    >
      {type}
    </span>
  );
}

interface EntityCardProps {
  id: string;
  typeBadge?: {
    label: string;
    color: "red" | "blue" | "yellow" | "green" | "purple" | "gray";
  };
  status?: "open" | "resolved" | "pending" | "rejected" | "published" | "draft" | "hidden";
  author?: string;
  authorAvatar?: string;
  content: string;
  response?: string;
  createdAt: string;
  metadata?: Array<{
    icon?: LucideIcon;
    label: string;
    value: React.ReactNode;
  }>;
  actions?: React.ReactNode;
  expandable?: boolean;
  entityLink?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  replies?: React.ReactNode;
  className?: string;
}

export function EntityCard({
  id,
  typeBadge,
  status,
  author,
  content,
  response,
  createdAt,
  metadata,
  actions,
  expandable = false,
  entityLink,
  replies,
  className,
}: EntityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const shouldTruncate = expandable && content.length > 200;
  const displayContent = shouldTruncate && !isExpanded ? content.slice(0, 200) + "..." : content;

  return (
    <article
      className={cn(
        "group relative rounded-xl border border-[var(--border)] bg-[var(--card)]",
        "overflow-hidden transition-all duration-200",
        "hover:border-[var(--primary)]/30 hover:shadow-md",
        className,
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {typeBadge && <TypeBadge type={typeBadge.label} color={typeBadge.color} />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {author && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
                    <User className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    {author}
                  </span>
                )}
                {status && <StatusBadge status={status} />}
              </div>
              <div
                className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)] transition-colors"
                onClick={handleCopyId}
                title="Копировать ID"
              >
                {copiedId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500">Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 opacity-50" />
                    <span className="truncate max-w-[180px]">{id}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {actions && (
            <div
              className={cn(
                "flex items-center gap-1 transition-opacity duration-200",
                showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              {actions}
            </div>
          )}
        </div>

        <div className="mt-3">
          <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
            {displayContent}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Свернуть
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Показать полностью
                </>
              )}
            </button>
          )}
        </div>

        {response && (
          <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/30 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-1.5">
              Ответ администратора
            </p>
            <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{response}</p>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--muted-foreground)]">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(createdAt).toLocaleString("ru-RU")}
          </span>

          {metadata?.map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-1">
              {item.icon && <item.icon className="w-3.5 h-3.5" />}
              {item.label}: {item.value}
            </span>
          ))}

          {entityLink && (
            <span className="inline-flex items-center">
              {entityLink.href ? (
                <a
                  href={entityLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline"
                >
                  {entityLink.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : entityLink.onClick ? (
                <button
                  onClick={entityLink.onClick}
                  className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline"
                >
                  {entityLink.label}
                  <ExternalLink className="w-3 h-3" />
                </button>
              ) : (
                <span>{entityLink.label}</span>
              )}
            </span>
          )}
        </div>
      </div>

      {replies && (
        <div className="border-t border-[var(--border)] bg-[var(--secondary)]/10 p-4">
          {replies}
        </div>
      )}
    </article>
  );
}

interface ActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  title: string;
  variant?: "default" | "primary" | "danger" | "success";
  disabled?: boolean;
  loading?: boolean;
}

const actionVariants = {
  default: "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]",
  primary: "text-[var(--primary)] hover:bg-[var(--primary)]/10",
  danger: "text-red-500 hover:text-red-700 hover:bg-red-500/10",
  success: "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-500/10",
};

export function ActionButton({
  icon: Icon,
  onClick,
  title,
  variant = "default",
  disabled = false,
  loading = false,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={cn(
        "p-2 rounded-lg transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-95",
        actionVariants[variant],
      )}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
    </button>
  );
}

interface ReplyCardProps {
  author: string;
  content: string;
  createdAt: string;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function ReplyCard({ author, content, createdAt, onDelete, isDeleting }: ReplyCardProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
          <User className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          {author}
        </span>
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            title="Удалить"
          >
            {isDeleting ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-[var(--foreground)] whitespace-pre-wrap">{content}</p>
      <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">
        {new Date(createdAt).toLocaleString("ru-RU")}
      </p>
    </div>
  );
}
