"use client";

import { User, Image, Layers, Frame } from "lucide-react";

export type ShopTabId = "avatar" | "frame" | "background" | "card";

interface ShopTabsProps {
  activeTab: ShopTabId;
  onTabChange: (tab: ShopTabId) => void;
}

const TABS: { id: ShopTabId; label: string; icon: typeof User }[] = [
  { id: "avatar", label: "Аватары", icon: User },
  { id: "frame", label: "Рамки", icon: Frame },
  { id: "background", label: "Фоны", icon: Image },
  { id: "card", label: "Карточки", icon: Layers },
];

export function ShopTabs({ activeTab, onTabChange }: ShopTabsProps) {
  return (
    <div
      className="inline-flex rounded-lg bg-[var(--muted)]/60 p-1 gap-0.5"
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
            aria-controls="shop-section"
            id={`shop-tab-${tab.id}`}
            className={`
              flex items-center justify-center gap-1.5 min-w-[72px] sm:min-w-[88px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-sm font-medium transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]
              ${isActive
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm border border-[var(--border)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }
            `}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
