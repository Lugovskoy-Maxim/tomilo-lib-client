"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserProfile } from "@/types/user";
import { Lock } from "lucide-react";

import {
  type ProfileTab,
  tabMeta,
  PROFILE_TABS,
  isValidProfileTab,
  tabGroups,
} from "./profileTabConfig";

import ProfileAboutBlock from "@/shared/profile/ProfileAboutBlock";
import ProfileContent from "@/shared/profile/ProfileContent";
import ProfileStats from "@/shared/profile/ProfileStats";
import ProfileAchievements from "@/shared/profile/ProfileAchievements";
import ProfileProgress from "@/shared/profile/ProfileProgress";

import { default as BookmarksSection } from "@/widgets/profile-bookmarks/ProfileBookmarks";
import { default as ReadingHistorySection } from "@/widgets/profile-reading/ProfileReading";

import ProfileNotificationsSettings from "@/shared/profile/ProfileNotificationsSettings";
import ProfileReadingSettings from "@/shared/profile/ProfileReadingSettings";
import ProfilePrivacySettings from "@/shared/profile/ProfilePrivacySettings";
import ProfileSecuritySettings from "@/shared/profile/ProfileSecuritySettings";
import ProfileDisplaySettings from "@/shared/profile/ProfileDisplaySettings";
import ProfilePremiumSettings from "@/shared/profile/ProfilePremiumSettings";
import ProfileDeleteAccount from "@/shared/profile/ProfileDeleteAccount";
import ProfileInventory from "@/shared/profile/ProfileInventory";
import SettingsNavigation from "@/shared/profile/SettingsNavigation";
import ProfileAdditionalInfo from "@/shared/profile/ProfileAdditionalInfo";

export type { ProfileTab } from "./profileTabConfig";
export { PROFILE_TABS };

export type BreadcrumbItem = { name: string; href?: string; isCurrent?: boolean };

interface ProfileTabsProps {
  userProfile: UserProfile;
  /** Префикс хлебных крошек (текущий раздел добавится последним; для админки: Админка > Пользователи > username) */
  breadcrumbPrefix?: BreadcrumbItem[] | null;
  /** Скрыть вкладки (например, "settings" при просмотре чужого профиля в админке) */
  hideTabs?: ProfileTab[];
  /** Публичный просмотр чужого профиля - скрывает приватные компоненты */
  isPublicView?: boolean;
  /** Закладки скрыты настройками приватности */
  isBookmarksRestricted?: boolean;
  /** История чтения скрыта настройками приватности */
  isHistoryRestricted?: boolean;
}

export function ProfileTabs({
  userProfile,
  breadcrumbPrefix,
  hideTabs,
  isPublicView = false,
  isBookmarksRestricted = false,
  isHistoryRestricted = false,
}: ProfileTabsProps) {
  void breadcrumbPrefix;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  const visibleTabs = hideTabs?.length
    ? PROFILE_TABS.filter(t => !hideTabs.includes(t))
    : PROFILE_TABS;

  let activeTab: ProfileTab = isValidProfileTab(tabFromUrl) ? tabFromUrl : "overview";
  if (hideTabs?.length && hideTabs.includes(activeTab)) {
    activeTab = "overview";
  }

  useEffect(() => {
    if (isValidProfileTab(tabFromUrl)) return;
    const lastTab = localStorage.getItem("profile:lastTab");
    const tab =
      isValidProfileTab(lastTab) && (!hideTabs?.length || !hideTabs.includes(lastTab as ProfileTab))
        ? (lastTab as ProfileTab)
        : "overview";
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, tabFromUrl, hideTabs]);

  useEffect(() => {
    if (hideTabs?.length && tabFromUrl && hideTabs.includes(tabFromUrl as ProfileTab)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "overview");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [pathname, router, searchParams, tabFromUrl, hideTabs]);

  useEffect(() => {
    localStorage.setItem("profile:lastTab", activeTab);
  }, [activeTab]);

  const setActiveTab = (tab: ProfileTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const sectionTitle = tabMeta[activeTab].label;
  const sectionDescription = tabMeta[activeTab].description;

  function RestrictedPanel({ title, body }: { title: string; body: string }) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center py-16 px-4 rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]/5">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)]">
          <Lock className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        </div>
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)] leading-relaxed">{body}</p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 flex flex-col px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pt-4 sm:pb-5 md:px-5">
      <nav
        className="mb-3 border-b border-[var(--border)]/80 -mx-2 px-2 sm:mx-0 sm:px-0 sm:mb-4"
        aria-label="Разделы профиля"
      >
        <p className="sr-only">Прокрутите влево-вправо, чтобы увидеть все разделы</p>
        <div
          className="overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-hide [-webkit-overflow-scrolling:touch] scroll-pl-2 scroll-pr-2 sm:overflow-visible sm:scroll-pr-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex flex-nowrap items-end gap-0 min-w-min -mb-px sm:flex-wrap sm:min-w-0 sm:gap-y-1">
            {tabGroups.map((group, groupIndex) => {
              const tabsInGroup = group.tabs.filter(t => visibleTabs.includes(t));
              if (!tabsInGroup.length) return null;
              return (
                <div
                  key={group.label}
                  className={`flex flex-nowrap items-stretch shrink-0 gap-0.5 ${
                    groupIndex > 0 ? "pl-3 ml-2 border-l border-[var(--border)]/70 sm:pl-4 sm:ml-3" : ""
                  }`}
                >
                  {tabsInGroup.map(tabId => {
                    const meta = tabMeta[tabId];
                    const Icon = meta.icon;
                    const isActive = activeTab === tabId;
                    return (
                      <button
                        key={tabId}
                        type="button"
                        onClick={() => setActiveTab(tabId)}
                        className={`profile-tab-btn flex items-center gap-1.5 shrink-0 min-h-[44px] touch-manipulation px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors active:opacity-80 sm:min-h-[2.5rem] sm:px-3 sm:py-2.5 ${
                          isActive
                            ? "border-[var(--foreground)] text-[var(--foreground)]"
                            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 opacity-80 sm:w-3.5 sm:h-3.5" aria-hidden />
                        <span className="whitespace-nowrap">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <header className="mb-3 pb-3 border-b border-[var(--border)]/60 sm:mb-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--foreground)] sm:text-sm">
          {sectionTitle}
        </h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-relaxed sm:mt-0.5 sm:leading-snug">
          {sectionDescription}
        </p>
      </header>

      <div className="flex-1 min-h-0 profile-content-scroll overflow-y-auto overflow-x-hidden pb-1 sm:pb-0">
        {/* О себе */}
        {activeTab === "overview" && (
          <div className="space-y-4 sm:space-y-5 animate-fade-in-up">
            <ProfileAboutBlock userProfile={userProfile} />
            <ProfileAdditionalInfo userProfile={userProfile} isPublicView={isPublicView} />
            <ProfileContent
              userProfile={userProfile}
              allBookmarksHref={`${pathname}?tab=bookmarks`}
              historyHref={`${pathname}?tab=history`}
              onShowBookmarks={() => setActiveTab("bookmarks")}
              onShowHistory={() => setActiveTab("history")}
              onShowAchievements={() => setActiveTab("achievements")}
              onShowStats={() => setActiveTab("stats")}
              isPublicView={isPublicView}
              compactOverview
              hiddenBookmarksMessage={
                isBookmarksRestricted
                  ? "Пользователь скрыл свои закладки в настройках приватности."
                  : undefined
              }
              hiddenHistoryMessage={
                isHistoryRestricted
                  ? "Пользователь скрыл свою историю чтения в настройках приватности."
                  : undefined
              }
            />
          </div>
        )}

        {/* Статистика */}
        {activeTab === "stats" && (
          <div className="animate-fade-in-up">
            <ProfileStats userProfile={userProfile} showDetailed isPublicView={isPublicView} />
          </div>
        )}

        {/* Достижения */}
        {activeTab === "achievements" && (
          <div className="animate-fade-in-up">
            <ProfileAchievements userProfile={userProfile} isPublicView={isPublicView} />
          </div>
        )}

        {/* Прогресс */}
        {activeTab === "progress" && (
          <div className="animate-fade-in-up">
            <ProfileProgress userProfile={userProfile} />
          </div>
        )}

        {/* Закладки */}
        {activeTab === "bookmarks" && (
          <div className="rounded-lg border border-[var(--border)]/80 bg-[var(--card)] p-3 sm:p-4 min-h-[280px] flex flex-col animate-fade-in-up">
            {isBookmarksRestricted ? (
              <RestrictedPanel
                title="Закладки скрыты"
                body="Пользователь ограничил доступ к закладкам в настройках приватности."
              />
            ) : (
              <BookmarksSection
                bookmarks={userProfile.bookmarks}
                readingHistory={userProfile.readingHistory}
                showAll={true}
                showSectionHeader={false}
              />
            )}
          </div>
        )}

        {/* История */}
        {activeTab === "history" && (
          <div className="rounded-lg border border-[var(--border)]/80 bg-[var(--card)] p-3 sm:p-4 min-h-[280px] flex flex-col animate-fade-in-up">
            {isHistoryRestricted ? (
              <RestrictedPanel
                title="История чтения скрыта"
                body="Пользователь ограничил доступ к истории чтения в настройках приватности."
              />
            ) : (
              <ReadingHistorySection
                readingHistory={userProfile.readingHistory}
                showAll={true}
                showSectionHeader={false}
              />
            )}
          </div>
        )}

        {/* Инвентарь */}
        {activeTab === "inventory" && (
          <div className="animate-fade-in-up">
            <ProfileInventory />
          </div>
        )}

        {/* Настройки — один блок, разделение по темам */}
        {activeTab === "settings" && (
          <div className="animate-fade-in-up lg:grid lg:grid-cols-[minmax(0,11.5rem)_1fr] lg:gap-8 lg:items-start">
            <aside className="mb-4 lg:mb-0 lg:sticky lg:top-2">
              <SettingsNavigation />
            </aside>
            <div className="min-w-0 rounded-lg border border-[var(--border)]/80 bg-[var(--card)] p-3 sm:p-4">
              <div id="settings-notifications" className="pb-5 mb-5 border-b border-[var(--border)]/50 last:border-b-0 last:pb-0 last:mb-0">
                <h3 className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
                  Уведомления
                </h3>
                <ProfileNotificationsSettings userProfile={userProfile} embedded />
              </div>
              <div id="settings-display" className="pb-5 mb-5 border-b border-[var(--border)]/50 last:border-b-0 last:pb-0 last:mb-0">
                <h3 className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
                  Оформление
                </h3>
                <ProfileDisplaySettings userProfile={userProfile} embedded />
              </div>
              <div id="settings-reading" className="pb-5 mb-5 border-b border-[var(--border)]/50 last:border-b-0 last:pb-0 last:mb-0">
                <h3 className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
                  Чтение
                </h3>
                <ProfileReadingSettings userProfile={userProfile} embedded />
              </div>
              <div id="settings-premium" className="pb-5 mb-5 border-b border-[var(--border)]/50 last:border-b-0 last:pb-0 last:mb-0">
                <h3 className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
                  Премиум
                </h3>
                <ProfilePremiumSettings userProfile={userProfile} embedded />
              </div>
              <div id="settings-privacy" className="pb-5 mb-5 border-b border-[var(--border)]/50 last:border-b-0 last:pb-0 last:mb-0">
                <h3 className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
                  Приватность
                </h3>
                <ProfilePrivacySettings userProfile={userProfile} embedded />
              </div>
              <div id="settings-security" className="pb-5 mb-5 border-b border-[var(--border)]/50 last:border-b-0 last:pb-0 last:mb-0">
                <h3 className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
                  Безопасность
                </h3>
                <ProfileSecuritySettings userProfile={userProfile} embedded />
              </div>
              {!isPublicView && (
                <div id="settings-delete-account" className="pt-1">
                  <h3 className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
                    Удаление аккаунта
                  </h3>
                  <ProfileDeleteAccount userProfile={userProfile} embedded />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileTabs;
