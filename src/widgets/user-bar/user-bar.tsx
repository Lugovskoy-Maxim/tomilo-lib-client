"use client";
import {
  NotificationButton,
  UserDropdown,
  ThemeToggle,
  LoginModal,
  RegisterModal,
} from "@/shared";
import { UserAvatar } from "@/shared";
import { useState, useRef, useEffect } from "react";
import { LogInIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthResponse, ApiResponseDto } from "@/types/auth";

interface UserDropdownUser {
  id?: string;
  name?: string;
  email?: string;
  username?: string;
  avatar?: string;
  level?: number;
  experience?: number;
  balance?: number;
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
      avatar: user.avatar, // Добавляем аватар
      level: user.level,
      experience: user.experience,
      balance: user.balance
    };
  };

  // Показываем скелетон во время загрузки или до монтирования
  if (isLoading || !isMounted) {
    return (
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[var(--border)] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {isAuthenticated && <NotificationButton />}

        {!isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoginModalOpen}
              className="flex items-center px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] bg-transparent border border-[var(--border)] rounded-full hover:bg-[var(--popover)] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <LogInIcon className="w-4 h-4 mr-2" />
              Войти
            </button>
          </div>
        ) : (
          <div className="relative flex items-center justify-center" ref={dropdownRef}>
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 rounded-full cursor-pointer focus:outline-none hover:ring-2 hover:ring-[var(--border)] transition-all"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Открыть меню пользователя"
            >
              <UserAvatar
                avatarUrl={user?.avatar}
                username={user?.username}
                size={40}
                className="border-2 border-[var(--background)]"
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