import {
  BarChart3,
  Download,
  BookOpen,
  FileText,
  Users,
  Users2,
  FolderOpen,
  Clock,
  MessageCircle,
  AlertTriangle,
  Shield,
  Menu,
  X,
  ChevronDown,
  Activity,
  LayoutDashboard,
  ShieldCheck,
  Settings,
  ExternalLink,
  ShoppingBag,
  Search,
  ClipboardList,
  Megaphone,
  Tag,
  Trophy,
  Bell,
  ScrollText,
  Wrench,
  Star,
  PanelLeftClose,
  PanelLeft,
  Command,
  Ticket,
  EyeOff,
  Bot,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGetReportsQuery } from "@/store/api/reportsApi";
import { useGetPendingCharactersForModerationQuery } from "@/store/api/charactersApi";

export type AdminTab =
  | "overview"
  | "statistics"
  | "parser"
  | "auto-parsing"
  | "titles"
  | "unpublished-titles"
  | "chapters"
  | "collections"
  | "announcements"
  | "translator-teams"
  | "genres"
  | "achievements"
  | "comments"
  | "users"
  | "bots"
  | "reports"
  | "character-moderation"
  | "notifications"
  | "ip-management"
  | "shop"
  | "promo-codes"
  | "site-settings"
  | "audit-logs"
  | "work-queue";

export const ADMIN_TABS: AdminTab[] = [
  "overview",
  "statistics",
  "parser",
  "auto-parsing",
  "titles",
  "unpublished-titles",
  "chapters",
  "collections",
  "announcements",
  "translator-teams",
  "genres",
  "achievements",
  "comments",
  "users",
  "bots",
  "reports",
  "character-moderation",
  "notifications",
  "ip-management",
  "shop",
  "promo-codes",
  "site-settings",
  "audit-logs",
  "work-queue",
];

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

interface TabItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

interface TabGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tabs: TabItem[];
}

const tabGroups: TabGroup[] = [
  {
    id: "content",
    label: "Контент",
    icon: LayoutDashboard,
    tabs: [
      { id: "overview", label: "Обзор", icon: BarChart3, shortcut: "O" },
      { id: "statistics", label: "Статистика", icon: Activity, shortcut: "S" },
      { id: "parser", label: "Парсинг", icon: Download, shortcut: "P" },
      { id: "auto-parsing", label: "Автопарсинг", icon: Clock },
      { id: "titles", label: "Тайтлы", icon: BookOpen, shortcut: "T" },
      { id: "unpublished-titles", label: "Неопубликованные тайтлы", icon: EyeOff },
      { id: "chapters", label: "Главы", icon: FileText },
      { id: "collections", label: "Коллекции", icon: FolderOpen },
      { id: "announcements", label: "Новости / Объявления", icon: Megaphone },
      { id: "translator-teams", label: "Команды переводчиков", icon: Users2 },
      { id: "genres", label: "Жанры", icon: Tag },
      { id: "achievements", label: "Достижения", icon: Trophy },
    ],
  },
  {
    id: "moderation",
    label: "Модерация",
    icon: ShieldCheck,
    tabs: [
      { id: "comments", label: "Комментарии", icon: MessageCircle },
      { id: "users", label: "Пользователи", icon: Users, shortcut: "U" },
      { id: "bots", label: "Подозрительные / Боты", icon: Bot },
      { id: "reports", label: "Жалобы", icon: AlertTriangle, shortcut: "R" },
      { id: "character-moderation", label: "Персонажи (на модерации)", icon: UserCheck },
      { id: "notifications", label: "Уведомления", icon: Bell },
    ],
  },
  {
    id: "system",
    label: "Система",
    icon: Settings,
    tabs: [
      { id: "ip-management", label: "IP-управление", icon: Shield },
      { id: "shop", label: "Магазин", icon: ShoppingBag },
      { id: "promo-codes", label: "Промокоды", icon: Ticket },
      { id: "site-settings", label: "Настройки сайта", icon: Wrench },
      { id: "audit-logs", label: "Аудит-логи", icon: ScrollText },
      { id: "work-queue", label: "Рабочая очередь", icon: ClipboardList },
    ],
  },
];

const STORAGE_KEYS = {
  COLLAPSED_GROUPS: "admin:collapsedGroups",
  PINNED_TABS: "admin:pinnedTabs",
  SIDEBAR_COLLAPSED: "admin:sidebarCollapsed",
};

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-[var(--primary)]/30 text-[var(--foreground)] rounded px-0.5">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}

export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COLLAPSED_GROUPS);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [pinnedTabs, setPinnedTabs] = useState<Set<AdminTab>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PINNED_TABS);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === "true";
    } catch {
      return false;
    }
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const { data: unprocessedReports } = useGetReportsQuery({
    isResolved: "false",
    limit: 1,
  });
  const { data: pendingCharactersData } = useGetPendingCharactersForModerationQuery(undefined, {
    skip: typeof window === "undefined",
  });
  const pendingCharactersCount = pendingCharactersData?.total ?? 0;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLLAPSED_GROUPS, JSON.stringify([...collapsedGroups]));
  }, [collapsedGroups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PINNED_TABS, JSON.stringify([...pinnedTabs]));
  }, [pinnedTabs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsCollapsed(false);
      }

      if (e.key === "Escape" && isSearchFocused) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        const shortcutMap: Record<string, AdminTab> = {
          o: "overview",
          s: "statistics",
          p: "parser",
          t: "titles",
          u: "users",
          r: "reports",
        };
        const tab = shortcutMap[e.key.toLowerCase()];
        if (tab) {
          e.preventDefault();
          onTabChange(tab);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchFocused, onTabChange]);

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const togglePin = useCallback((tabId: AdminTab, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedTabs(prev => {
      const next = new Set(prev);
      if (next.has(tabId)) {
        next.delete(tabId);
      } else {
        next.add(tabId);
      }
      return next;
    });
  }, []);

  const getReportBadge = (tabId: AdminTab) => {
    if (tabId !== "reports" || !unprocessedReports?.data?.total) return null;
    const count = unprocessedReports.data.total;
    return (
      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  const getCharacterModerationBadge = (tabId: AdminTab) => {
    if (tabId !== "character-moderation" || !pendingCharactersCount) return null;
    return (
      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-medium text-white">
        {pendingCharactersCount > 99 ? "99+" : pendingCharactersCount}
      </span>
    );
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const { filteredGroups, pinnedTabItems } = useMemo(() => {
    const allTabs = tabGroups.flatMap(g => g.tabs);
    const pinned = allTabs.filter(tab => pinnedTabs.has(tab.id));

    if (!normalizedQuery) {
      return { filteredGroups: tabGroups, pinnedTabItems: pinned };
    }

    const filtered = tabGroups
      .map(group => ({
        ...group,
        tabs: group.tabs.filter(tab => tab.label.toLowerCase().includes(normalizedQuery)),
      }))
      .filter(group => group.tabs.length > 0);

    return { filteredGroups: filtered, pinnedTabItems: [] };
  }, [normalizedQuery, pinnedTabs]);

  const renderTabButton = (tab: TabItem, showPinButton = true) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    const isPinned = pinnedTabs.has(tab.id);

    return (
      <button
        key={tab.id}
        onClick={() => {
          onTabChange(tab.id);
          setIsMobileOpen(false);
        }}
        className={`
          group w-full rounded-lg font-medium transition-all duration-200 
          flex items-center text-sm
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]
          ${isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"}
          ${
            isActive
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md shadow-[var(--primary)]/20"
              : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          }
        `}
        title={isCollapsed ? tab.label : undefined}
      >
        <Icon
          className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[var(--primary-foreground)]" : ""}`}
        />
        {!isCollapsed && (
          <>
            <span className="truncate flex-1 text-left">
              {highlightMatch(tab.label, normalizedQuery)}
            </span>
            {tab.shortcut && !isActive && (
              <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-[var(--border)] bg-[var(--background)]/50 px-1.5 text-[10px] font-mono text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity">
                <Command className="w-2.5 h-2.5" />⇧{tab.shortcut}
              </kbd>
            )}
            {getReportBadge(tab.id)}
            {getCharacterModerationBadge(tab.id)}
            {showPinButton && (
              <span
                role="button"
                tabIndex={0}
                onClick={e => togglePin(tab.id, e)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    togglePin(tab.id, e as unknown as React.MouseEvent);
                  }
                }}
                className={`
                  p-1 rounded transition-all cursor-pointer
                  ${isPinned ? "text-amber-500" : "opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}
                `}
                title={isPinned ? "Открепить" : "Закрепить"}
              >
                <Star className={`w-3.5 h-3.5 ${isPinned ? "fill-current" : ""}`} />
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <nav
      ref={navRef}
      className="flex flex-col gap-2 p-3 h-full overflow-y-auto admin-sidebar-scroll"
    >
      {!isCollapsed && (
        <div className="px-1 mb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Поиск..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-12 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--accent)] px-1.5 text-[10px] font-mono text-[var(--muted-foreground)]">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </div>
        </div>
      )}

      {pinnedTabItems.length > 0 && !isCollapsed && (
        <div className="mb-2">
          <div className="flex items-center gap-2 px-2 mb-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Закрепленные
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            {pinnedTabItems.map(tab => renderTabButton(tab, false))}
          </div>
          <div className="my-3 border-t border-[var(--border)]" />
        </div>
      )}

      {filteredGroups.map(group => {
        const GroupIcon = group.icon;
        const isGroupCollapsed = collapsedGroups.has(group.id);
        const hasActiveTab = group.tabs.some(tab => tab.id === activeTab);

        return (
          <div key={group.id} className="mb-1">
            {!isCollapsed ? (
              <button
                onClick={() => toggleGroup(group.id)}
                className={`
                  w-full flex items-center gap-2 px-2 py-1.5 rounded-md
                  text-xs font-semibold uppercase tracking-wider
                  transition-colors hover:bg-[var(--accent)]/50
                  ${hasActiveTab && isGroupCollapsed ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}
                `}
              >
                <GroupIcon className="w-4 h-4" />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isGroupCollapsed ? "-rotate-90" : ""}`}
                />
                {hasActiveTab && isGroupCollapsed && (
                  <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                )}
              </button>
            ) : (
              <div className="flex justify-center py-2" title={group.label}>
                <GroupIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
              </div>
            )}
            <div
              className={`
                flex flex-col gap-0.5 overflow-hidden transition-all duration-200
                ${!isCollapsed && isGroupCollapsed ? "max-h-0 opacity-0" : "max-h-[1000px] opacity-100 mt-1"}
              `}
            >
              {group.tabs.map(tab => renderTabButton(tab))}
            </div>
          </div>
        );
      })}

      {filteredGroups.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--border)] px-3 py-6 text-center">
          <Search className="w-8 h-8 mx-auto mb-2 text-[var(--muted-foreground)]/50" />
          <p className="text-sm font-medium text-[var(--foreground)]">Ничего не найдено</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Попробуйте другой запрос</p>
        </div>
      )}
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed z-50 p-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg transition-all hover:bg-[var(--accent)] hover:shadow-xl admin-sidebar-toggle"
        style={{ top: "calc(var(--header-height) + 12px)", left: 12 }}
        aria-label={isMobileOpen ? "Закрыть меню" : "Открыть меню"}
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-[var(--foreground)]" />
        ) : (
          <Menu className="w-5 h-5 text-[var(--foreground)]" />
        )}
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed lg:relative top-0 left-0 z-40 lg:z-auto
          ${isCollapsed ? "w-[68px]" : "w-72 lg:w-64"}
          h-screen lg:h-full
          bg-[var(--card)] border-r border-[var(--border)]
          transform transition-all duration-300 ease-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col flex-shrink-0 shadow-2xl lg:shadow-none
        `}
      >
        <div className="flex-shrink-0 p-3 border-b border-[var(--border)]">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
            {!isCollapsed && (
              <>
                <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5">
                  <LayoutDashboard className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-[var(--foreground)] truncate">Админ-панель</h2>
                  <p className="text-xs text-[var(--muted-foreground)]">Управление</p>
                </div>
              </>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
              title={isCollapsed ? "Развернуть" : "Свернуть"}
            >
              {isCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">{sidebarContent}</div>

        <div
          className={`flex-shrink-0 p-3 border-t border-[var(--border)] ${isCollapsed ? "px-2" : ""}`}
        >
          <Link
            href="/"
            className={`
              flex items-center rounded-lg text-sm font-medium 
              text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] 
              transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]
              ${isCollapsed ? "justify-center p-2.5" : "gap-2 px-3 py-2"}
            `}
            title={isCollapsed ? "На главную" : undefined}
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>На главную</span>}
          </Link>
          {!isCollapsed && (
            <div className="mt-3 flex items-center justify-between px-2">
              <p className="text-xs text-[var(--muted-foreground)]">Admin v1.0</p>
              <div className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                <Command className="w-3 h-3" />
                <span>K для поиска</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
