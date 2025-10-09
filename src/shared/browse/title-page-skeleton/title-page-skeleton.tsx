import { Footer, Header } from "@/widgets";
import { Loader2 } from "lucide-react";

export default function TitlePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      {/* Центральный лоадер */}
      <div className="fixed inset-0 flex items-center justify-center z-50 ">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-[var(--primary)]" />
          </div>
          <div className="text-center">
            <p className="text-[var(--foreground)] font-semibold text-lg">Загрузка</p>
            <p className="text-[var(--muted-foreground)] text-sm mt-1">Подготавливаем страницу тайтла...</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Левая колонка - скелетон */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Постер */}
              <div className="aspect-[3/4] rounded-2xl bg-[var(--accent)] animate-pulse"></div>

              {/* Кнопки */}
              <div className="flex flex-col gap-2">
                <div className="h-12 bg-[var(--accent)] rounded-lg animate-pulse"></div>
                <div className="h-10 bg-[var(--accent)] rounded-lg animate-pulse"></div>
              </div>

              {/* Инфо блок */}
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-[var(--accent)] rounded-lg animate-pulse"></div>
                  <div className="h-16 bg-[var(--accent)] rounded-lg animate-pulse"></div>
                </div>
              </div>

              {/* Альтернативные названия */}
              <div className="h-32 bg-[var(--accent)] rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Правая колонка - скелетон */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Заголовок и рейтинг */}
              <div className="space-y-4">
                <div className="h-10 bg-[var(--accent)] rounded animate-pulse"></div>
                <div className="flex gap-4">
                  <div className="h-8 w-20 bg-[var(--accent)] rounded-full animate-pulse"></div>
                  <div className="h-8 w-48 bg-[var(--accent)] rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Жанры */}
              <div className="space-y-2">
                <div className="h-5 w-20 bg-[var(--accent)] rounded animate-pulse"></div>
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-20 bg-[var(--accent)] rounded-full animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>

              {/* Табы */}
              <div className="border-b border-[var(--border)]">
                <div className="flex gap-8 pb-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 w-24 bg-[var(--accent)] rounded animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>

              {/* Контент табов */}
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-[var(--accent)] rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
