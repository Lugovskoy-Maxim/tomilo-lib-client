"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ERROR_MESSAGES } from "@/constants/errors";

interface RateLimitErrorProps {
  remainingSeconds?: number;
  onRetry?: () => void;
  className?: string;
}

/**
 * Компонент для отображения ошибки rate limit с таймером обратного отсчёта
 */
export default function RateLimitError({
  remainingSeconds = 60,
  onRetry,
  className = "",
}: RateLimitErrorProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(remainingSeconds);

  // Синхронизируем время при изменении пропса
  useEffect(() => {
    setTimeLeft(remainingSeconds);
  }, [remainingSeconds]);

  // Таймер обратного отсчёта
  useEffect(() => {
    if (timeLeft <= 0) {
      if (onRetry) {
        onRetry();
      } else {
        window.location.reload();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onRetry]);

  // Форматирование времени
  const formatTime = useCallback((seconds: number) => {
    if (seconds <= 0) return "0 сек";

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (minutes > 0) {
      return `${minutes} мин ${secs} сек`;
    }
    return `${secs} сек`;
  }, []);

  // Обработчик обновления страницы
  const handleRefresh = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  // Обработчик перехода на главную
  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] px-4 ${className}`}>
      {/* Иконка */}
      <div className="mb-6 relative">
        <div className="w-20 h-20 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center animate-pulse">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10 text-[var(--destructive)]"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        </div>
        {/* Блок с таймером поверх иконки */}
        <div className="absolute -bottom-2 -right-2 bg-[var(--card)] border-2 border-[var(--destructive)] rounded-lg px-2 py-1 shadow-lg">
          <span className="text-sm font-mono font-bold text-[var(--destructive)]">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Заголовок */}
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2 text-center">
        {ERROR_MESSAGES.RATE_LIMIT.TITLE}
      </h1>

      {/* Подзаголовок */}
      <p className="text-lg text-[var(--muted-foreground)] mb-4 text-center">
        {ERROR_MESSAGES.RATE_LIMIT.SUBTITLE}
      </p>

      {/* Таймер */}
      <div className="mb-6 p-4 bg-[var(--secondary)] rounded-lg">
        <p className="text-sm text-[var(--muted-foreground)] mb-1">
          {ERROR_MESSAGES.RATE_LIMIT.DESCRIPTION}
        </p>
        <p className="text-xl font-semibold text-[var(--foreground)]">
          {ERROR_MESSAGES.RATE_LIMIT.MESSAGE(timeLeft)}
        </p>
      </div>

      {/* Прогресс-бар */}
      <div className="w-full max-w-xs mb-6">
        <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--destructive)] transition-all duration-1000 ease-linear"
            style={{
              width: `${Math.min(100, (timeLeft / remainingSeconds) * 100)}%`,
            }}
          />
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-1 text-center">
          {Math.round((timeLeft / remainingSeconds) * 100)}% до возобновления
        </p>
      </div>

      {/* Кнопки */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleRefresh}
          className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" />
            <path d="M3 3v9h9" />
          </svg>
          {ERROR_MESSAGES.RATE_LIMIT.TRY_AGAIN}
        </button>
        <button
          onClick={handleGoHome}
          className="px-6 py-3 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-lg font-medium hover:bg-[var(--secondary)]/80 transition-colors"
        >
          {ERROR_MESSAGES.RATE_LIMIT.GO_HOME}
        </button>
      </div>

      {/* Информация */}
      <div className="max-w-md p-4 bg-[var(--muted)]/50 rounded-lg">
        <p className="text-sm text-[var(--muted-foreground)] text-center">
          {ERROR_MESSAGES.RATE_LIMIT.INFO}
        </p>
      </div>
    </div>
  );
}
