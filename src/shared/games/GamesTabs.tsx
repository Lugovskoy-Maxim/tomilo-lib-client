"use client";

import { useMemo } from "react";
import { Package, Users, FlaskConical, CircleDot, ClipboardList, LibraryBig, Compass } from "lucide-react";

export type GamesTabId = "inventory" | "quests" | "disciples" | "expedition" | "cards" | "alchemy" | "wheel";

const TAB_IDS: GamesTabId[] = ["inventory", "quests", "disciples", "expedition", "cards", "alchemy", "wheel"];

interface GamesTabsProps {
  activeTab: GamesTabId;
  onTabChange: (tab: GamesTabId) => void;
  notifications?: Partial<Record<GamesTabId, number | boolean>>;
}

const TABS: { id: GamesTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "inventory", label: "Инвентарь", icon: Package },
  { id: "quests", label: "Квесты", icon: ClipboardList },
  { id: "disciples", label: "Ученики", icon: Users },
  { id: "expedition", label: "Экспедиция", icon: Compass },
  { id: "cards", label: "Карточки", icon: LibraryBig },
  { id: "alchemy", label: "Алхимия", icon: FlaskConical },
  { id: "wheel", label: "Колесо", icon: CircleDot },
];

export function isValidGamesTabId(value: string): value is GamesTabId {
  return TAB_IDS.includes(value as GamesTabId);
}

export function GamesTabs({ activeTab, onTabChange, notifications }: GamesTabsProps) {
  const currentIndex = useMemo(() => TABS.findIndex(tab => tab.id === activeTab), [activeTab]);

  return (
    <div className="games-tabs" role="tablist" aria-label="Разделы игр">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          aria-controls={`games-panel-${id}`}
          id={`games-tab-${id}`}
          onClick={() => onTabChange(id)}
          onKeyDown={(event) => {
            if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
              return;
            }
            event.preventDefault();
            if (event.key === "Home") {
              onTabChange(TABS[0].id);
              return;
            }
            if (event.key === "End") {
              onTabChange(TABS[TABS.length - 1].id);
              return;
            }
            const delta = event.key === "ArrowRight" ? 1 : -1;
            const nextIndex = (currentIndex + delta + TABS.length) % TABS.length;
            onTabChange(TABS[nextIndex]!.id);
          }}
          className={`games-tab ${activeTab === id ? "active" : ""}`}
        >
          <span className="relative inline-flex">
            <Icon className="tab-icon" aria-hidden />
            {notifications?.[id] ? (
              <span className="games-tab-dot" aria-label="Есть уведомление" />
            ) : null}
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}
