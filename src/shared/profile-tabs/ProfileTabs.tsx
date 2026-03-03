"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserProfile } from "@/types/user";
import { Menu, Repeat, X, ChevronLeft, ChevronRight } from "lucide-react";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";

import {
  type ProfileTab,
  tabMeta,
  PROFILE_TABS,
  isValidProfileTab,
} from "./profileTabConfig";

// Компоненты обзора
import ProfileAdditionalInfo from "@/shared/profile/ProfileAdditionalInfo";
import ProfileContent from "@/shared/profile/ProfileContent";
import ProfileStats from "@/shared/profile/ProfileStats";
import ProfileAchievements from "@/shared/profile/ProfileAchievements";
import ProfileProgress from "@/shared/profile/ProfileProgress";

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

export function ProfileTabs({ userProfile, breadcrumbPrefix, hideTabs, isPublicView = false, isBookmarksRestricted = false, isHistoryRestricted = false }: ProfileTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
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
      <div className="mb-4">
        <div className="relative flex items-center">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll("left")}
              className="absolute left-0 z-10 w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-sm hover:bg-[var(--accent)]"
              aria-label="Прокрутить влево"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--muted-foreground)]" />
            </button>
          )}
          <div
            ref={scrollRef}
            className="flex gap-1 overflow-x-auto scrollbar-hide py-1 px-1 cursor-grab select-none min-w-0"
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
                  onClick={() => { if (!hasDraggedRef.current) setActiveTab(tabId); }}
                  className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--secondary)]/50 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{meta.label}</span>
                </button>
              );
            })}
          </div>
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll("right")}
              className="absolute right-0 z-10 w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-sm hover:bg-[var(--accent)]"
              aria-label="Прокрутить вправо"
            >
              <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="flex-shrink-0 mb-4">
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
            className="mb-2"
          />
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[var(--primary)]/10 rounded-lg shrink-0">
              <SectionIcon className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[var(--foreground)]">{sectionTitle}</h1>
              <p className="text-xs text-[var(--muted-foreground)]">{sectionDescription}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 profile-content-scroll">
          {/* О себе */}
          {activeTab === "overview" && (
            <div className="space-y-5 sm:space-y-6 animate-fade-in-up">
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
                hiddenBookmarksMessage={isBookmarksRestricted ? "Пользователь скрыл свои закладки в настройках приватности." : undefined}
                hiddenHistoryMessage={isHistoryRestricted ? "Пользователь скрыл свою историю чтения в настройках приватности." : undefined}
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
            <div className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-[var(--card)]/90 backdrop-blur-sm p-4 sm:p-5 shadow-sm min-h-[320px] flex flex-col animate-fade-in-up">
              {isBookmarksRestricted ? (
                <div className="flex-1 flex items-center justify-center text-center py-12">
                  <div className="max-w-sm">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
            <div className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-[var(--card)]/90 backdrop-blur-sm p-4 sm:p-5 shadow-sm min-h-[320px] flex flex-col animate-fade-in-up">
              {isHistoryRestricted ? (
                <div className="flex-1 flex items-center justify-center text-center py-12">
                  <div className="max-w-sm">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
            <div className="animate-fade-in-up">
              <SettingsNavigation />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div id="settings-notifications">
                  <ProfileNotificationsSettings userProfile={userProfile} />
                </div>
                <div id="settings-display">
                  <ProfileDisplaySettings userProfile={userProfile} />
                </div>
                <div id="settings-reading">
                  <ProfileReadingSettings userProfile={userProfile} />
                </div>
                <div id="settings-privacy">
                  <ProfilePrivacySettings userProfile={userProfile} />
                </div>
                <div id="settings-security" className="lg:col-span-2">
                  <ProfileSecuritySettings userProfile={userProfile} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProfileTabs;
