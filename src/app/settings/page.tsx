"use client";
import { Settings, Bell, Eye, Star } from "lucide-react";
import { Footer, Header } from "@/widgets";
import { BackButton, ThemeToggle } from "@/shared";
import { useSEO, seoConfigs } from "@/hooks/useSEO";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";
import { useGetProfileQuery } from "@/store/api/authApi";

export default function SettingsPage() {
  const { data: profileData } = useGetProfileQuery();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const toast = useToast();

  const userProfile = profileData?.data;
  const displaySettings = userProfile?.displaySettings || {
    isAdult: false,
    theme: "system",
  };

  const handleAdultToggle = async () => {
    if (isLoading) return;
    try {
      await updateProfile({
        displaySettings: {
          ...displaySettings,
          isAdult: !displaySettings.isAdult,
        },
      }).unwrap();
      toast.success(
        !displaySettings.isAdult ? "Контент для взрослых включен" : "Контент для взрослых выключен",
      );
    } catch (error) {
      console.error("Ошибка при сохранении настроек:", error);
      toast.error("Не удалось сохранить настройки");
    }
  };

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
                <Star className="w-5 h-5 text-[var(--primary)]" />
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

            {/* Контент */}
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-2">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-5 h-5 text-[var(--primary)]" />
                <h2 className="text-lg font-semibold text-[var(--muted-foreground)]">Контент</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-[var(--foreground)]">18+ контент</span>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Показывать тайтлы с возрастным рейтингом 18+
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAdultToggle}
                  disabled={isLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    displaySettings.isAdult ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      displaySettings.isAdult ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
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
          </div>

          {/* Кнопка назад */}
          <BackButton />
        </div>
      </main>
      <Footer />
    </div>
  );
}
