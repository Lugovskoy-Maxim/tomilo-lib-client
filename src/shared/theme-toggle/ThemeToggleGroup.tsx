"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useGetProfileQuery, useUpdateProfileMutation } from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";

interface ThemeToggleGroupProps {
  className?: string;
}

export default function ThemeToggleGroup({ className = "" }: ThemeToggleGroupProps) {
  const [mounted, setMounted] = useState(false);
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const { theme, setTheme } = useTheme();
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

  const themes: { value: "light" | "dark" | "system"; label: string }[] = [
    { value: "light", label: "Светлая" },
    { value: "dark", label: "Тёмная" },
    { value: "system", label: "Системная" },
  ];

  const isLoadingTheme = isUpdatingTheme || (isAuthenticated && isLoading);

  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    if (newTheme === theme || isLoadingTheme) return;
    
    setIsUpdatingTheme(true);

    // Применяем тему локально сразу
    setTheme(newTheme);

    // Для авторизованных пользователей сохраняем в профиль
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

  if (!mounted) {
    return (
      <div className={`grid grid-cols-3 gap-2 ${className}`}>
        {themes.map((t) => (
          <button
            key={t.value}
            disabled
            className="px-3 py-2.5 text-sm font-medium rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed"
          >
            {t.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {isLoadingTheme ? (
        <div className="col-span-3 flex justify-center py-3">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        themes.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleThemeChange(value)}
            disabled={isLoadingTheme}
            className={`px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
              theme === value
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                : "bg-[var(--background)]/60 border border-[var(--border)] hover:bg-[var(--accent)] text-[var(--foreground)]"
            } ${isLoadingTheme ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {label}
          </button>
        ))
      )}
    </div>
  );
}
