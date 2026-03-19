"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Header, Footer } from "@/widgets";
import {
  GamesTabs,
  GamesHubIntro,
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
    const t = searchParams.get("tab");
    if (isValidGamesTabId(t ?? "")) setActiveTabState(t);
  }, [searchParams]);

  useSEO({
    title: "Мини-игры - Tomilo-lib.ru",
    description: "Инвентарь, квесты, ученики, карточки, алхимия и колесо судьбы в одном игровом хабе.",
    keywords: "мини-игры, инвентарь, квесты, карточки, ученики, алхимия, колесо судьбы",
  });

  return (
    <main className="games-hub min-h-screen overflow-x-hidden">
      <AuthGuard redirectTo="/" requiredRole="admin">
        <Header />

        <section className="games-header sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
            <div className="text-center mb-3 sm:mb-4">
              <h1 className="games-title">
                Арена наставника
              </h1>
              <p className="games-subtitle max-w-sm mx-auto mt-0.5">
                Инвентарь · Квесты · Ученики · Экспедиция · Карточки · Алхимия · Колесо
              </p>
            </div>
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
