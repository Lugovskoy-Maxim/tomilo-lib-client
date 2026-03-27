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
  Coins,
} from "lucide-react";
import { useTheme } from "next-themes";
import { UserAvatar } from "..";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import type { EquippedDecorations } from "@/types/user";
import type { LeaderboardCategory } from "@/store/api/leaderboardApi";
import { levelToRank, getLevelProgress, getRankColor } from "@/lib/rank-utils";
import { isPremiumActive } from "@/lib/premium";
import { PremiumBadge } from "@/shared/premium-badge/PremiumBadge";
import { formatUsernameDisplay } from "@/lib/username-display";

interface LeaderboardPosition {
  category: LeaderboardCategory;
  position: number;
  label: string;
}

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
  "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--foreground)] rounded-lg min-w-0 cursor-pointer outline-none m-0 border-0 bg-transparent transition-[background-color,color] duration-150 hover:bg-[var(--accent)] hover:[&_svg]:text-[var(--foreground)] active:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-inset";

export default function UserDropdown({
  isOpen,
  onClose,
  onLogout,
  user,
  frameUrl,
  avatarDecorationUrl,
  leaderboardPositions = [],
}: UserDropdownProps) {
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

  const displayName =
    user?.name || user?.username
      ? formatUsernameDisplay((user.name || user.username) as string)
      : "Пользователь";
  const level = user?.level ?? 0;
  const experience = user?.experience ?? 0;
  const balance = user?.balance ?? 0;

  const rankInfo = levelToRank(level);
  const rankColor = getRankColor(rankInfo.rank);
  const { progressPercent, nextLevelExp } = getLevelProgress(level, experience);
  const expToNext = Math.max(0, nextLevelExp - experience);
  const levelTooltip = `${rankInfo.name}. Опыт: ${experience.toLocaleString("ru-RU")} XP · До ур. ${level + 1}: ${expToNext.toLocaleString("ru-RU")} XP`;

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
      className="absolute top-full right-0 mt-2 w-72 max-w-[calc(100vw-1rem)] min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[0_4px_20px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35),0_0_1px_rgba(255,255,255,0.06)] [transform-origin:var(--dropdown-origin,top_right)] animate-fade-in-scale z-[var(--z-modal)]"
      onClick={e => e.stopPropagation()}
    >
      {/* Карточка профиля */}
      <div className="p-3 border-b border-[var(--border)] bg-[var(--background)]/50">
        <Link
          ref={firstFocusableRef}
          href="/profile"
          onClick={onClose}
          role="menuitem"
          title={levelTooltip}
          className="flex items-center gap-2.5 rounded-lg p-1.5 -m-1.5 transition-colors cursor-pointer hover:bg-[var(--accent)] focus:bg-[var(--accent)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-inset"
        >
          <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center overflow-visible">
            <UserAvatar
              avatarUrl={user?.avatar}
              username={displayName}
              size={36}
              className="rounded-full w-full h-full object-cover"
              frameUrl={frameUrl ?? undefined}
              avatarDecorationUrl={avatarDecorationUrl ?? undefined}
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-[var(--foreground)] truncate text-sm">
                {displayName}
              </h3>
              {isPremiumActive(user?.subscriptionExpiresAt) && (
                <PremiumBadge size="xs" ariaLabel="Премиум" className="shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="shrink-0 inline-flex items-center justify-center min-w-[28px] h-5 rounded-md text-[10px] font-bold tabular-nums bg-[var(--background)]/90 border"
                style={{ borderColor: rankColor, color: rankColor }}
              >
                {level}
              </span>
              <div className="flex-1 min-w-0 h-2 rounded-full bg-[var(--border)]/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${progressPercent}%`, backgroundColor: rankColor }}
                />
              </div>
            </div>
            <p
              className="text-[10px] text-[var(--muted-foreground)] leading-snug flex items-center gap-1 whitespace-nowrap"
              aria-hidden
            >
              <span className="tabular-nums">{experience.toLocaleString("ru-RU")} XP</span>
              <span className="text-[var(--border)]">·</span>
              <span>до {level + 1} ур.:</span>
              <span className="tabular-nums font-medium text-[var(--foreground)]">{expToNext.toLocaleString("ru-RU")} XP</span>
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)] shrink-0" aria-hidden />
        </Link>

        {/* Топы и баланс — одна строка, компактно */}
        <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-2.5 mt-1">
          <div className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto shrink-0">
            {leaderboardPositions.length > 0 ? (
              leaderboardPositions.slice(0, 4).map(({ category, position, label }) => (
                <Link
                  key={category}
                  href={`/leaders?category=${category}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200 hover:bg-amber-500/25 dark:hover:bg-amber-500/25 transition-colors shrink-0"
                  title={label}
                >
                  #{position}
                </Link>
              ))
            ) : (
              <Link
                href="/leaders"
                onClick={onClose}
                className="inline-flex items-center gap-1 text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors shrink-0"
                title="Лидерборд"
              >
                <Trophy className="w-2.5 h-2.5 shrink-0" aria-hidden />
                Топы
              </Link>
            )}
            {leaderboardPositions.length > 4 && (
              <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">+{leaderboardPositions.length - 4}</span>
            )}
          </div>
          <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--foreground)] tabular-nums shrink-0">
            <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden />
            {balance.toLocaleString("ru-RU")}
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
              isAdult
                ? "bg-emerald-500/25 text-emerald-700 dark:text-emerald-300"
                : "bg-[var(--border)]/60 text-[var(--muted-foreground)]"
            }`}
          >
            {isAdult ? "Вкл" : "Выкл"}
          </span>
        </button>
        <button type="button" role="menuitem" className={itemClass} onClick={handleThemeClick}>
          <Palette className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" aria-hidden />
          <span className="min-w-0 truncate">Тема</span>
          <span className="ml-auto text-xs text-[var(--muted-foreground)]">{themeLabel}</span>
        </button>
        {isAdmin && (
          <Link
            href="/admin"
            onClick={onClose}
            role="menuitem"
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--chart-1)] rounded-lg min-w-0 cursor-pointer outline-none transition-[background-color,color] duration-150 hover:bg-[var(--chart-1)]/10 active:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--chart-1)]/50 focus-visible:ring-inset"
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
