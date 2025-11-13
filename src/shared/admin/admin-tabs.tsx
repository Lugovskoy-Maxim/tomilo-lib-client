import { BarChart3, Download, BookOpen, FileText, Users, FolderOpen } from "lucide-react";

type AdminTab = "overview" | "parser" | "titles" | "chapters" | "collections" | "users";

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const tabs = [
  {
    id: "overview" as AdminTab,
    label: "Обзор",
    icon: BarChart3,
  },
  {
    id: "parser" as AdminTab,
    label: "Парсинг",
    icon: Download,
  },
  {
    id: "titles" as AdminTab,
    label: "Тайтлы",
    icon: BookOpen,
  },
  {
    id: "chapters" as AdminTab,
    label: "Главы",
    icon: FileText,
  },
  {
    id: "collections" as AdminTab,
    label: "Коллекции",
    icon: FolderOpen,
  },
  {
    id: "users" as AdminTab,
    label: "Пользователи",
    icon: Users,
  },
];

export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-1">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
