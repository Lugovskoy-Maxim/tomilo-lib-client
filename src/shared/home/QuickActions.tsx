"use client";

import Link from "next/link";
import { BookOpen, Bookmark, Clock, Bell, Settings, User, TrendingUp, Shuffle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface QuickActionProps {
  href: string;
  icon: React.ElementType;
  label: string;
  description?: string;
  color: string;
  bgColor: string;
}

const QUICK_ACTIONS: QuickActionProps[] = [
  {
    href: "/bookmarks",
    icon: Bookmark,
    label: "Закладки",
    description: "Ваши сохранённые тайтлы",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    href: "/history",
    icon: Clock,
    label: "История",
    description: "Недавно читали",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10 hover:bg-purple-500/20",
  },
  {
    href: "/updates",
    icon: Bell,
    label: "Обновления",
    description: "Новые главы",
    color: "text-green-500",
    bgColor: "bg-green-500/10 hover:bg-green-500/20",
  },
  {
    href: "/top",
    icon: TrendingUp,
    label: "Топ",
    description: "Популярное",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10 hover:bg-orange-500/20",
  },
];

function QuickActionCard({
  href,
  icon: Icon,
  label,
  description,
  color,
  bgColor,
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl ${bgColor} border border-transparent hover:border-current/10 transition-all duration-300 group`}
    >
      <div
        className={`w-10 h-10 rounded-lg bg-[var(--background)]/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
      >
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <div className="font-medium text-sm text-[var(--foreground)]">{label}</div>
        {description && (
          <div className="text-xs text-[var(--muted-foreground)] truncate">{description}</div>
        )}
      </div>
    </Link>
  );
}

export function QuickActions() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-4">
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
                Привет, {user?.username || "читатель"}!
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">Быстрые действия</p>
            </div>
          </div>
          <Link
            href="/profile"
            className="p-2 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {QUICK_ACTIONS.map(action => (
            <QuickActionCard key={action.href} {...action} />
          ))}
        </div>
      </div>
    </section>
  );
}
