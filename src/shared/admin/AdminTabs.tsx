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
  ShoppingBag,
  Search,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
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
  | "ip-management"
  | "shop"
  | "work-queue";

export const ADMIN_TABS: AdminTab[] = [
  "overview",
  "statistics",
  "parser",
  "auto-parsing",
  "titles",
  "chapters",
  "collections",
  "comments",
  "users",
  "reports",
  "ip-management",
  "shop",
  "work-queue",
];

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
    tabs: [
      { id: "ip-management" as AdminTab, label: "IP-управление", icon: Shield },
      { id: "shop" as AdminTab, label: "Магазин", icon: ShoppingBag },
      { id: "work-queue" as AdminTab, label: "Рабочая очередь", icon: ClipboardList },
    ],
  },
];

export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return tabGroups;

    return tabGroups
      .map(group => ({
        ...group,
        tabs: group.tabs.filter(tab => tab.label.toLowerCase().includes(normalizedQuery)),
      }))
      .filter(group => group.tabs.length > 0);
  }, [normalizedQuery]);

  const sidebarContent = (
    <nav className="flex flex-col gap-4 p-3 overflow-y-auto">
      <div className="px-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск раздела..."
            className="w-full rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {filteredGroups.map(group => (
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
      {filteredGroups.length === 0 && (
        <div className="rounded-[var(--admin-radius)] border border-dashed border-[var(--border)] px-3 py-6 text-center">
          <p className="text-sm font-medium text-[var(--foreground)]">Ничего не найдено</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Попробуйте другой запрос</p>
        </div>
      )}
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
