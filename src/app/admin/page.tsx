"use client";

import { AdminTabs } from "@/shared/admin/admin-tabs";
import { AutoParsingSection } from "@/shared/admin/auto-parsing-section";
import { ChaptersSection } from "@/shared/admin/chapters-section";
import { CollectionsSection } from "@/shared/admin/collections-section";
import { OverviewSection } from "@/shared/admin/overview-section";
import { ParserSection } from "@/shared/admin/parser-section";
import { TitlesSection } from "@/shared/admin/titles-section";
import { UsersSection } from "@/shared/admin/users-section";
import { CommentsSection } from "@/shared/admin/comments-section";
import { ReportsSection } from "@/shared/admin/reports-section";
import { Footer, Header } from "@/widgets";
import { AuthGuard } from "@/guard/auth-guard";
import { useState } from "react";
import { Cog } from "lucide-react";


type AdminTab = "overview" | "parser" | "auto-parsing" | "titles" | "chapters" | "collections" | "users" | "comments" | "reports";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewSection onTabChange={setActiveTab} />;
      case "parser":
        return <ParserSection />;
      case "auto-parsing":
        return <AutoParsingSection />;
      case "titles":
        return (
          <TitlesSection
            onTitleSelect={(titleId) => {
              setSelectedTitleId(titleId);
              setActiveTab("chapters");
            }}
          />
        );
      case "chapters":
        return (
          <ChaptersSection
            titleId={selectedTitleId}
            onTitleChange={setSelectedTitleId}
          />
        );
      case "collections":
        return <CollectionsSection onTabChange={(tab: string) => setActiveTab(tab as AdminTab)} />;
      case "comments":
        return <CommentsSection />;
      case "users":
        return <UsersSection />;
      case "reports":
        return <ReportsSection />;
      default:
        return <OverviewSection onTabChange={setActiveTab} />;
    }
  };

  return (
    <AuthGuard requiredRole="admin">
      <main className="flex flex-col min-h-screen h-full bg-gradient-to-br from-background to-muted pb-15 md:pb-0">
        <Header />

        <div className="max-w-7xl w-full mx-auto px-2 sm:px-4 py-4 sm:py-6 flex flex-col flex-1">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--muted-foreground)] mb-2 flex items-center gap-2">
              <Cog className="w-6 h-6" />
              Админ-панель
            </h1>
            <p className="text-[var(--muted-foreground)] text-sm sm:text-base">
              Управление контентом и системой
            </p>
          </div>

          <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="mt-4 sm:mt-6">
            {renderTabContent()}
          </div>
        </div>

        <Footer />
      </main>
    </AuthGuard>
  );
}
