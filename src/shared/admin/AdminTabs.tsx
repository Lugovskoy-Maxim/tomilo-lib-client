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
  Activity,
  LayoutDashboard,
  ShieldCheck,
  Settings,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
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

const tabGroups = [
  {
    label: "Контент",
    icon: LayoutDashboard,
    tabs: [
      { id: "overview" as AdminTab, label: "Обзор", icon: BarChart3 },
      { id: "statistics" as AdminTab, label: "Статистика", icon: Activity },
      { id: "parser" as AdminTab, label: "Парсинг", icon: Download },
      { id: "auto-parsing" as AdminTab, label: "Автопарсинг", icon: Clock },
      { id: "titles" as AdminTab, label: "Тайтлы", icon: BookOpen },
      { id: "chapters" as AdminTab, label: "Главы", icon: FileText },
      { id: "collections" as AdminTab, label: "Коллекции", icon: FolderOpen },
    ],
  },
  {
    label: "Модерация",
    icon: ShieldCheck,
    tabs: [
      { id: "comments" as AdminTab, label: "Комментарии", icon: MessageCircle },
      { id: "users" as AdminTab, label: "Пользователи", icon: Users },
      { id: "reports" as AdminTab, label: "Жалобы", icon: AlertTriangle },
    ],
  },
  {
    label: "Система",
    icon: Settings,
    tabs: [{ id: "ip-management" as AdminTab, label: "IP-управление", icon: Shield }],
  },
];

export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { data: unprocessedReports } = useGetReportsQuery({
    isResolved: "false",
    limit: 1,
  });

  const getReportBadge = (tabId: AdminTab) => {
    if (tabId !== "reports" || !unprocessedReports?.data?.total) return null;
    const count = unprocessedReports.data.total;
    return (
      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  const sidebarContent = (
    <nav className="flex flex-col gap-4 p-3 overflow-y-auto">
      {tabGroups.map(group => (
        <div key={group.label}>
          <div className="flex items-center gap-2 px-3 mb-1.5">
            <group.icon className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              {group.label}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            {group.tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-[var(--admin-radius)] font-medium transition-all duration-200 flex items-center gap-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] ${
                    isActive
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  }`}
                  title={tab.label}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[var(--primary-foreground)]" : ""}`}
                  />
                  <span className="truncate">{tab.label}</span>
                  {getReportBadge(tab.id)}
                  {isActive && <ChevronRight className="w-4 h-4 ml-1 lg:hidden" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile menu toggle - below header */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed z-50 p-2.5 bg-[var(--card)] border border-[var(--border)] rounded-[var(--admin-radius)] shadow-lg transition-all hover:bg-[var(--accent)] admin-sidebar-toggle"
        style={{ top: "calc(var(--header-height) + 12px)", left: 12 }}
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
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar - Fixed on desktop, slide-in on mobile */}
      <aside
        className={`
          fixed lg:sticky top-0 lg:top-auto left-0 z-40 lg:z-auto
          w-72 lg:w-64 h-screen lg:h-[calc(100vh-var(--header-height))]
          bg-[var(--card)] border-r border-[var(--border)]
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col shadow-xl lg:shadow-none
        `}
      >
        {/* Sidebar header - logo/name */}
        <div className="flex-shrink-0 p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-[var(--admin-radius)] bg-[var(--primary)]/10">
              <LayoutDashboard className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">Админ-панель</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Управление контентом</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 min-h-0 flex flex-col">{sidebarContent}</div>

        {/* Sidebar footer */}
        <div className="flex-shrink-0 p-3 border-t border-[var(--border)] space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--admin-radius)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            <ExternalLink className="w-4 h-4" />
            На главную
          </Link>
          <p className="text-xs text-[var(--muted-foreground)] text-center px-2">Admin v1.0</p>
        </div>
      </aside>
    </>
  );
}
