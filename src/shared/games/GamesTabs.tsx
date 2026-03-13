"use client";

import { useMemo } from "react";
import { Package, Users, FlaskConical, CircleDot, ClipboardList, LibraryBig, Compass } from "lucide-react";

export type GamesTabId = "inventory" | "quests" | "disciples" | "cards" | "alchemy" | "wheel" | "raids";

interface GamesTabsProps {
  activeTab: GamesTabId;
  onTabChange: (tab: GamesTabId) => void;
}

const TABS: { id: GamesTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "inventory", label: "Инвентарь", icon: Package },
  { id: "quests", label: "Квесты", icon: ClipboardList },
  { id: "disciples", label: "Ученики", icon: Users },
  { id: "cards", label: "Карточки", icon: LibraryBig },
  { id: "alchemy", label: "Алхимия", icon: FlaskConical },
  { id: "wheel", label: "Колесо", icon: CircleDot },
  { id: "raids", label: "Рейды", icon: Compass },
];

export function GamesTabs({ activeTab, onTabChange }: GamesTabsProps) {
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
            onTabChange(TABS[nextIndex].id);
          }}
          className={`games-tab ${activeTab === id ? "active" : ""}`}
        >
          <Icon className="tab-icon" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
