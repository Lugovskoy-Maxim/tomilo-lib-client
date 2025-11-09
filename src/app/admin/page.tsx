"use client";

import { AdminTabs } from "@/shared/admin/admin-tabs";
import { ChaptersSection } from "@/shared/admin/chapters-section";
import { OverviewSection } from "@/shared/admin/overview-section";
import { ParserSection } from "@/shared/admin/parser-section";
import { TitlesSection } from "@/shared/admin/titles-section";
import { UsersSection } from "@/shared/admin/users-section";
import { Footer, Header } from "@/widgets";
import { useState } from "react";


type AdminTab = "overview" | "parser" | "titles" | "chapters" | "users";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewSection onTabChange={setActiveTab} />;
      case "parser":
        return <ParserSection />;
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
      case "users":
        return <UsersSection />;
      default:
        return <OverviewSection onTabChange={setActiveTab} />;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--muted-foreground)] mb-2 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">⚙️</span>
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
  );
}
