// components/UserDropdown.tsx
"use client";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useTheme } from "next-themes";
import { UserAvatar } from "..";
import { useUpdateProfileMutation } from "@/store/api/authApi";

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
    level?: number;
    experience?: number;
    balance?: number;
    role?: string;
    birthDate?: string;
    displaySettings?: {
      isAdult?: boolean;
      theme?: "light" | "dark" | "system";
    };
  };
}

const THEME_LABELS: Record<string, string> = {
  light: "Светлая",
  dark: "Тёмная",
  system: "Системная",
};

export default function UserDropdown({ isOpen, onClose, onLogout, user }: UserDropdownProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [updateProfile] = useUpdateProfileMutation();
  const [adultEnabled, setAdultEnabled] = useState(user?.displaySettings?.isAdult || false);

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
  const balance = user?.balance ?? 0;

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
      className="absolute top-full right-0 mt-3 w-80 min-w-0 overflow-x-hidden dropdown-modern animate-fade-in-scale z-50"
      onClick={e => e.stopPropagation()}
    >
      {/* Карточка профиля — ссылка на профиль */}
      <Link
        href="/profile"
        onClick={onClose}
        className="flex items-center gap-3 p-3 rounded-t-xl hover:bg-[var(--accent)]/50 transition-colors border-b border-[var(--border)]/50 cursor-pointer"
      >
        <div className="shrink-0" style={{ width: 42, height: 42 }}>
          <UserAvatar
            avatarUrl={user?.avatar}
            username={displayName}
            size={42}
            className="rounded-full border-2 border-[var(--background)] shadow-md"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--foreground)] truncate text-sm">
            {displayName}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {level > 0 && (
              <span className="inline-flex items-center">
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[var(--primary)]/20 text-[var(--primary)]">
                  {level} Ур.
                </span>
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <span className="inline-flex" aria-hidden>
                <CoinIcon className="w-3.5 h-3.5 text-amber-500" />
              </span>
              <span className="font-medium tabular-nums">{balance.toLocaleString("ru-RU")}</span>
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)] shrink-0" />
      </Link>

      {/* Разделитель */}
      <div className="flex gap-1 py-1.5 px-3" role="separator">
        <span className="flex-1 h-px bg-[var(--border)]" />
        <span className="flex-1 h-px bg-[var(--border)]" />
      </div>

      {/* Список пунктов меню */}
      <div className="py-1 min-w-0 overflow-x-hidden">
        <Link
          href="/profile"
          onClick={onClose}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors rounded-lg mx-2 dropdown-item-modern min-w-0 cursor-pointer"
        >
          <Settings className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
          <span className="min-w-0 truncate">Настройки</span>
        </Link>
        <Link
          href="/tomilo-shop"
          onClick={onClose}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors rounded-lg mx-2 dropdown-item-modern min-w-0 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
          <span className="min-w-0 truncate">Магазин украшений</span>
        </Link>
        <Link
          href="/profile?tab=history"
          onClick={onClose}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors rounded-lg mx-2 dropdown-item-modern min-w-0 cursor-pointer"
        >
          <History className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
          <span className="min-w-0 truncate">История</span>
        </Link>
        <Link
          href="/profile?tab=bookmarks"
          onClick={onClose}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors rounded-lg mx-2 dropdown-item-modern min-w-0 cursor-pointer"
        >
          <Bookmark className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
          <span className="min-w-0 truncate">Закладки</span>
        </Link>
        <button
          type="button"
          className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm rounded-lg mx-2 transition-colors cursor-pointer ${
            isAdult
              ? "bg-green-500/10 text-green-600 border border-green-500/30"
              : "text-[var(--foreground)] hover:bg-[var(--accent)] border border-transparent dropdown-item-modern"
          }`}
          onClick={handleToggleAdult}
        >
          <span className="flex items-center gap-3">
            <Eye className="w-4 h-4 shrink-0" />
            <span>18+ контент</span>
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isAdult ? "bg-green-500/20 text-green-600" : "bg-[var(--border)]/50 text-[var(--muted-foreground)]"
            }`}
          >
            {isAdult ? "Вкл" : "Выкл"}
          </span>
        </button>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors rounded-lg mx-2 dropdown-item-modern min-w-0 cursor-pointer"
          onClick={handleThemeClick}
        >
          <Palette className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
          <span className="min-w-0 truncate">Оформление <span className="text-[var(--muted-foreground)]">({themeLabel})</span></span>
        </button>

        {isAdmin && (
          <Link
            href="/admin"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--destructive)] hover:bg-red-500/10 transition-colors rounded-lg mx-2 cursor-pointer"
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>Админ панель</span>
          </Link>
        )}
      </div>

      {/* Разделитель */}
      <div className="flex gap-1 py-1.5 px-3" role="separator">
        <span className="flex-1 h-px bg-[var(--border)]" />
        <span className="flex-1 h-px bg-[var(--border)]" />
      </div>

      {/* Выход */}
      <div className="p-2">
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 font-medium text-sm transition-colors cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.77 0 1.72 1.38 2.66 3.12 2.88l1.7.43v2.08c-1.85-.42-2.34-1.16-2.34-1.99 0-.83.62-1.4 1.93-1.4 1.25 0 1.75.61 1.75 1.53h1.7c0-1.4-.95-2.5-2.65-2.8V9.14z" />
    </svg>
  );
}
