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
      className={`theme-toggle-btn ${isLoadingTheme ? "theme-toggle-btn--loading" : ""}`}
      aria-label={`Тема: ${currentTheme.label}. Нажмите для смены`}
      title={`Тема: ${currentTheme.label}`}
      disabled={!mounted || isLoadingTheme}
    >
      <span className="theme-toggle-btn__glow" aria-hidden />
      {isLoadingTheme ? (
        <Loader2 className="theme-toggle-btn__icon theme-toggle-btn__icon--spin" />
      ) : (
        <Icon className="theme-toggle-btn__icon" />
      )}
    </button>
  );
}
