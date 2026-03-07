"use client";
import NotificationButton from "@/shared/notification-button/NotificationButton";
import UserDropdown from "@/shared/dropdown-menu/DropdownMenu";
import ThemeToggle from "@/shared/theme-toggle/ThemeToggle";
import UserAvatar from "@/shared/user/avatar";
import { useResolvedEquippedDecorations } from "@/hooks/useEquippedFrameUrl";
import { useUserLeaderboardPositions } from "@/hooks/useUserLeaderboardPositions";
import { useState, useRef, useEffect } from "react";
import { LogInIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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

  // Показываем скелетон во время загрузки или до монтирования
  if (isLoading || !isMounted) {
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
              title={hasTop10 && bestPosition ? `Топ ${bestPosition.position} — ${bestPosition.label}` : undefined}
              className={`relative flex items-center justify-center min-h-[40px] min-w-[40px] p-1 rounded-xl bg-[var(--card)] border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 cursor-pointer overflow-visible ${
                hasTop10
                  ? "border-amber-400/60 shadow-[0_0_14px_rgba(245,158,11,0.45),0_0_28px_rgba(251,191,36,0.25)] hover:shadow-[0_0_18px_rgba(245,158,11,0.55),0_0_32px_rgba(251,191,36,0.3)]"
                  : "border-[var(--border)] hover:bg-[var(--accent)]"
              }`}
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
