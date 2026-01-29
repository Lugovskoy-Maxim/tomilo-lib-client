"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import RateLimitError from "@/shared/error-state/RateLimitError";

function RateLimitContent() {
  const searchParams = useSearchParams();
  const [remainingSeconds, setRemainingSeconds] = useState(60);

  // Получаем время из URL параметров или localStorage
  useEffect(() => {
    // Сначала пробуем получить из URL
    const urlSeconds = searchParams.get("seconds");
    if (urlSeconds) {
      const seconds = parseInt(urlSeconds, 10);
      if (!isNaN(seconds) && seconds > 0) {
        setRemainingSeconds(seconds);
        return;
      }
    }

    // Пробуем из localStorage
    const stored = localStorage.getItem("rateLimitRemaining");
    if (stored) {
      const seconds = parseInt(stored, 10);
      if (!isNaN(seconds) && seconds > 0) {
        setRemainingSeconds(seconds);
      }
    }
  }, [searchParams]);

  // Сохраняем время в localStorage для сохранения при обновлении
  useEffect(() => {
    localStorage.setItem("rateLimitRemaining", remainingSeconds.toString());
  }, [remainingSeconds]);

  // Обновляем заголовок страницы
  useEffect(() => {
    document.title = "Слишком много запросов - Tomilo";
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <RateLimitError remainingSeconds={remainingSeconds} />
    </div>
  );
}

export default function RateLimitPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]" />
        </div>
      }
    >
      <RateLimitContent />
    </Suspense>
  );
}
