"use client";
import { useEffect, useRef, useState } from "react";
import { X, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

// Компонент модального окна
const AuthModal = ({
  isOpen,
  onClose,
  onSwitchMode,
  mode = "login",
}: {
  isOpen: boolean;
  onClose: () => void;
  onSwitchMode: (mode: string) => void;
  mode: "login" | "register";
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне модального окна
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden"; // Блокируем скролл
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Закрытие по ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Симуляция запроса
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(mode === "login" ? "Вход" : "Регистрация", {
      email,
      password,
      username,
    });
    setIsLoading(false);
    onClose();
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Вход через ${provider}`);
    // Редирект на OAuth провайдера
    window.location.href = `/api/auth/${provider}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-md mx-4 bg-[var(--background)] rounded-2xl shadow-xl border border-[var(--border)]"
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {mode === "login" ? "Вход в аккаунт" : "Создание аккаунта"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--secondary)] transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium text-[var(--foreground)]"
              >
                Введите ваш никнейм
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="Введите ваше имя"
                  required={mode === "register"}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-[var(--foreground)]"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="email@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-[var(--foreground)]"
            >
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="Введите пароль"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Загрузка..."
              : mode === "login"
              ? "Войти"
              : "Зарегистрироваться"}
          </button>
        </form>

        {/* Разделитель */}
        <div className="px-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative bg-[var(--background)] px-2 text-sm text-[var(--muted-foreground)]">
              или войдите через
            </div>
          </div>
        </div>

        {/* Социальные сети */}
        <div className="p-6 space-y-3">
          {/* TODO: Заменить на круглые иконки */}
          <button
            type="button"
            onClick={() => handleSocialLogin("yandex")}
            className="w-full flex items-center justify-center gap-3 py-3 bg-red-500 text-black rounded-lg font-medium hover:bg-red-500/60 transition-colors"
          >
            Яндекс
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin("vk")}
            className="w-full flex items-center justify-center gap-3 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-500/60 transition-colors"
          >
            ВКонтакте
          </button>
        </div>

        {/* Переключение между входом и регистрацией */}
        <div className="p-6 border-t border-[var(--border)] text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {mode === "login" ? "Ещё нет аккаунта?" : "Уже есть аккаунт?"}{" "}
            <button
              type="button"
              onClick={() =>
                onSwitchMode(mode === "login" ? "register" : "login")
              }
              className="text-[var(--primary)] hover:underline font-medium"
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
