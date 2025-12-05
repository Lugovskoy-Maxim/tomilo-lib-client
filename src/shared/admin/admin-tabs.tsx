import { BarChart3, Download, BookOpen, FileText, Users, FolderOpen, Clock } from "lucide-react";

type AdminTab = "overview" | "parser" | "auto-parsing" | "titles" | "chapters" | "collections" | "users";

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
    id: "auto-parsing" as AdminTab,
    label: "Автопарсинг",
    icon: Clock,
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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm ${
                activeTab === tab.id
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
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
