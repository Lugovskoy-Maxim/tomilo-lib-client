"use client";

import { User, Image, Layers, Frame } from "lucide-react";

export type ShopTabId = "avatar" | "frame" | "background" | "card";

interface ShopTabsProps {
  activeTab: ShopTabId;
  onTabChange: (tab: ShopTabId) => void;
}

const TABS: { id: ShopTabId; label: string; icon: typeof User; inactive?: boolean; beta?: boolean }[] = [
  { id: "avatar", label: "Аватары", icon: User },
  { id: "frame", label: "Рамки", icon: Frame },
  { id: "background", label: "Фоны", icon: Image },
  { id: "card", label: "Карточки", icon: Layers, inactive: true, beta: true },
];

export function ShopTabs({ activeTab, onTabChange }: ShopTabsProps) {
  return (
    <div
      className="flex w-full sm:w-max sm:inline-flex flex-nowrap rounded-lg bg-[var(--muted)]/60 p-1 gap-1 sm:gap-0.5 max-w-full overflow-x-auto overflow-y-hidden scrollbar-thin"
      role="tablist"
      aria-label="Категории магазина"
    >
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isInactive = tab.inactive;
        if (isInactive) {
          return (
            <span
              key={tab.id}
              role="tab"
              aria-selected={false}
              aria-disabled="true"
              id={`shop-tab-${tab.id}`}
              title={tab.label}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 shrink-0 min-w-0 min-h-[44px] sm:min-h-0 sm:min-w-[88px] sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium text-[var(--muted-foreground)] opacity-60 cursor-not-allowed"
            >
              <Icon className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline truncate">{tab.label}</span>
              {tab.beta && (
                <span className="inline-flex ml-0.5 items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                  бета
                </span>
              )}
            </span>
          );
        }
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={isActive}
            aria-controls="shop-section"
            id={`shop-tab-${tab.id}`}
            title={tab.label}
            className={`
              flex-1 sm:flex-none flex items-center justify-center gap-1.5 shrink-0 min-w-0
              min-h-[44px] sm:min-h-0 sm:min-w-[88px] sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]
              ${
                isActive
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }
            `}
          >
            <Icon className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
