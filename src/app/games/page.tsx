"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Header, Footer } from "@/widgets";
import {
  GamesTabs,
  GamesHubIntro,
  GamesHubHero,
  GamesGuestPlaceholder,
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
import { useAuth } from "@/hooks/useAuth";
import { useMounted } from "@/hooks/useMounted";
import { useToast } from "@/hooks/useToast";
import ProfileDailyQuests from "@/shared/profile/ProfileDailyQuests";
import LoginModal from "@/shared/modal/LoginModal";
import RegisterModal from "@/shared/modal/RegisterModal";
import type { ApiResponseDto } from "@/types/api";
import type { AuthResponse } from "@/types/auth";

const DEFAULT_TAB: GamesTabId = "inventory";

const SITE_ORIGIN = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

export default function GamesPage() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const mounted = useMounted();
  const toast = useToast();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTabState] = useState<GamesTabId>(() =>
    isValidGamesTabId(tabFromUrl ?? "") ? (tabFromUrl as GamesTabId) : DEFAULT_TAB
  );

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const setActiveTab = useCallback((tab: GamesTabId) => {
    setActiveTabState(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url.pathname + "?" + url.searchParams.toString());
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab") ?? "";
    if (isValidGamesTabId(tabParam)) setActiveTabState(tabParam);
  }, [searchParams]);

  useSEO({
    title: "Мини-игры — Арена наставника | Tomilo-lib.ru",
    description:
      "Игровой хаб: инвентарь, ежедневные квесты, ученики, экспедиции, карточки, алхимия и колесо судьбы.",
    keywords: "мини-игры, инвентарь, квесты, карточки, ученики, алхимия, колесо судьбы, томило",
    url: `${SITE_ORIGIN}/games`,
    image: `${SITE_ORIGIN}/logo/tomilo_book.png`,
    type: "website",
  });

  const handleAuthSuccess = (authResponse: ApiResponseDto<AuthResponse>) => {
    login(authResponse);
    setLoginModalOpen(false);
    setRegisterModalOpen(false);
    toast.success("Добро пожаловать в арену наставника!");
  };

  if (!mounted || authLoading) {
    return (
      <main className="games-hub min-h-screen overflow-x-hidden">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[45vh] px-4">
          <div
            className="animate-spin rounded-full h-11 w-11 border-2 border-[var(--border)] border-t-[var(--primary)]"
            aria-hidden
          />
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">Загрузка…</p>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="games-hub min-h-screen overflow-x-hidden">
      <Header />

      <GamesHubHero />

      {isAuthenticated ? (
        <>
          <section className="games-header sticky top-0 z-10 backdrop-blur-md bg-[color-mix(in_oklch,var(--background)_88%,transparent)] supports-[backdrop-filter]:bg-[color-mix(in_oklch,var(--background)_72%,transparent)] border-b border-[var(--border)] shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <div className="max-w-7xl mx-auto px-3 py-2.5 sm:px-4 sm:py-3">
              <p className="games-tabs-label text-center sm:text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Разделы
              </p>
              <GamesTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          </section>

          <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-5">
            <div
              key={activeTab}
              className="games-content-enter"
              role="tabpanel"
              id={`games-panel-${activeTab}`}
              aria-labelledby={`games-tab-${activeTab}`}
            >
              {activeTab === "inventory" && <InventorySection />}
              {activeTab === "quests" && <ProfileDailyQuests variant="games" />}
              {activeTab === "disciples" && <DisciplesSection />}
              {activeTab === "expedition" && <ExpeditionSection />}
              {activeTab === "cards" && <CardsCollectionSection />}
              {activeTab === "alchemy" && <AlchemySection />}
              {activeTab === "wheel" && <WheelSection />}
            </div>
            <GamesHubIntro activeTab={activeTab} />
          </div>
        </>
      ) : (
        <GamesGuestPlaceholder
          onLogin={() => setLoginModalOpen(true)}
          onRegister={() => setRegisterModalOpen(true)}
        />
      )}

      <Footer />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
        onAuthSuccess={handleAuthSuccess}
      />
      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
        onAuthSuccess={handleAuthSuccess}
      />
    </main>
  );
}
