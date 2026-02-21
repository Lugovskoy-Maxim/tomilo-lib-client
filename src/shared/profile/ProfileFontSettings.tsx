"use client";

import { useFont, type SiteFont } from "@/contexts/FontContext";
import { Type } from "lucide-react";

const FONT_OPTIONS: { value: SiteFont; label: string }[] = [
  { value: "exo2", label: "Exo 2" },
  { value: "comfortaa", label: "Comfortaa" },
  { value: "nunito", label: "Nunito" },
  { value: "rubik", label: "Rubik" },
];

export default function ProfileFontSettings() {
  const { font, setFont } = useFont();

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="p-2.5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
          <Type className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">
            Шрифт
          </h2>
          <p className="text-[var(--muted-foreground)] text-xs">
            Выбор шрифта интерфейса (сохраняется в браузере)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FONT_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFont(value)}
            className={`px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
              font === value
                ? "bg-[var(--chart-1)] text-white shadow-md"
                : "bg-[var(--background)]/60 border border-[var(--border)] hover:bg-[var(--accent)] text-[var(--foreground)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
