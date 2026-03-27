"use client";
import NotificationButton from "@/shared/notification-button/NotificationButton";
import UserDropdown from "@/shared/dropdown-menu/DropdownMenu";
import ThemeToggle from "@/shared/theme-toggle/ThemeToggle";
import UserAvatar from "@/shared/user/avatar";
import Link from "next/link";
import { useResolvedEquippedDecorations } from "@/hooks/useEquippedFrameUrl";
import { useUserLeaderboardPositions } from "@/hooks/useUserLeaderboardPositions";
import { useState, useRef, useEffect } from "react";
import { HardDrive, LogInIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isPremiumActive } from "@/lib/premium";

interface UserDropdownUser {
  id?: string;
  name?: string;
  email?: string;
  username?: string;
  avatar?: string;
  equippedDecorations?: import("@/types/user").EquippedDecorations;
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
}

interface UserBarProps {
  onOpenLogin: () => void;
}

export default function UserBar({ onOpenLogin }: UserBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { frameUrl, avatarDecorationUrl } = useResolvedEquippedDecorations();
  const { bestPosition, positions, hasTop10 } = useUserLeaderboardPositions();
  const canOpenOfflineLibrary =
    user?.role === "admin" || isPremiumActive(user?.subscriptionExpiresAt ?? null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Закрытие dropdown при клике вне области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  // Преобразование пользователя для UserDropdown
  const getUserForDropdown = (): UserDropdownUser => {
    if (!user) return {};

    return {
      id: user.id,
      name: user.username,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      equippedDecorations: user.equippedDecorations,
      level: user.level,
      experience: user.experience,
      balance: user.balance,
      role: user.role,
      birthDate: user.birthDate,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      displaySettings: user.displaySettings,
    };
  };

  // Скелетон только пока не знаем статус авторизации (нет user). После логина user уже есть — не скрываем аватар на время загрузки профиля.
  if ((isLoading && !user) || !isMounted) {
    return (
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[var(--secondary)] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />

        {isAuthenticated && canOpenOfflineLibrary && (
          <Link
            href="/offline"
            className="group relative inline-flex items-center justify-center min-w-11 min-h-11 px-2.5 sm:px-3 rounded-xl !overflow-visible bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] transition-all duration-250 hover:border-[var(--primary)] hover:text-[var(--foreground)] hover:shadow-[0_0_20px_-5px_var(--primary)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] max-[480px]:min-w-[34px] max-[480px]:min-h-[34px] max-[480px]:px-2 max-[480px]:rounded-lg"
            title="Офлайн главы"
            aria-label="Открыть офлайн главы"
          >
            <span
              className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)] opacity-0 transition-opacity duration-250 group-hover:opacity-[0.12] -z-0 rounded-xl"
              aria-hidden
            />
            <HardDrive className="w-4 h-4 sm:w-4.5 sm:h-4.5 relative z-[1] group-hover:scale-110 group-hover:-rotate-5 group-hover:text-[var(--primary)] transition-transform duration-300" />
            <span className="hidden sm:inline text-xs font-medium ml-1 relative z-[1]">Офлайн</span>
          </Link>
        )}

        {isAuthenticated && (
          <div className="hidden lg:block">
            <NotificationButton />
          </div>
        )}

        {!isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenLogin}
              className="flex items-center justify-center min-h-[40px] px-2.5 sm:px-4 text-xs sm:text-sm font-medium 
                       bg-[var(--primary)] text-[var(--primary-foreground)] 
                       rounded-lg hover:bg-[var(--primary)]/90 
                       transition-colors"
            >
              <LogInIcon className="w-3.5 h-3.5 mr-1.5 sm:w-4 sm:h-4 sm:mr-2" />
              Войти
            </button>
          </div>
        ) : (
          <div
            className={`relative flex items-center justify-center ${dropdownOpen ? "z-[var(--z-modal)]" : ""}`}
            ref={dropdownRef}
          >
            <button
              type="button"
              title={
                hasTop10 && bestPosition
                  ? `Топ ${bestPosition.position} — ${bestPosition.label}`
                  : undefined
              }
              className={`relative flex items-center justify-center min-h-[40px] min-w-[40px] p-1 rounded-xl bg-[var(--card)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-105 active:scale-95 cursor-pointer overflow-visible`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Открыть меню пользователя"
            >
              <UserAvatar
                avatarUrl={user?.avatar}
                username={user?.username}
                size={36}
                className="rounded-full"
                frameUrl={frameUrl ?? undefined}
                avatarDecorationUrl={avatarDecorationUrl ?? undefined}
              />
            </button>

            <UserDropdown
              isOpen={dropdownOpen}
              onClose={() => setDropdownOpen(false)}
              onLogout={handleLogout}
              user={getUserForDropdown()}
              frameUrl={frameUrl ?? undefined}
              avatarDecorationUrl={avatarDecorationUrl ?? undefined}
              leaderboardPositions={positions}
            />
          </div>
        )}
      </div>
    </>
  );
}
