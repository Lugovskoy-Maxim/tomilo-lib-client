"use client";

import { Package, Users, FlaskConical, CircleDot } from "lucide-react";

export type GamesTabId = "inventory" | "disciples" | "alchemy" | "wheel";

interface GamesTabsProps {
  activeTab: GamesTabId;
  onTabChange: (tab: GamesTabId) => void;
}

const TABS: { id: GamesTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "inventory", label: "Инвентарь", icon: Package },
  { id: "disciples", label: "Ученики", icon: Users },
  { id: "alchemy", label: "Алхимия", icon: FlaskConical },
  { id: "wheel", label: "Колесо", icon: CircleDot },
];

export function GamesTabs({ activeTab, onTabChange }: GamesTabsProps) {
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
          className={`games-tab ${activeTab === id ? "active" : ""}`}
        >
          <Icon className="tab-icon" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
