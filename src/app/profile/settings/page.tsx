"use client";

import { Settings, Bell, Eye, Star } from "lucide-react";
import { ThemeToggle } from "@/shared";
import { useSEO, seoConfigs } from "@/hooks/useSEO";
import { useUpdateProfileMutation, useGetProfileQuery } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";

export default function ProfileSettingsPage() {
  const { data: profileData } = useGetProfileQuery();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const toast = useToast();

  const userProfile = profileData?.data;
  const displaySettings = userProfile?.displaySettings || {
    isAdult: false,
    theme: "system",
  };

  useSEO(
    seoConfigs.static(
      "Настройки - Tomilo-lib.ru",
      "Персональные настройки. Тема, контент 18+, уведомления.",
    ),
  );

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
        !displaySettings.isAdult ? "Контент 18+ включён" : "Контент 18+ выключен",
      );
    } catch (error) {
      console.error("Ошибка при сохранении настроек:", error);
      toast.error("Не удалось сохранить настройки");
    }
  };

  return (
    <div className="w-full animate-fade-in-up">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border)]/60">
          <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Настройки</h2>
            <p className="text-[var(--muted-foreground)] text-sm">
              Тема, контент и уведомления
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-[var(--border)]/60 p-4 bg-[var(--secondary)]/30">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-semibold text-[var(--foreground)]">Внешний вид</h3>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Тема</p>
                <p className="text-xs text-[var(--muted-foreground)]">Светлая или тёмная схема</p>
              </div>
              <ThemeToggle />
            </div>
          </section>

          <section className="rounded-xl border border-[var(--border)]/60 p-4 bg-[var(--secondary)]/30">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-semibold text-[var(--foreground)]">Контент</h3>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Показывать 18+</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Тайтлы с возрастным рейтингом 18+
                </p>
              </div>
              <button
                type="button"
                onClick={handleAdultToggle}
                disabled={isLoading}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
                  displaySettings.isAdult ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    displaySettings.isAdult ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--border)]/60 p-4 bg-[var(--secondary)]/30">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-semibold text-[var(--foreground)]">Уведомления</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">Новые главы</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Уведомления о новых главах</p>
                </div>
                <input type="checkbox" id="new-chapters" className="sr-only peer" />
                <label
                  htmlFor="new-chapters"
                  className="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer items-center rounded-full bg-[var(--muted)] transition-colors peer-checked:bg-[var(--primary)]"
                >
                  <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-6" />
                </label>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">Комментарии</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Ответы на комментарии</p>
                </div>
                <input type="checkbox" id="comments" className="sr-only peer" />
                <label
                  htmlFor="comments"
                  className="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer items-center rounded-full bg-[var(--muted)] transition-colors peer-checked:bg-[var(--primary)]"
                >
                  <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-6" />
                </label>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
