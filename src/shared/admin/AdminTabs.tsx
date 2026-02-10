import {
  BarChart3,
  Download,
  BookOpen,
  FileText,
  Users,
  FolderOpen,
  Clock,
  MessageCircle,
  AlertTriangle,
  Shield,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { useGetReportsQuery } from "@/store/api/reportsApi";

export type AdminTab =
  | "overview"
  | "statistics"
  | "parser"
  | "auto-parsing"
  | "titles"
  | "chapters"
  | "collections"
  | "comments"
  | "users"
  | "reports"
  | "ip-management";

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
    id: "statistics" as AdminTab,
    label: "Статистика",
    icon: Activity,
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
    id: "comments" as AdminTab,
    label: "Комментарии",
    icon: MessageCircle,
  },
  {
    id: "users" as AdminTab,
    label: "Пользователи",
    icon: Users,
  },
  {
    id: "reports" as AdminTab,
    label: "Жалобы",
    icon: AlertTriangle,
  },
  {
    id: "ip-management" as AdminTab,
    label: "IP",
    icon: Shield,
  },
];

export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { data: unprocessedReports } = useGetReportsQuery({
    isResolved: "false",
    limit: 1,
  });

  const sidebarContent = (
    <nav className="flex flex-col gap-1 p-2">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const label =
          tab.id === "reports" && unprocessedReports?.data?.total
            ? `${tab.label} (${unprocessedReports.data.total})`
            : tab.label;

        return (
          <button
            key={tab.id}
            onClick={() => {
              onTabChange(tab.id);
              setIsMobileOpen(false);
            }}
            className={`w-full px-3 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 text-sm ${
              isActive
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            }`}
            title={label}
          >
            <Icon
              className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[var(--primary-foreground)]" : ""}`}
            />
            <span className="truncate">{label}</span>
            {isActive && <ChevronRight className="w-4 h-4 ml-auto lg:hidden" />}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile menu toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg"
        aria-label={isMobileOpen ? "Закрыть меню" : "Открыть меню"}
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-[var(--foreground)]" />
        ) : (
          <Menu className="w-5 h-5 text-[var(--foreground)]" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on desktop, slide-in on mobile */}
      <aside
        className={`
          fixed lg:sticky top-0 lg:top-auto left-0 z-40 lg:z-auto
          w-64 lg:w-64 h-screen lg:h-[calc(100vh-var(--header-height))]
          bg-[var(--card)] border-r border-[var(--border)]
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col
        `}
      >
        {/* Sidebar header - visible on mobile only */}
        <div className="lg:hidden p-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--foreground)]">Навигация</h2>
        </div>

        {/* Navigation */}
        {sidebarContent}

        {/* Sidebar footer */}
        <div className="mt-auto p-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--muted-foreground)] text-center">Admin Panel v1.0</p>
        </div>
      </aside>
    </>
  );
}
