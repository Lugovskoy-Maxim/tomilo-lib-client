"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useGetProfileQuery, useUpdateProfileMutation } from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  // Только для авторизованных пользователей
  const { data: profileData } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [updateProfile] = useUpdateProfileMutation();

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

  const toggleTheme = async () => {
    setIsAnimating(true);
    const validThemes = ["light", "dark", "system"] as const;
    const currentIndex = validThemes.indexOf(theme as "light" | "dark" | "system") || 0;
    const nextIndex = (currentIndex + 1) % validThemes.length;
    const newTheme = validThemes[nextIndex];

    // Небольшая задержка для анимации
    await new Promise(resolve => setTimeout(resolve, 150));

    // Применяем тему
    setTheme(newTheme);

    // Для авторизованных пользователей сохраняем в профиль
    if (isAuthenticated) {
      const currentDisplaySettings = profileData?.data?.displaySettings || { isAdult: false };
      updateProfile({
        displaySettings: {
          ...currentDisplaySettings,
          theme: newTheme,
        },
      });
    }

    setIsAnimating(false);
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
      className={`flex items-center p-2 cursor-pointer hover:bg-[var(--popover)] bg-[var(--secondary)] rounded-full border border-[var(--border)] text-[var(--muted-foreground)] ${
        isAnimating ? "animate-pulse scale-90" : "hover:scale-105 active:scale-95"
      }`}
      aria-label={`Тема: ${currentTheme.label}. Нажмите для смены`}
      title={`Тема: ${currentTheme.label}`}
      disabled={!mounted || isAnimating}
    >
      <Icon className={`w-5 h-5 ${isAnimating ? "animate-spin" : ""}`} />
    </button>
  );
}
