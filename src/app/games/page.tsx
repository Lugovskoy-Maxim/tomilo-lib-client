"use client";

import { useState } from "react";
import { Header, Footer } from "@/widgets";
import { GamesTabs, GamesHubIntro, InventorySection, DisciplesSection, AlchemySection, WheelSection, type GamesTabId } from "@/shared/games";
import { useSEO } from "@/hooks/useSEO";
import { AuthGuard } from "@/guard/AuthGuard";

export default function GamesPage() {
  const [activeTab, setActiveTab] = useState<GamesTabId>("inventory");

  useSEO({
    title: "Мини-игры - Tomilo-lib.ru",
    description: "Инвентарь, Учитель и ученики, Алхимия пилюль, Колесо судьбы. Получайте предметы за чтение и квесты.",
    keywords: "мини-игры, инвентарь, ученики, алхимия, колесо судьбы, награды",
  });

  return (
    <main className="games-hub min-h-screen overflow-x-hidden">
      <AuthGuard requiredRole="admin" redirectTo="/">
        <Header />

        <section className="games-header sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
            <div className="text-center mb-3 sm:mb-4">
              <h1 className="games-title">
                Арена наставника
              </h1>
              <p className="games-subtitle max-w-sm mx-auto mt-0.5">
                Инвентарь · Ученики · Алхимия · Колесо судьбы
              </p>
            </div>
            <GamesTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-3 py-4 sm:px-4 sm:py-5">
          <GamesHubIntro activeTab={activeTab} />
          <div key={activeTab} className="games-content-enter">
            {activeTab === "inventory" && <InventorySection />}
            {activeTab === "disciples" && <DisciplesSection />}
            {activeTab === "alchemy" && <AlchemySection />}
            {activeTab === "wheel" && <WheelSection />}
          </div>
        </div>

        <Footer />
      </AuthGuard>
    </main>
  );
}
