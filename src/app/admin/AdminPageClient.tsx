"use client";

import { ADMIN_TABS, AdminTabs, type AdminTab } from "@/shared/admin/AdminTabs";
import AutoParsingSection from "@/shared/admin/AutoParsingSection";
import { ChaptersSection } from "@/shared/admin/ChaptersSection";
import { CollectionsSection } from "@/shared/admin/CollectionsSection";
import { OverviewSection } from "@/shared/admin/OverviewSection";
import { StatsSection } from "@/shared/admin/StatsSection";
import { ParserSection } from "@/shared/admin/ParserSection";
import { TitlesSection } from "@/shared/admin/TitlesSection";
import { UnpublishedTitlesSection } from "@/shared/admin/UnpublishedTitlesSection";
import { TranslatorsSection } from "@/shared/admin/TranslatorsSection";
import { UsersSection } from "@/shared/admin/UsersSection";
import { BotDetectionSection } from "@/shared/admin/BotDetectionSection";
import { CommentsSection } from "@/shared/admin/CommentsSection";
import { ReportsSection } from "@/shared/admin/ReportsSection";
import { CharacterModerationSection } from "@/shared/admin/CharacterModerationSection";
import { IpManagementSection } from "@/shared/admin/IpManagementSection";
import { ShopManagementSection } from "@/shared/admin/ShopManagementSection";
import { PromoCodesSection } from "@/shared/admin/PromoCodesSection";
import { WorkQueueSection } from "@/shared/admin/WorkQueueSection";
import { AnnouncementsSection } from "@/shared/admin/AnnouncementsSection";
import { GenresSection } from "@/shared/admin/GenresSection";
import { AchievementsSection } from "@/shared/admin/AchievementsSection";
import { NotificationsSection } from "@/shared/admin/NotificationsSection";
import { SiteSettingsSection } from "@/shared/admin/SiteSettingsSection";
import { AuditLogsSection } from "@/shared/admin/AuditLogsSection";
import { Header } from "@/widgets";
import { AuthGuard } from "@/guard/AuthGuard";
import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import Link from "next/link";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function AdminPageClient() {
  const isValidAdminTab = (tab: string | null): tab is AdminTab => {
    return Boolean(tab && ADMIN_TABS.includes(tab as AdminTab));
  };

  const getInitialAdminTab = (): AdminTab => {
    if (typeof window === "undefined") return "overview";

    const tabFromUrl = new URLSearchParams(window.location.search).get("tab");
    if (isValidAdminTab(tabFromUrl)) return tabFromUrl;

    const lastTab = localStorage.getItem("admin:lastTab");
    if (isValidAdminTab(lastTab)) return lastTab;

    return "overview";
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(getInitialAdminTab);
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Синхронизация только URL → state (навигация назад/вперёд). Без activeTab в deps,
  // иначе при клике по вкладке старый searchParams успевает вернуть предыдущую вкладку — вкладки прыгают.
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (isValidAdminTab(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    localStorage.setItem("admin:lastTab", activeTab);

    const currentTabInUrl = searchParams.get("tab");
    if (currentTabInUrl === activeTab) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", activeTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeTab, pathname, router, searchParams]);

  const getSectionTitle = () => {
    const titles: Record<AdminTab, string> = {
      overview: "Обзор",
      statistics: "Статистика",
      parser: "Парсинг",
      "auto-parsing": "Автопарсинг",
      titles: "Тайтлы",
      "unpublished-titles": "Неопубликованные тайтлы",
      chapters: "Главы",
      collections: "Коллекции",
      announcements: "Новости / Объявления",
      "translator-teams": "Команды переводчиков",
      genres: "Жанры",
      achievements: "Достижения",
      comments: "Комментарии",
      users: "Пользователи",
      bots: "Подозрительные / Боты",
      reports: "Жалобы",
      "character-moderation": "Персонажи на модерации",
      notifications: "Уведомления",
      "ip-management": "IP-управление",
      shop: "Магазин",
      "promo-codes": "Промокоды",
      "site-settings": "Настройки сайта",
      "audit-logs": "Аудит-логи",
      "work-queue": "Рабочая очередь",
    };
    return titles[activeTab] || "Админ-панель";
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewSection onTabChange={setActiveTab} />;
      case "statistics":
        return <StatsSection />;
      case "parser":
        return <ParserSection />;
      case "auto-parsing":
        return <AutoParsingSection />;
      case "titles":
        return (
          <TitlesSection
            onTitleSelect={titleId => {
              setSelectedTitleId(titleId);
              setActiveTab("chapters");
            }}
          />
        );
      case "unpublished-titles":
        return <UnpublishedTitlesSection />;
      case "chapters":
        return <ChaptersSection titleId={selectedTitleId} onTitleChange={setSelectedTitleId} />;
      case "collections":
        return <CollectionsSection onTabChange={(tab: string) => setActiveTab(tab as AdminTab)} />;
      case "announcements":
        return <AnnouncementsSection />;
      case "translator-teams":
        return <TranslatorsSection />;
      case "genres":
        return <GenresSection />;
      case "achievements":
        return <AchievementsSection />;
      case "comments":
        return <CommentsSection />;
      case "users":
        return <UsersSection />;
      case "bots":
        return <BotDetectionSection />;
      case "reports":
        return <ReportsSection />;
      case "character-moderation":
        return <CharacterModerationSection />;
      case "notifications":
        return <NotificationsSection />;
      case "ip-management":
        return <IpManagementSection />;
      case "shop":
        return <ShopManagementSection />;
      case "promo-codes":
        return <PromoCodesSection />;
      case "site-settings":
        return <SiteSettingsSection />;
      case "audit-logs":
        return <AuditLogsSection />;
      case "work-queue":
        return <WorkQueueSection />;
      default:
        return <OverviewSection onTabChange={setActiveTab} />;
    }
  };

  return (
    <AuthGuard requiredRole="admin">
      <div className="flex flex-col h-screen overflow-hidden bg-[var(--background)]">
        <Header />

        <div className="flex flex-1 min-h-0">
          <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            <header className="flex-shrink-0 bg-[var(--card)] border-b border-[var(--border)] px-4 sm:px-6 py-2 sm:py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Breadcrumbs
                    items={[
                      { name: "Главная", href: "/" },
                      { name: "Админка", href: "/admin" },
                      { name: getSectionTitle(), isCurrent: true },
                    ]}
                    className="text-sm"
                  />
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] border border-[var(--border)] transition-colors flex-shrink-0"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">На сайт</span>
                </Link>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto admin-content-scroll flex flex-col">
              <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 flex-1 flex flex-col">
                {renderTabContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
