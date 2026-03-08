"use client";

import { ERROR_MESSAGES } from "@/constants/errors";
import { Home, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface RateLimitErrorProps {
  remainingSeconds?: number;
  onRetry?: () => void;
  className?: string;
}

export default function RateLimitError({
  remainingSeconds = 60,
  onRetry,
  className = "",
}: RateLimitErrorProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(remainingSeconds);

  useEffect(() => {
    setTimeLeft(remainingSeconds);
  }, [remainingSeconds]);

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
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onRetry]);

  const formatTime = useCallback((seconds: number) => {
    if (seconds <= 0) return "0 сек";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) return `${minutes} мин ${secs} сек`;
    return `${secs} сек`;
  }, []);

  const handleRefresh = () => {
    if (onRetry) onRetry();
    else window.location.reload();
  };

  return (
    <div className={`max-w-md w-full text-center ${className}`}>
      <div className="mb-8 flex justify-center">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--destructive)]/10 text-[var(--destructive)] ring-2 ring-[var(--destructive)]/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          </div>
          <div className="absolute -bottom-2 -right-2 rounded-lg border-2 border-[var(--destructive)] bg-[var(--card)] px-2 py-1 shadow-lg">
            <span className="text-sm font-mono font-bold text-[var(--destructive)]">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      <p className="text-6xl font-bold text-[var(--muted-foreground)]/20 mb-2 tabular-nums">429</p>
      <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-3">
        {ERROR_MESSAGES.RATE_LIMIT.TITLE}
      </h1>
      <p className="text-[var(--muted-foreground)] mb-4 leading-relaxed">
        {ERROR_MESSAGES.RATE_LIMIT.SUBTITLE}
      </p>
      <p className="text-[var(--muted-foreground)] text-sm mb-6">
        {ERROR_MESSAGES.RATE_LIMIT.MESSAGE(timeLeft)}
      </p>

      <div className="w-full max-w-xs mx-auto mb-8">
        <div className="h-2 rounded-full overflow-hidden bg-[var(--secondary)]">
          <div
            className="h-full bg-[var(--destructive)] transition-all duration-1000 ease-linear"
            style={{
              width: `${Math.min(100, (timeLeft / remainingSeconds) * 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={timeLeft > 0}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-colors font-medium min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className="w-5 h-5 shrink-0" />
          {ERROR_MESSAGES.RATE_LIMIT.TRY_AGAIN}
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors font-medium min-w-[180px]"
        >
          <Home className="w-5 h-5 shrink-0" />
          {ERROR_MESSAGES.RATE_LIMIT.GO_HOME}
        </button>
      </div>

      <p className="text-[var(--muted-foreground)] text-xs mt-6 max-w-sm mx-auto">
        {ERROR_MESSAGES.RATE_LIMIT.INFO}
      </p>
    </div>
  );
}
