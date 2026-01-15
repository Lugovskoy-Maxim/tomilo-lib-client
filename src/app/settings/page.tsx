"use client";
import { Settings, Palette, Languages, Bell, Eye } from "lucide-react";
import { Footer, Header } from "@/widgets";
import { BackButton, ThemeToggle } from "@/shared";
import { useSEO, seoConfigs } from "@/hooks/useSEO";

export default function SettingsPage() {
  // SEO для страницы настроек
  useSEO(
    seoConfigs.static(
      "Настройки - Tomilo-lib.ru",
      "Персональные настройки сайта. Настройте тему, язык и другие параметры для комфортного чтения манги и маньхуа.",
    ),
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--muted-foreground)] mb-2 flex items-center justify-center gap-3">
              <Settings className="w-8 h-8 text-[var(--primary)]" />
              Настройки
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Персонализируйте свой опыт чтения
            </p>
          </div>

          {/* Настройки */}
          <div className="space-y-2 mb-2">
            {/* Внешний вид */}
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-2">
              <div className="flex items-center gap-3 mb-4">
                <Palette className="w-5 h-5 text-[var(--primary)]" />
                <h2 className="text-lg font-semibold text-[var(--muted-foreground)]">
                  Внешний вид
                </h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-[var(--foreground)]">Тема</span>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Цветовая схема интерфейса
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </div>

            {/* Язык */}
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-2">
              <div className="flex items-center gap-3 mb-4">
                <Languages className="w-5 h-5 text-[var(--primary)]" />
                <h2 className="text-lg font-semibold text-[var(--muted-foreground)]">Язык</h2>
              </div>
              {/*
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[var(--foreground)]">Язык интерфейса</span>
                <p className="text-xs text-[var(--muted-foreground)]">Язык отображения сайта</p>
              </div>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm"
              >
                <Languages className="w-3.5 h-3.5" />
                {language === "ru" ? "Русский" : "English"}
              </button>
            </div>
            */}
            </div>

            {/* Уведомления */}
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-2">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-5 h-5 text-[var(--primary)]" />
                <h2 className="text-lg font-semibold text-[var(--muted-foreground)]">
                  Уведомления
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Новые главы
                    </span>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Уведомления о новых главах
                    </p>
                  </div>
                  <div className="relative inline-block w-10 h-5">
                    <input type="checkbox" id="new-chapters" className="sr-only peer" />
                    <label
                      htmlFor="new-chapters"
                      className="block w-full h-full bg-[var(--muted)] border border-[var(--border)] rounded-full cursor-pointer peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-colors"
                    >
                      <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white border border-[var(--border)] rounded-full transition-transform peer-checked:translate-x-5"></span>
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Комментарии
                    </span>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Уведомления о комментариях
                    </p>
                  </div>
                  <div className="relative inline-block w-10 h-5">
                    <input type="checkbox" id="comments" className="sr-only peer" />
                    <label
                      htmlFor="comments"
                      className="block w-full h-full bg-[var(--muted)] border border-[var(--border)] rounded-full cursor-pointer peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-colors"
                    >
                      <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white border border-[var(--border)] rounded-full transition-transform peer-checked:translate-x-5"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Чтение */}
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-2">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-5 h-5 text-[var(--primary)]" />
                <h2 className="text-lg font-semibold text-[var(--muted-foreground)]">Чтение</h2>
              </div>
            </div>
          </div>

          {/* Кнопка назад */}
          <BackButton />
        </div>
      </main>
      <Footer />
    </div>
  );
}
