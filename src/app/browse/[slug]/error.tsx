"use client"
import { Footer, Header } from "@/widgets";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

// Улучшенный компонент ошибки с отладочной информацией
export default function ErrorState({ error, titleId }: { error: string; titleId?: string }) {
  return (
    <main className="flex flex-col min-h-screen relative">
      {/* Размытый фон */}
      <div className="fixed max-h-screen  inset-0 z-0 bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]"></div>

      {/* Overlay для улучшения читаемости */}
      <div className="fixed  max-h-screen inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/40 z-10"></div>

      {/* Контент */}
      <div className="flex-1 flex flex-col relative z-20">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                {error}
              </h1>
              <p className="text-[var(--muted-foreground)] mb-4">
                ID тайтла: {titleId || "не указан"}
              </p>
              <p className="text-[var(--muted-foreground)] mb-6">
                Проверьте консоль браузера для подробной информации об ошибке
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/admin/titles"
                  className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors"
                >
                  Вернуться к списку тайтлов
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors"
                >
                  Перезагрузить страницу
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </main>
  );
}