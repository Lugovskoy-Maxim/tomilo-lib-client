"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserProfile } from "@/types/user";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { type ProfileTab, tabMeta, PROFILE_TABS, isValidProfileTab } from "./profileTabConfig";

import ProfileAboutBlock from "@/shared/profile/ProfileAboutBlock";
import ProfileAdditionalInfo from "@/shared/profile/ProfileAdditionalInfo";
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  void isMobileNavOpen;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const tabFromUrl = searchParams.get("tab");

  const visibleTabs = hideTabs?.length
    ? PROFILE_TABS.filter(t => !hideTabs.includes(t))
    : PROFILE_TABS;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    };

    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll, { passive: true });

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 150;
    el.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  };

  const DRAG_THRESHOLD_PX = 15;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > DRAG_THRESHOLD_PX) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    const el = scrollRef.current;
    if (el) {
      el.style.cursor = "grab";
      el.style.userSelect = "";
    }
    isDraggingRef.current = false;
    // Сброс после жеста, чтобы следующий клик по вкладке не блокировался
    if (hasDraggedRef.current) {
      queueMicrotask(() => {
        hasDraggedRef.current = false;
      });
    }
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current) {
      handleMouseUp();
    }
  };
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
    setIsMobileNavOpen(false);
  };

  const sectionTitle = tabMeta[activeTab].label;
  const SectionIcon = tabMeta[activeTab].icon;
  const sectionDescription = tabMeta[activeTab].description;

  return (
    <div className="w-full min-w-0 flex flex-col p-4 sm:p-5">
      {/* Одна строка: вкладки разделов */}
      <nav className="mb-5" aria-label="Разделы профиля">
        <div className="relative">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--secondary)] border border-[var(--border)] hover:bg-[var(--accent)] transition-colors sm:hidden"
              aria-label="Прокрутить влево"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--muted-foreground)]" />
            </button>
          )}
          <div
            ref={scrollRef}
            className="profile-tabs-nav flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide py-1 px-0 cursor-grab select-none min-w-0 -mx-1 sm:cursor-default"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {visibleTabs.map(tabId => {
              const meta = tabMeta[tabId];
              const Icon = meta.icon;
              const isActive = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => {
                    if (!hasDraggedRef.current) setActiveTab(tabId);
                  }}
                  className={`profile-tab-btn flex items-center gap-2 shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] dark:bg-[color-mix(in_oklch,var(--secondary)_60%,transparent)] dark:text-[var(--foreground)] dark:hover:bg-[var(--accent)]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{meta.label}</span>
                </button>
              );
            })}
          </div>
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--secondary)] border border-[var(--border)] hover:bg-[var(--accent)] transition-colors sm:hidden"
              aria-label="Прокрутить вправо"
            >
              <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>
      </nav>

      {/* Заголовок раздела — одна строка */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[color-mix(in_oklch,var(--border)_70%,transparent)] dark:border-[color-mix(in_oklch,var(--border)_90%,transparent)] [&_h2]:text-[var(--foreground)] [&_p]:text-[var(--muted-foreground)] dark:[&_p]:text-[color-mix(in_oklch,var(--muted-foreground)_95%,var(--foreground))]">
        <SectionIcon className="w-5 h-5 text-[var(--primary)] shrink-0" />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold truncate">{sectionTitle}</h2>
          <p className="text-xs truncate">{sectionDescription}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 profile-content-scroll overflow-y-auto overflow-x-hidden">
        {/* О себе */}
        {activeTab === "overview" && (
          <div className="space-y-5 sm:space-y-6 animate-fade-in-up">
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
          <div className="profile-card rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-4 sm:p-5 min-h-[320px] flex flex-col animate-fade-in-up">
            {isBookmarksRestricted ? (
              <div className="flex-1 flex items-center justify-center text-center py-12">
                <div className="max-w-sm">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-[var(--muted-foreground)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <p className="text-[var(--foreground)] font-medium mb-1">Закладки скрыты</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Пользователь ограничил доступ к своим закладкам в настройках приватности.
                  </p>
                </div>
              </div>
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
          <div className="profile-card rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-4 sm:p-5 min-h-[320px] flex flex-col animate-fade-in-up">
            {isHistoryRestricted ? (
              <div className="flex-1 flex items-center justify-center text-center py-12">
                <div className="max-w-sm">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-[var(--muted-foreground)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <p className="text-[var(--foreground)] font-medium mb-1">История чтения скрыта</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Пользователь ограничил доступ к истории чтения в настройках приватности.
                  </p>
                </div>
              </div>
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
          <div className="animate-fade-in-up space-y-4">
            <SettingsNavigation />
            <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 shadow-sm">
              <div id="settings-notifications" className="pb-6 mb-6 border-b border-[var(--border)]/60 last:border-b-0 last:pb-0 last:mb-0">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-4">
                  Уведомления
                </h3>
                <ProfileNotificationsSettings userProfile={userProfile} embedded />
              </div>
              <div id="settings-display" className="pb-6 mb-6 border-b border-[var(--border)]/60 last:border-b-0 last:pb-0 last:mb-0">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-4">
                  Оформление
                </h3>
                <ProfileDisplaySettings userProfile={userProfile} embedded />
              </div>
              <div id="settings-reading" className="pb-6 mb-6 border-b border-[var(--border)]/60 last:border-b-0 last:pb-0 last:mb-0">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-4">
                  Чтение
                </h3>
                <ProfileReadingSettings userProfile={userProfile} embedded />
              </div>
              <div id="settings-premium" className="pb-6 mb-6 border-b border-[var(--border)]/60 last:border-b-0 last:pb-0 last:mb-0">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-4">
                  Премиум
                </h3>
                <ProfilePremiumSettings userProfile={userProfile} embedded />
              </div>
              <div id="settings-privacy" className="pb-6 mb-6 border-b border-[var(--border)]/60 last:border-b-0 last:pb-0 last:mb-0">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-4">
                  Приватность
                </h3>
                <ProfilePrivacySettings userProfile={userProfile} embedded />
              </div>
              <div id="settings-security" className="pb-6 mb-6 border-b border-[var(--border)]/60 last:border-b-0 last:pb-0 last:mb-0">
                <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-4">
                  Безопасность
                </h3>
                <ProfileSecuritySettings userProfile={userProfile} embedded />
              </div>
              {!isPublicView && (
                <div id="settings-delete-account" className="pt-2">
                  <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-4">
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
