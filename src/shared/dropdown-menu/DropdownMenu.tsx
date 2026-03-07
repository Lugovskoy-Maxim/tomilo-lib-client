// components/UserDropdown.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Settings,
  Bookmark,
  History,
  LogOut,
  ChevronRight,
  Shield,
  Eye,
  ShoppingBag,
  Palette,
  Trophy,
  Crown,
  Clock,
  Star,
  MessageSquare,
  Flame,
  BookOpen,
} from "lucide-react";
import { useTheme } from "next-themes";
import { UserAvatar } from "..";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import type { EquippedDecorations } from "@/types/user";
import type { LeaderboardCategory } from "@/store/api/leaderboardApi";
import { levelToRank, getLevelProgress, getRankColor } from "@/lib/rank-utils";
import { isPremiumActive } from "@/lib/premium";
import { PremiumBadge } from "@/shared/premium-badge/PremiumBadge";

interface LeaderboardPosition {
  category: LeaderboardCategory;
  position: number;
  label: string;
}

const CATEGORY_ICONS: Record<LeaderboardCategory, typeof Trophy> = {
  level: Crown,
  readingTime: Clock,
  ratings: Star,
  comments: MessageSquare,
  streak: Flame,
  chaptersRead: BookOpen,
};

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    username?: string;
    avatar?: string;
    equippedDecorations?: EquippedDecorations;
    level?: number;
    experience?: number;
    balance?: number;
    role?: string;
    birthDate?: string;
    subscriptionExpiresAt?: string | null;
    displaySettings?: {
      isAdult?: boolean;
      theme?: "light" | "dark" | "system";
    };
  };
  /** URL надетой рамки аватара */
  frameUrl?: string | null;
  /** URL декорации «аватар» (персонаж) */
  avatarDecorationUrl?: string | null;
  /** Позиции пользователя в топ-10 лидерборда */
  leaderboardPositions?: LeaderboardPosition[];
}

const THEME_LABELS: Record<string, string> = {
  light: "Светлая",
  dark: "Тёмная",
  system: "Системная",
};

const itemClass =
  "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--foreground)] rounded-lg dropdown-item-modern min-w-0 cursor-pointer outline-none m-0 border-0 bg-transparent";

export default function UserDropdown({ isOpen, onClose, onLogout, user, frameUrl, avatarDecorationUrl, leaderboardPositions = [] }: UserDropdownProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [updateProfile] = useUpdateProfileMutation();
  const [adultEnabled, setAdultEnabled] = useState(user?.displaySettings?.isAdult || false);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setContentReady(false);
      return;
    }
    const t = requestAnimationFrame(() => setContentReady(true));
    return () => cancelAnimationFrame(t);
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Фокус на первый элемент при открытии (для навигации с клавиатуры)
  useEffect(() => {
    if (!isOpen || !contentReady) return;
    const t = setTimeout(() => firstFocusableRef.current?.focus({ preventScroll: true }), 0);
    return () => clearTimeout(t);
  }, [isOpen, contentReady]);

  useEffect(() => {
    if (user?.displaySettings?.isAdult !== undefined) {
      setAdultEnabled(user.displaySettings.isAdult);
    }
  }, [user?.displaySettings?.isAdult]);

  if (!isOpen) return null;
  if (!contentReady) return null;

  const isAdmin = user?.role === "admin";
  const isAdult = adultEnabled;

  const displayName = user?.name || user?.username || "Пользователь";
  const level = user?.level ?? 0;
  const experience = user?.experience ?? 0;
  const balance = user?.balance ?? 0;

  const rankInfo = levelToRank(level);
  const rankColor = getRankColor(rankInfo.rank);
  const { progressPercent } = getLevelProgress(level, experience);

  const themeLabel =
    mounted && theme
      ? theme === "system"
        ? `Системная (${resolvedTheme === "dark" ? "Тёмная" : "Светлая"})`
        : THEME_LABELS[theme] || "Системная"
      : "Системная";

  const handleToggleAdult = async () => {
    const newValue = !adultEnabled;
    setAdultEnabled(newValue);
    try {
      await updateProfile({
        displaySettings: {
          isAdult: newValue,
          theme: user?.displaySettings?.theme || "system",
        },
      }).unwrap();
    } catch {
      setAdultEnabled(!newValue);
    }
  };

  const handleThemeClick = async () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    try {
      await updateProfile({
        displaySettings: {
          isAdult: user?.displaySettings?.isAdult ?? false,
          theme: next,
        },
      }).unwrap();
    } catch {
      setTheme(theme || "system");
    }
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <div
      ref={panelRef}
      role="menu"
      aria-label="Меню пользователя"
      className="absolute top-full right-0 mt-2 w-72 max-w-[calc(100vw-1rem)] min-w-0 overflow-x-hidden dropdown-modern animate-fade-in-scale z-layer-modal"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Карточка профиля */}
      <div className="p-3 border-b border-[var(--border)] bg-[var(--background)]/50">
        <Link
          ref={firstFocusableRef}
          href="/profile"
          onClick={onClose}
          role="menuitem"
          className="flex items-center gap-3 transition-colors cursor-pointer rounded-lg p-2 -m-2 hover:bg-[var(--accent)] focus:bg-[var(--accent)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-inset"
        >
          <div className="shrink-0 rounded-full ring-1 ring-[var(--border)] relative" style={{ width: 48, height: 48 }}>
            <UserAvatar
              avatarUrl={user?.avatar}
              username={displayName}
              size={53}
              className="rounded-full w-full h-full"
              frameUrl={frameUrl ?? undefined}
              avatarDecorationUrl={avatarDecorationUrl ?? undefined}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--foreground)] truncate text-base flex items-center gap-1.5">
              {displayName}
              {isPremiumActive(user?.subscriptionExpiresAt) && (
                <PremiumBadge size="xs" ariaLabel="Премиум" />
              )}
            </h3>
            <div className="flex items-center gap-2 min-w-0 mt-0.5" title={rankInfo.name}>
              <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] shrink-0">
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold"
                  style={{ backgroundColor: `${rankColor}25`, color: rankColor }}
                >
                  {level}
                </span>
                ур.
              </span>
              <div className="flex-1 min-w-0 h-1.5 rounded-full bg-[var(--border)]/40 overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{ width: `${progressPercent}%`, backgroundColor: rankColor }}
                />
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)] shrink-0" aria-hidden />
        </Link>

        {/* Сначки топов и баланс */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[var(--border)]/30">
          <div className="flex flex-wrap items-center gap-1 min-w-0">
            {leaderboardPositions.length > 0 ? (
              leaderboardPositions.slice(0, 4).map(({ category, position, label }) => {
                const Icon = CATEGORY_ICONS[category];
                return (
                  <Link
                    key={category}
                    href={`/leaders?category=${category}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
                    title={label}
                  >
                    <Icon className="w-2.5 h-2.5 shrink-0" aria-hidden />
                    #{position}
                  </Link>
                );
              })
            ) : (
              <span className="text-[10px] text-[var(--muted-foreground)]">—</span>
            )}
            {leaderboardPositions.length > 4 && (
              <span className="text-[10px] text-[var(--muted-foreground)]">+{leaderboardPositions.length - 4}</span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] shrink-0">
            <CoinIcon className="w-3.5 h-3.5 text-amber-500" aria-hidden />
            <span className="font-medium tabular-nums">{balance.toLocaleString("ru-RU")}</span>
          </span>
        </div>
      </div>

      <div className="py-1.5 px-2 min-w-0 overflow-x-hidden" role="group" aria-label="Навигация">
        <Link href="/profile?tab=settings" onClick={onClose} role="menuitem" className={itemClass}>
          <Settings className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" aria-hidden />
          <span className="min-w-0 truncate">Настройки</span>
        </Link>
        <Link href="/tomilo-shop" onClick={onClose} role="menuitem" className={itemClass}>
          <ShoppingBag className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" aria-hidden />
          <span className="min-w-0 truncate">Магазин</span>
        </Link>
        <Link href="/history" onClick={onClose} role="menuitem" className={itemClass}>
          <History className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" aria-hidden />
          <span className="min-w-0 truncate">История</span>
        </Link>
        <Link href="/bookmarks" onClick={onClose} role="menuitem" className={itemClass}>
          <Bookmark className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" aria-hidden />
          <span className="min-w-0 truncate">Закладки</span>
        </Link>
        <button
          type="button"
          role="menuitemcheckbox"
          aria-checked={isAdult}
          className={`${itemClass} justify-between ${
            isAdult ? "text-emerald-700 dark:text-emerald-400" : ""
          }`}
          onClick={handleToggleAdult}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <Eye className="w-4 h-4 shrink-0" aria-hidden />
            <span className="truncate">18+</span>
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
              isAdult ? "bg-emerald-500/25 text-emerald-700 dark:text-emerald-300" : "bg-[var(--border)]/60 text-[var(--muted-foreground)]"
            }`}
          >
            {isAdult ? "Вкл" : "Выкл"}
          </span>
        </button>
        <button
          type="button"
          role="menuitem"
          className={itemClass}
          onClick={handleThemeClick}
        >
          <Palette className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" aria-hidden />
          <span className="min-w-0 truncate">Тема</span>
          <span className="ml-auto text-xs text-[var(--muted-foreground)]">{themeLabel}</span>
        </button>
        {isAdmin && (
          <Link
            href="/admin"
            onClick={onClose}
            role="menuitem"
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--chart-1)] hover:bg-[var(--chart-1)]/10 rounded-lg dropdown-item-modern min-w-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--chart-1)]/50"
          >
            <Shield className="w-4 h-4 shrink-0" aria-hidden />
            <span>Админ-панель</span>
          </Link>
        )}
      </div>

      <div className="h-px bg-[var(--border)] my-1 mx-2" aria-hidden />

      <div className="p-1.5">
        <button
          type="button"
          role="menuitem"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer outline-none hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 focus-visible:bg-red-500/10 focus-visible:text-red-600 dark:focus-visible:text-red-400 focus-visible:ring-2 focus-visible:ring-red-500/30"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
}

function CoinIcon({ className, ...props }: { className?: string } & React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.77 0 1.72 1.38 2.66 3.12 2.88l1.7.43v2.08c-1.85-.42-2.34-1.16-2.34-1.99 0-.83.62-1.4 1.93-1.4 1.25 0 1.75.61 1.75 1.53h1.7c0-1.4-.95-2.5-2.65-2.8V9.14z" />
    </svg>
  );
}
