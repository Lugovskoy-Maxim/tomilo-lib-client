"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  type ProfileTab,
  tabMeta,
  tabGroups,
  isValidProfileTab,
} from "./profileTabConfig";

interface ProfileNavProps {
  /** Вызывается при клике по пункту (например, закрыть мобильное меню) */
  onNavigate?: () => void;
  /** Показывать ChevronRight у активного пункта (для мобильного выезжающего меню) */
  showActiveChevron?: boolean;
}

export function ProfileNav({ onNavigate, showActiveChevron = false }: ProfileNavProps) {
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
      className="flex flex-col gap-4 p-3 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)]"
      aria-label="Разделы профиля"
    >
      {tabGroups.map(group => (
        <div key={group.label}>
          <div className="flex items-center gap-2 px-3 mb-1.5">
            <group.icon className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              {group.label}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            {group.tabs.map(tabId => {
              const meta = tabMeta[tabId];
              const Icon = meta.icon;
              const isActive = activeTab === tabId;
              return (
                <Link
                  key={tabId}
                  href={`/profile?tab=${tabId}`}
                  onClick={e => {
                    e.preventDefault();
                    setActiveTab(tabId);
                  }}
                  className={`w-full px-3 py-2.5 rounded-[var(--admin-radius)] font-medium transition-all duration-200 flex items-center gap-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] ${
                    isActive
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[var(--primary-foreground)]" : ""}`}
                  />
                  <span className="truncate">{meta.label}</span>
                  {showActiveChevron && isActive && (
                    <ChevronRight className="w-4 h-4 ml-1" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
