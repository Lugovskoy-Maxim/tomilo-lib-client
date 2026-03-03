"use client";
import NotificationButton from "@/shared/notification-button/NotificationButton";
import UserDropdown from "@/shared/dropdown-menu/DropdownMenu";
import ThemeToggle from "@/shared/theme-toggle/ThemeToggle";
import UserAvatar from "@/shared/user/avatar";
import { useResolvedEquippedDecorations } from "@/hooks/useEquippedFrameUrl";
import { useUserLeaderboardPositions } from "@/hooks/useUserLeaderboardPositions";
import { useState, useRef, useEffect } from "react";
import { LogInIcon, Trophy } from "lucide-react";
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
            className={`relative flex items-center justify-center ${dropdownOpen ? "z-layer-modal" : ""}`}
            ref={dropdownRef}
          >
            <button
              type="button"
              className="relative flex items-center justify-center min-h-[40px] min-w-[40px] p-1 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 cursor-pointer overflow-visible"
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
              {hasTop10 && bestPosition && (
                <span
                  className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm border border-amber-300/50 animate-pulse"
                  title={`Топ ${bestPosition.position} — ${bestPosition.label}`}
                >
                  <Trophy className="w-2.5 h-2.5 mr-0.5" />
                  {bestPosition.position}
                </span>
              )}
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
