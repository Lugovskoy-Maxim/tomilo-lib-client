"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          Что-то пошло не так!
        </h2>
        <p className="text-[var(--muted-foreground)] mb-6">
          Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
