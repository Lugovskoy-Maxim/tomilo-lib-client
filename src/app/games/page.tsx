"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Header, Footer } from "@/widgets";
import {
  GamesTabs,
  GamesHubIntro,
  GamesHubHero,
  InventorySection,
  DisciplesSection,
  ExpeditionSection,
  AlchemySection,
  WheelSection,
  CardsCollectionSection,
  isValidGamesTabId,
  type GamesTabId,
} from "@/shared/games";
import { useSEO } from "@/hooks/useSEO";
import { AuthGuard } from "@/guard/AuthGuard";
import ProfileDailyQuests from "@/shared/profile/ProfileDailyQuests";

const DEFAULT_TAB: GamesTabId = "inventory";

export default function GamesPage() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTabState] = useState<GamesTabId>(() =>
    isValidGamesTabId(tabFromUrl ?? "") ? (tabFromUrl as GamesTabId) : DEFAULT_TAB
  );

  const setActiveTab = useCallback(
    (tab: GamesTabId) => {
      setActiveTabState(tab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url.pathname + "?" + url.searchParams.toString());
    },
    []
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab") ?? "";
    if (isValidGamesTabId(tabParam)) setActiveTabState(tabParam);
  }, [searchParams]);

  useSEO({
    title: "Мини-игры — Арена наставника | Tomilo-lib.ru",
    description:
      "Игровой хаб: инвентарь, ежедневные квесты, ученики, экспедиции, карточки, алхимия и колесо судьбы.",
    keywords: "мини-игры, инвентарь, квесты, карточки, ученики, алхимия, колесо судьбы, томило",
  });

  return (
    <main className="games-hub min-h-screen overflow-x-hidden">
      <AuthGuard redirectTo="/">
        <Header />

        <GamesHubHero />

        <section className="games-header sticky top-0 z-10 backdrop-blur-md bg-[color-mix(in_oklch,var(--background)_88%,transparent)] supports-[backdrop-filter]:bg-[color-mix(in_oklch,var(--background)_72%,transparent)] border-b border-[var(--border)] shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="max-w-7xl mx-auto px-3 py-2.5 sm:px-4 sm:py-3">
            <p className="games-tabs-label text-center sm:text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Разделы
            </p>
            <GamesTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-5">
          <GamesHubIntro activeTab={activeTab} />
          <div
            key={activeTab}
            className="games-content-enter"
            role="tabpanel"
            id={`games-panel-${activeTab}`}
            aria-labelledby={`games-tab-${activeTab}`}
          >
            {activeTab === "inventory" && <InventorySection />}
            {activeTab === "quests" && <ProfileDailyQuests />}
            {activeTab === "disciples" && <DisciplesSection />}
            {activeTab === "expedition" && <ExpeditionSection />}
            {activeTab === "cards" && <CardsCollectionSection />}
            {activeTab === "alchemy" && <AlchemySection />}
            {activeTab === "wheel" && <WheelSection />}
          </div>
        </div>

        <Footer />
      </AuthGuard>
    </main>
  );
}
