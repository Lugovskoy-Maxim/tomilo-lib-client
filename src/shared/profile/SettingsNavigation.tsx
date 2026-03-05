"use client";

import { Bell, Monitor, Eye, Lock, Shield, ChevronRight, Crown } from "lucide-react";
import { useState, useEffect } from "react";

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "notifications", label: "Уведомления", icon: Bell, color: "text-blue-500" },
  { id: "display", label: "Отображение", icon: Monitor, color: "text-purple-500" },
  { id: "reading", label: "Чтение", icon: Eye, color: "text-green-500" },
  { id: "premium", label: "Премиум", icon: Crown, color: "text-amber-500" },
  { id: "privacy", label: "Приватность", icon: Lock, color: "text-amber-500" },
  { id: "security", label: "Безопасность", icon: Shield, color: "text-red-500" },
];

interface SettingsNavigationProps {
  activeSection?: string;
  onSectionClick?: (sectionId: string) => void;
}

export default function SettingsNavigation({ activeSection, onSectionClick }: SettingsNavigationProps) {
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4 shadow-sm mb-5">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--border)]/50">
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Быстрый переход
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = currentSection === section.id;
          
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => handleClick(section.id)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30"
                  : "bg-[var(--secondary)]/50 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[var(--primary)]" : section.color}`} />
              <span className="hidden sm:inline">{section.label}</span>
              <span className="sm:hidden">{section.label.slice(0, 4)}.</span>
              {isActive && <ChevronRight className="w-3 h-3 ml-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { SETTINGS_SECTIONS };
export type { SettingsSection };
