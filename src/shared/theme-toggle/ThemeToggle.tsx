"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Sun, Moon, Monitor, Loader2 } from "lucide-react";
import { useGetProfileQuery, useUpdateProfileMutation } from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const initialThemeSyncedRef = useRef(false);

  // Только для авторизованных пользователей
  const { data: profileData } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  // Применяем тему из профиля только при первой загрузке (один раз за сессию).
  // Не перезаписываем при каждом обновлении profileData, иначе после updateProfile
  // refetch перезаписывает тему и она "прыгает" обратно.
  useEffect(() => {
    if (
      mounted &&
      isAuthenticated &&
      profileData?.data?.displaySettings?.theme &&
      !initialThemeSyncedRef.current
    ) {
      setTheme(profileData.data.displaySettings.theme);
      initialThemeSyncedRef.current = true;
    }
  }, [mounted, isAuthenticated, profileData?.data?.displaySettings?.theme, setTheme]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themes: { value: "light" | "dark" | "system"; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: "Светлая" },
    { value: "dark", icon: Moon, label: "Тёмная" },
    { value: "system", icon: Monitor, label: "Системная" },
  ];

  const isLoadingTheme = isUpdatingTheme || (isAuthenticated && isLoading);

  const toggleTheme = async () => {
    if (!mounted) return;
    setIsUpdatingTheme(true);
    const validThemes = ["light", "dark", "system"] as const;
    const idx = validThemes.indexOf((theme ?? "system") as "light" | "dark" | "system");
    const currentIndex = idx >= 0 ? idx : 0;
    const nextIndex = (currentIndex + 1) % validThemes.length;
    const newTheme = validThemes[nextIndex];

    // Применяем тему локально сразу
    setTheme(newTheme);

    try {
      if (isAuthenticated) {
        const currentDisplaySettings = profileData?.data?.displaySettings || { isAdult: false };
        await updateProfile({
          displaySettings: {
            ...currentDisplaySettings,
            theme: newTheme,
          },
        }).unwrap();
      } else {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    } finally {
      setIsUpdatingTheme(false);
    }
  };

  const getCurrentTheme = () => {
    if (!mounted) return themes[2];

    const current = themes.find(t => t.value === theme) || themes[2];

    if (current.value === "system") {
      return {
        ...current,
        label: `Системная (${resolvedTheme === "dark" ? "Тёмная" : "Светлая"})`,
      };
    }

    return current;
  };

  const currentTheme = getCurrentTheme();
  const Icon = currentTheme.icon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative flex items-center justify-center min-w-10 min-h-10 p-2 rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] cursor-pointer transition-all duration-300 hover:border-[var(--primary)] hover:text-[var(--foreground)] hover:shadow-[0_0_25px_-5px_var(--primary)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${isLoadingTheme ? "opacity-70 pointer-events-none" : ""}`}
      aria-label={`Тема: ${currentTheme.label}. Нажмите для смены`}
      title={`Тема: ${currentTheme.label}`}
      disabled={!mounted || isLoadingTheme}
    >
      <span className={`absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)] pointer-events-none -z-0 transition-opacity duration-300 ${isLoadingTheme ? "opacity-10 animate-pulse" : "opacity-0 group-hover:opacity-[0.15]"}`} aria-hidden />
      {isLoadingTheme ? (
        <Loader2 className="theme-toggle-btn__icon theme-toggle-btn__icon--spin relative z-[1] w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 animate-spin" />
      ) : (
        <Icon className="relative z-[1] w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110 group-hover:text-[var(--primary)]" />
      )}
    </button>
  );
}
