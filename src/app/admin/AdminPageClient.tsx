"use client";

import { ADMIN_TABS, AdminTabs, type AdminTab } from "@/shared/admin/AdminTabs";
import AutoParsingSection from "@/shared/admin/AutoParsingSection";
import { ChaptersSection } from "@/shared/admin/ChaptersSection";
import { CollectionsSection } from "@/shared/admin/CollectionsSection";
import { OverviewSection } from "@/shared/admin/OverviewSection";
import { StatsSection } from "@/shared/admin/StatsSection";
import { ParserSection } from "@/shared/admin/ParserSection";
import { TitlesSection } from "@/shared/admin/TitlesSection";
import { UsersSection } from "@/shared/admin/UsersSection";
import { CommentsSection } from "@/shared/admin/CommentsSection";
import { ReportsSection } from "@/shared/admin/ReportsSection";
import { IpManagementSection } from "@/shared/admin/IpManagementSection";
import { ShopManagementSection } from "@/shared/admin/ShopManagementSection";
import { WorkQueueSection } from "@/shared/admin/WorkQueueSection";
import { Header } from "@/widgets";
import { AuthGuard } from "@/guard/AuthGuard";
import { useEffect, useState } from "react";
import { Settings, Home } from "lucide-react";
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
      chapters: "Главы",
      collections: "Коллекции",
      comments: "Комментарии",
      users: "Пользователи",
      reports: "Жалобы",
      "ip-management": "IP-управление",
      shop: "Магазин",
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
      case "chapters":
        return <ChaptersSection titleId={selectedTitleId} onTitleChange={setSelectedTitleId} />;
      case "collections":
        return <CollectionsSection onTabChange={(tab: string) => setActiveTab(tab as AdminTab)} />;
      case "comments":
        return <CommentsSection />;
      case "users":
        return <UsersSection />;
      case "reports":
        return <ReportsSection />;
      case "ip-management":
        return <IpManagementSection />;
      case "shop":
        return <ShopManagementSection />;
      case "work-queue":
        return <WorkQueueSection />;
      default:
        return <OverviewSection onTabChange={setActiveTab} />;
    }
  };

  return (
    <AuthGuard requiredRole="admin">
      <div className="flex flex-col min-h-screen bg-[var(--background)]">
        <Header />

        <div className="flex flex-1">
          <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            <header className="flex-shrink-0 bg-[var(--card)] border-b border-[var(--border)] px-4 sm:px-6 py-4 lg:py-5">
              <Breadcrumbs
                items={[
                  { name: "Главная", href: "/" },
                  { name: "Админка", href: "/admin", isCurrent: true },
                ]}
                className="mb-3"
              />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[var(--primary)]/10 rounded-xl">
                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--foreground)]">
                      {getSectionTitle()}
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                      Управление контентом и системой
                    </p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] border border-[var(--border)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                >
                  <Home className="w-4 h-4" />
                  На сайт
                </Link>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto admin-content-scroll">
              <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6">
                {renderTabContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
