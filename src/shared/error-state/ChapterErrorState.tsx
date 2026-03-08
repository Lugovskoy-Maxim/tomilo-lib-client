"use client";

import { AlertTriangle, BookOpen, ChevronLeft, ChevronRight, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footer, Header } from "@/widgets";

interface ChapterErrorStateProps {
  title?: string;
  message?: string;
  slug?: string;
  className?: string;
  prevChapterHref?: string;
  nextChapterHref?: string;
}

export default function ChapterErrorState({
  title = "Произошла ошибка",
  message = "Попробуйте обновить страницу",
  slug,
  className = "",
  prevChapterHref,
  nextChapterHref,
}: ChapterErrorStateProps) {
  const router = useRouter();

  return (
    <div className={`flex min-h-[100dvh] flex-col ${className}`}>
      <Header />
      <main className="flex min-h-0 flex-1 flex-shrink-0 flex-col items-center justify-center bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--secondary)] px-4 py-12 sm:py-16 pb-20">
        <div className="max-w-md w-full text-center">
          <div className="mb-8 flex justify-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--destructive)]/10 text-[var(--destructive)] ring-2 ring-[var(--destructive)]/20"
              aria-hidden
            >
              <AlertTriangle className="h-10 w-10 shrink-0" strokeWidth={2} />
            </div>
          </div>
          <p className="text-6xl font-bold text-[var(--muted-foreground)]/20 mb-2 tabular-nums">
            Ошибка
          </p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-3">{title}</h1>
          <p className="text-[var(--muted-foreground)] mb-10 leading-relaxed">{message}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center flex-wrap">
            {prevChapterHref && (
              <Link
                href={prevChapterHref}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-colors font-medium min-w-[180px]"
              >
                <ChevronLeft className="w-5 h-5 shrink-0" />
                Пред. глава
              </Link>
            )}
            {nextChapterHref && (
              <Link
                href={nextChapterHref}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-colors font-medium min-w-[180px]"
              >
                След. глава
                <ChevronRight className="w-5 h-5 shrink-0" />
              </Link>
            )}
            {slug && (
              <Link
                href={`/titles/${slug}`}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-colors font-medium min-w-[180px]"
              >
                <BookOpen className="w-5 h-5 shrink-0" />
                К тайтлу
              </Link>
            )}
            <button
              type="button"
              onClick={() => router.push("/titles")}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors font-medium min-w-[180px]"
            >
              <Home className="w-5 h-5 shrink-0" />
              Каталог
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors font-medium min-w-[180px]"
            >
              <RefreshCw className="w-5 h-5 shrink-0" />
              Обновить
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
