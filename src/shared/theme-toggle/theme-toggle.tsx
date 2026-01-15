"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const themes = [
    { value: "light", icon: Sun, label: "Светлая" },
    { value: "dark", icon: Moon, label: "Тёмная" },
    { value: "system", icon: Monitor, label: "Системная" },
  ];

  const toggleTheme = async () => {
    setIsAnimating(true);
    const currentIndex = themes.findIndex(t => t.value === theme) || 0;
    const nextIndex = (currentIndex + 1) % themes.length;

    // Небольшая задержка для анимации
    await new Promise(resolve => setTimeout(resolve, 150));
    setTheme(themes[nextIndex].value);
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
      className={`flex items-center p-2 cursor-pointer  hover:bg-[var(--popover)] bg-[var(--secondary)] rounded-full border border-[var(--border)] text-[var(--muted-foreground)] ${
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
