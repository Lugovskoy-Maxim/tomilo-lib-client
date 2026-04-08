"use client";

import { Bell, Monitor, Eye, Lock, Shield, Crown } from "lucide-react";
import { useState, useEffect } from "react";

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "notifications", label: "Уведомления", icon: Bell },
  { id: "display", label: "Оформление", icon: Monitor },
  { id: "reading", label: "Чтение", icon: Eye },
  { id: "premium", label: "Премиум", icon: Crown },
  { id: "privacy", label: "Приватность", icon: Lock },
  { id: "security", label: "Безопасность", icon: Shield },
];

interface SettingsNavigationProps {
  activeSection?: string;
  onSectionClick?: (sectionId: string) => void;
}

export default function SettingsNavigation({
  activeSection,
  onSectionClick,
}: SettingsNavigationProps) {
  const [currentSection, setCurrentSection] = useState<string>(activeSection || "");

  useEffect(() => {
    if (activeSection) {
      setCurrentSection(activeSection);
    }
  }, [activeSection]);

  const handleClick = (sectionId: string) => {
    setCurrentSection(sectionId);
    onSectionClick?.(sectionId);

    const element = document.getElementById(`settings-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      className="profile-glass-card rounded-xl overflow-hidden"
      aria-label="Быстрый переход по настройкам"
    >
      <div
        className="overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-hide [-webkit-overflow-scrolling:touch] scroll-pl-2 scroll-pr-2 lg:overflow-visible lg:scroll-pr-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <p className="sr-only">Прокрутите влево-вправо, чтобы выбрать раздел настроек</p>
        <div className="min-w-0 p-2 lg:block">
          <p className="hidden px-2 pb-2 text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)] lg:block">
            Разделы
          </p>
          <ul className="flex flex-nowrap gap-1.5 min-w-min snap-x snap-mandatory pb-0.5 lg:snap-none lg:flex-col lg:flex-nowrap lg:min-w-0 lg:gap-1 lg:pb-0">
            {SETTINGS_SECTIONS.map(section => {
              const Icon = section.icon;
              const isActive = currentSection === section.id;

              return (
                <li key={section.id} className="shrink-0 snap-start lg:w-full">
                  <button
                    type="button"
                    onClick={() => handleClick(section.id)}
                    className={`flex min-h-11 w-max max-w-[min(100vw-2rem,280px)] items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors touch-manipulation active:opacity-90 lg:min-h-10 lg:w-full lg:max-w-none ${
                      isActive
                        ? "bg-[var(--foreground)] text-[var(--background)]"
                        : "border border-transparent text-[var(--muted-foreground)] hover:bg-[var(--muted)]/10 hover:text-[var(--foreground)] lg:border-0"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90 lg:h-3.5 lg:w-3.5" aria-hidden />
                    <span className="whitespace-nowrap">{section.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export { SETTINGS_SECTIONS };
export type { SettingsSection };
