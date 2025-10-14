"use client";
import {
  NotificationButton,
  UserAvatar,
  UserDropdown,
  ThemeToggle,
  AuthModal,
} from "@/shared";
import { useState, useRef, useEffect } from "react";
import { LogInIcon } from "lucide-react";

export default function UserBar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<{ name?: string }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleAuthModalOpen = (authMode: "login" | "register") => {
    setAuthMode(authMode);
    setAuthModalOpen(true);
  };

  const handleAuthModalClose = () => {
    setAuthModalOpen(false);
  };

  const handleSwitchAuthMode = () => {
    setAuthMode(authMode === "login" ? "register" : "login");
  };
  // Обработка логина
  // const handleLogin = () => {
  //   setIsAuthenticated(true);
  //   setUser({ name: "User" });
  //   setAuthModalOpen(false);
  // };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser({});
    setDropdownOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Кнопка смены темы */}
        <ThemeToggle />

        {/* Кнопка уведомлений (только для авторизованных пользователей) */}
        {isAuthenticated && <NotificationButton />}

        {/* Кнопки авторизации или аватар */}
        {!isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAuthModalOpen("login")}
              className="flex items-center px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] bg-transparent border border-[var(--border)] rounded-full hover:bg-[var(--popover)] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <LogInIcon className="w-4 h-4 mr-2" />
              Войти
            </button>
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className="w-10 h-10 rounded-full cursor-pointer focus:outline-none hover:ring-2 hover:ring-gray-300 transition-all"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Открыть меню пользователя"
            >
              <UserAvatar />
            </button>

            <UserDropdown
              isOpen={dropdownOpen}
              onClose={() => setDropdownOpen(false)}
              onLogout={handleLogout}
              user={user}
            />
          </div>
        )}
      </div>

      {/* Модальное окно авторизации */}

      <AuthModal
        isOpen={authModalOpen}
        onClose={handleAuthModalClose}
        onSwitchMode={handleSwitchAuthMode}
        mode={authMode}
      />
    </>
  );
}
