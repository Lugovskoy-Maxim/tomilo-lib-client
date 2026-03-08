"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ProfileTab, tabMeta, PROFILE_TABS, isValidProfileTab } from "./profileTabConfig";

interface ProfileNavProps {
  /** Вызывается при клике по пункту (например, закрыть мобильное меню) */
  onNavigate?: () => void;
  /** Скрыть указанные вкладки (например, "settings" в админ-просмотре) */
  hideTabs?: ProfileTab[];
}

export function ProfileNav({ onNavigate, hideTabs }: ProfileNavProps) {
  const visibleTabs = hideTabs?.length
    ? PROFILE_TABS.filter(t => !hideTabs.includes(t))
    : PROFILE_TABS;

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const activeTab: ProfileTab = isValidProfileTab(tabFromUrl) ? tabFromUrl : "overview";

  const setActiveTab = (tab: ProfileTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    onNavigate?.();
  };

  return (
    <nav
      className="flex flex-col gap-1 p-2 overflow-y-auto rounded-xl border border-[var(--border)]/80 bg-[var(--card)]/90 backdrop-blur-sm shadow-sm"
      aria-label="Разделы профиля"
    >
      {visibleTabs.map(tabId => {
        const meta = tabMeta[tabId];
        const Icon = meta.icon;
        const isActive = activeTab === tabId;
        return (
          <button
            key={tabId}
            type="button"
            onClick={() => setActiveTab(tabId)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{meta.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
