"use client";

import { User, Image, Layers, Frame } from "lucide-react";

export type ShopTabId = "avatar" | "frame" | "background" | "card";

interface ShopTabsProps {
  activeTab: ShopTabId;
  onTabChange: (tab: ShopTabId) => void;
}

const TABS: {
  id: ShopTabId;
  label: string;
  shortLabel: string;
  icon: typeof User;
  beta?: boolean;
}[] = [
  { id: "avatar", label: "Аватары", shortLabel: "Аватар", icon: User },
  { id: "frame", label: "Рамки", shortLabel: "Рамка", icon: Frame },
  { id: "background", label: "Фоны", shortLabel: "Фон", icon: Image },
  { id: "card", label: "Карточки", shortLabel: "Карта", icon: Layers, beta: true },
];

export function ShopTabs({ activeTab, onTabChange }: ShopTabsProps) {
  return (
    <div
      className="flex w-full sm:w-max sm:inline-flex flex-nowrap rounded-2xl bg-[var(--muted)]/50 p-1 sm:p-1 gap-1 max-w-full overflow-x-auto overflow-y-hidden scrollbar-thin shadow-inner ring-1 ring-[var(--border)]/60"
      role="tablist"
      aria-label="Категории магазина"
    >
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "true" : undefined}
            aria-controls="shop-section"
            id={`shop-tab-${tab.id}`}
            title={tab.label}
            className={`
              flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 min-w-0
              min-h-[44px] sm:min-h-[40px] sm:min-w-[100px] px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-tight transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]
              ${
                isActive
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-md ring-1 ring-[var(--border)]/80"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)]/40"
              }
            `}
          >
            <Icon
              className={`w-4 h-4 shrink-0 ${isActive ? "text-[var(--primary)]" : ""}`}
              aria-hidden
            />
            <span className="hidden min-[400px]:inline truncate">{tab.label}</span>
            <span className="inline min-[400px]:hidden truncate">{tab.shortLabel}</span>
            {tab.beta && (
              <span
                className={`inline-flex items-center px-1 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border ${
                  isActive
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]/50"
                }`}
              >
                β
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
