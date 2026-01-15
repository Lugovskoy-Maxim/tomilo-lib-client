"use client";

interface ShopTabsProps {
  activeTab: "avatar" | "background" | "card";
  onTabChange: (tab: "avatar" | "background" | "card") => void;
}

export function ShopTabs({ activeTab, onTabChange }: ShopTabsProps) {
  const tabs = [
    { id: "avatar" as const, label: "Аватары", icon: "👤" },
    { id: "background" as const, label: "Фоны", icon: "🖼️" },
    { id: "card" as const, label: "Карточки", icon: "🃏" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${
              activeTab === tab.id
                ? "bg-[var(--primary)] text-white shadow-lg"
                : "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--primary)]/10"
            }
          `}
        >
          <span className="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
