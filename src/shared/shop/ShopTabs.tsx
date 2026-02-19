"use client";

import { User, Image, Layers } from "lucide-react";

interface ShopTabsProps {
  activeTab: "avatar" | "background" | "card";
  onTabChange: (tab: "avatar" | "background" | "card") => void;
}

const TABS = [
  { id: "avatar" as const, label: "Аватары", icon: User },
  { id: "background" as const, label: "Фоны", icon: Image },
  { id: "card" as const, label: "Карточки", icon: Layers },
] as const;

export function ShopTabs({ activeTab, onTabChange }: ShopTabsProps) {
  const activeIndex = TABS.findIndex(t => t.id === activeTab);

  return (
    <div className="relative inline-flex p-1 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] shadow-inner">
      {/* Sliding background */}
      <div
        className="absolute top-1 bottom-1 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-sm transition-all duration-300 ease-out"
        style={{
          left: `calc(${activeIndex * 100}% / 3 + 4px)`,
          width: `calc(100% / 3 - 8px)`,
        }}
        aria-hidden
      />
      <div className="relative flex gap-0.5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center justify-center gap-2 min-w-[100px] sm:min-w-[120px] px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-colors duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]
                ${isActive ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}
              `}
              aria-selected={isActive}
              aria-controls="shop-section"
              id={`shop-tab-${tab.id}`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
