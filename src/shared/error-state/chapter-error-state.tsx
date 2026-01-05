"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ChapterErrorStateProps {
  title?: string;
  message?: string;
  slug?: string;
  className?: string;
}

/**
 * Компонент для отображения состояния ошибки на странице главы с навигацией
 */
export default function ChapterErrorState({
  title = "Произошла ошибка",
  message = "Попробуйте обновить страницу",
  slug,
  className = "",
}: ChapterErrorStateProps) {
  const router = useRouter();

  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="text-center max-w-md mx-auto px-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          {title}
        </h1>
        <p className="text-[var(--muted-foreground)] mb-6">
          {message}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {slug && (
            <Link
              href={`/titles/${slug}`}
              className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors text-center"
            >
              Вернуться к тайтлу
            </Link>
          )}
          
          <button
            onClick={() => router.push("/titles")}
            className="px-6 py-3 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors text-center"
          >
            Каталог тайтлов
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[var(--secondary)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--secondary)]/80 transition-colors text-center"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    </div>
  );
}