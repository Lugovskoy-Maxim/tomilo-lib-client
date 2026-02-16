"use client";
import { NotificationButton, UserDropdown, ThemeToggle, LoginModal, RegisterModal } from "@/shared";
import { UserAvatar } from "@/shared";
import { useState, useRef, useEffect } from "react";
import { LogInIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

import { ApiResponseDto } from "@/types/api";
import { AuthResponse } from "@/types/auth";

interface UserDropdownUser {
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
}

export default function UserBar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

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

  const handleLoginModalOpen = () => {
    setLoginModalOpen(true);
  };

  const handleLoginModalClose = () => {
    setLoginModalOpen(false);
  };

  const handleRegisterModalClose = () => {
    setRegisterModalOpen(false);
  };

  const handleSwitchToRegister = () => {
    setLoginModalOpen(false);
    setRegisterModalOpen(true);
  };

  const handleSwitchToLogin = () => {
    setRegisterModalOpen(false);
    setLoginModalOpen(true);
  };

  // Обработка успешной авторизации
  const handleAuthSuccess = (authResponse: ApiResponseDto<AuthResponse>) => {
    login(authResponse);
    setLoginModalOpen(false);
    setRegisterModalOpen(false);
  };

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

        {isAuthenticated && <NotificationButton />}

        {!isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoginModalOpen}
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
          <div className="relative flex items-center justify-center" ref={dropdownRef}>
            <button
              type="button"
              className="flex items-center justify-center min-h-[40px] min-w-[40px] p-1 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 cursor-pointer overflow-hidden"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Открыть меню пользователя"
            >
              <UserAvatar
                avatarUrl={user?.avatar}
                username={user?.username}
                size={36}
                className="rounded-full"
              />
            </button>

            <UserDropdown
              isOpen={dropdownOpen}
              onClose={() => setDropdownOpen(false)}
              onLogout={handleLogout}
              user={getUserForDropdown()}
            />
          </div>
        )}
      </div>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={handleLoginModalClose}
        onSwitchToRegister={handleSwitchToRegister}
        onAuthSuccess={handleAuthSuccess}
      />

      <RegisterModal
        isOpen={registerModalOpen}
        onClose={handleRegisterModalClose}
        onSwitchToLogin={handleSwitchToLogin}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}
