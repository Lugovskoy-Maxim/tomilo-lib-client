"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserProfile } from "@/types/user";
import { Menu, Repeat, X } from "lucide-react";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";

import {
  type ProfileTab,
  tabMeta,
  PROFILE_TABS,
  isValidProfileTab,
} from "./profileTabConfig";
import { ProfileNav } from "./ProfileNav";

// Компоненты обзора
import ProfileAdditionalInfo from "@/shared/profile/ProfileAdditionalInfo";
import ProfileContent from "@/shared/profile/ProfileContent";

// Компоненты закладок и истории
import { default as BookmarksSection } from "@/widgets/profile-bookmarks/ProfileBookmarks";
import { default as ReadingHistorySection } from "@/widgets/profile-reading/ProfileReading";

// Компоненты настроек
import ProfileNotificationsSettings from "@/shared/profile/ProfileNotificationsSettings";
import ProfileReadingSettings from "@/shared/profile/ProfileReadingSettings";
import ProfilePrivacySettings from "@/shared/profile/ProfilePrivacySettings";
import ProfileSecuritySettings from "@/shared/profile/ProfileSecuritySettings";
import ProfileDisplaySettings from "@/shared/profile/ProfileDisplaySettings";
import ProfileInventory from "@/shared/profile/ProfileInventory";

export type { ProfileTab } from "./profileTabConfig";
export { PROFILE_TABS };

export type BreadcrumbItem = { name: string; href?: string; isCurrent?: boolean };

interface ProfileTabsProps {
  userProfile: UserProfile;
  /** Префикс хлебных крошек (текущий раздел добавится последним; для админки: Админка > Пользователи > username) */
  breadcrumbPrefix?: BreadcrumbItem[] | null;
  /** Скрыть вкладки (например, "settings" при просмотре чужого профиля в админке) */
  hideTabs?: ProfileTab[];
}

export function ProfileTabs({ userProfile, breadcrumbPrefix, hideTabs }: ProfileTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const tabFromUrl = searchParams.get("tab");
  let activeTab: ProfileTab = isValidProfileTab(tabFromUrl) ? tabFromUrl : "overview";
  if (hideTabs?.length && hideTabs.includes(activeTab)) {
    activeTab = "overview";
  }

  // При открытии без ?tab= — подставить lastTab из localStorage или overview
  useEffect(() => {
    if (isValidProfileTab(tabFromUrl)) return;
    const lastTab = localStorage.getItem("profile:lastTab");
    const tab = isValidProfileTab(lastTab) && (!hideTabs?.length || !hideTabs.includes(lastTab as ProfileTab))
      ? (lastTab as ProfileTab)
      : "overview";
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, tabFromUrl, hideTabs]);

  // Редирект на overview, если открыта скрытая вкладка
  useEffect(() => {
    if (hideTabs?.length && tabFromUrl && hideTabs.includes(tabFromUrl as ProfileTab)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "overview");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [pathname, router, searchParams, tabFromUrl, hideTabs]);

  // Сохранять выбранную вкладку в localStorage
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
    <div className="w-full min-w-0">
      {/* Мобильное/планшетное меню — только до xl; на xl навигация в layout */}
      <div className="xl:hidden mb-4">
        <button
          type="button"
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-[var(--border)]/80 bg-[var(--card)]/90 backdrop-blur-sm text-[var(--foreground)] font-medium shadow-sm hover:bg-[var(--accent)]/80 transition-colors"
          aria-label={isMobileNavOpen ? "Закрыть меню" : "Открыть меню"}
        >
          {isMobileNavOpen ? <X className="w-5 h-5 shrink-0" /> : <Menu className="w-5 h-5 shrink-0" />}
          <span className="truncate">{tabMeta[activeTab].label}</span>
        </button>

        {isMobileNavOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden
          />
        )}

        <aside
          className={`
            fixed top-0 left-0 z-40 w-72 max-w-[85vw] h-screen
            bg-[var(--card)]/95 backdrop-blur-md border-r border-[var(--border)]
            transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl
            ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full invisible pointer-events-none"}
          `}
          aria-hidden={!isMobileNavOpen}
        >
          <div className="flex-shrink-0 p-4 border-b border-[var(--border)]/80">
            <h2 className="font-semibold text-[var(--foreground)]">Разделы профиля</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Выберите раздел</p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            <ProfileNav
              onNavigate={() => setIsMobileNavOpen(false)}
              showActiveChevron
              hideTabs={hideTabs}
            />
          </div>
        </aside>
      </div>

      {/* Контент: хлебные крошки + заголовок секции + тело */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="flex-shrink-0 mb-4 sm:mb-6">
          <Breadcrumbs
            items={
              breadcrumbPrefix?.length
                ? [...breadcrumbPrefix, { name: sectionTitle, isCurrent: true }]
                : [
                    { name: "Главная", href: "/" },
                    { name: "Профиль", href: "/profile" },
                    { name: sectionTitle, isCurrent: true },
                  ]
            }
            className="mb-3"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-2.5 bg-[var(--primary)]/10 rounded-xl shrink-0">
              <SectionIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
                {sectionTitle}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                {sectionDescription}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 profile-content-scroll">
          {/* О себе */}
          {activeTab === "overview" && (
            <div className="space-y-5 sm:space-y-6 animate-fade-in-up">
              <ProfileAdditionalInfo userProfile={userProfile} />
              <ProfileContent
                userProfile={userProfile}
                allBookmarksHref={`${pathname}?tab=bookmarks`}
                historyHref={`${pathname}?tab=history`}
                onShowBookmarks={() => setActiveTab("bookmarks")}
                onShowHistory={() => setActiveTab("history")}
              />
            </div>
          )}

          {/* Закладки */}
          {activeTab === "bookmarks" && (
            <div className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-[var(--card)]/90 backdrop-blur-sm p-4 sm:p-5 shadow-sm min-h-[320px] flex flex-col animate-fade-in-up">
              <BookmarksSection
                bookmarks={userProfile.bookmarks}
                readingHistory={userProfile.readingHistory}
                showAll={true}
                showSectionHeader={false}
              />
            </div>
          )}

          {/* История */}
          {activeTab === "history" && (
            <div className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-[var(--card)]/90 backdrop-blur-sm p-4 sm:p-5 shadow-sm min-h-[320px] flex flex-col animate-fade-in-up">
              <ReadingHistorySection
                readingHistory={userProfile.readingHistory}
                showAll={true}
                showSectionHeader={false}
              />
            </div>
          )}

          {/* Инвентарь */}
          {activeTab === "inventory" && (
            <div className="animate-fade-in-up">
              <ProfileInventory />
            </div>
          )}

          {/* Обмены */}
          {activeTab === "exchanges" && (
            <div className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-[var(--card)]/90 backdrop-blur-sm p-6 sm:p-8 shadow-sm animate-fade-in-up text-center">
              <div className="inline-flex p-4 rounded-2xl bg-[var(--secondary)]/50 border border-[var(--border)]/60 mb-4">
                <Repeat className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--primary)]" />
              </div>
              <h2 className="text-base font-semibold text-[var(--foreground)] mb-2">Обмены</h2>
              <p className="text-[var(--muted-foreground)] max-w-md mx-auto mb-6 text-sm leading-relaxed">
                Здесь вы сможете обмениваться предметами и декорациями с другими пользователями.
                Раздел в разработке.
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Следите за обновлениями или загляните в{" "}
                <Link
                  href="/tomilo-shop"
                  className="text-[var(--primary)] hover:underline font-medium"
                >
                  магазин
                </Link>
                .
              </p>
            </div>
          )}

          {/* Настройки */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-fade-in-up">
              <ProfileNotificationsSettings userProfile={userProfile} />
              <ProfileDisplaySettings userProfile={userProfile} />
              <ProfileReadingSettings userProfile={userProfile} />
              <ProfilePrivacySettings userProfile={userProfile} />
              <div className="lg:col-span-2">
                <ProfileSecuritySettings userProfile={userProfile} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProfileTabs;
