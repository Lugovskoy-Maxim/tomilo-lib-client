"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Loader2 } from "lucide-react";
import { useGetProfileQuery, useUpdateProfileMutation } from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  // Только для авторизованных пользователей
  const { data: profileData } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  // Применяем тему из профиля при первой загрузке (только для авторизованных)
  useEffect(() => {
    if (mounted && isAuthenticated && profileData?.data?.displaySettings?.theme) {
      setTheme(profileData.data.displaySettings.theme);
    }
  }, [mounted, isAuthenticated, profileData, setTheme]);

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
    setIsUpdatingTheme(true);
    const validThemes = ["light", "dark", "system"] as const;
    const currentIndex = validThemes.indexOf(theme as "light" | "dark" | "system") || 0;
    const nextIndex = (currentIndex + 1) % validThemes.length;
    const newTheme = validThemes[nextIndex];

    // Применяем тему локально сразу
    setTheme(newTheme);

    // Для авторизованных пользователей сохраняем в профиль и ждём ответа сервера
    if (isAuthenticated) {
      const currentDisplaySettings = profileData?.data?.displaySettings || { isAdult: false };
      await updateProfile({
        displaySettings: {
          ...currentDisplaySettings,
          theme: newTheme,
        },
      }).unwrap();
    } else {
      // Для неавторизованных - небольшая задержка для анимации
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    setIsUpdatingTheme(false);
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
      className={`relative flex items-center justify-center min-h-[40px] min-w-[40px] p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 ${
        isLoadingTheme ? "animate-pulse scale-90" : "hover:bg-[var(--accent)] hover:scale-110 active:scale-95"
      }`}
      aria-label={`Тема: ${currentTheme.label}. Нажмите для смены`}
      title={`Тема: ${currentTheme.label}`}
      disabled={!mounted || isLoadingTheme}
    >
      {/* Показываем спиннер во время загрузки */}
      {isLoadingTheme ? (
        <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 animate-spin" />
      ) : (
        <Icon className="w-4 h-4 xs:w-5 xs:h-5 transition-all" />
      )}
    </button>
  );
}
