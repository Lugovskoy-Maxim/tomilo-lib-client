"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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
        {themes.map((theme) => (
          <button
            key={theme.value}
            disabled
            className="px-3 py-2 text-sm rounded bg-[var(--muted)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed"
          >
            {theme.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {isLoadingTheme ? (
        <div className="col-span-3 flex justify-center py-2">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        themes.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleThemeChange(value)}
            disabled={isLoadingTheme}
            className={`px-3 py-2 text-sm rounded transition-colors ${
              theme === value
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--secondary)] hover:bg-[var(--accent)] text-[var(--foreground)]"
            } ${isLoadingTheme ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {label}
          </button>
        ))
      )}
    </div>
  );
}
