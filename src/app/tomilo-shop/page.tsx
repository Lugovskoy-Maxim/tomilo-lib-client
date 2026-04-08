"use client";

import { useState } from "react";
import { Header, Footer } from "@/widgets";
import { ShopTabs, type ShopTabId } from "@/shared/shop/ShopTabs";
import { ShopSection } from "@/shared/shop/ShopSection";
import { ShopSuggestionsBlock } from "@/shared/shop/ShopSuggestionsBlock";
import { useSEO } from "@/hooks/useSEO";
import { Coins, Sparkles } from "lucide-react";

export default function TomiloShopPage() {
  const [activeTab, setActiveTab] = useState<ShopTabId>("avatar");

  useSEO({
    title: "Магазин украшений - Tomilo-lib.ru",
    description:
      "Аватары и фоны для профиля, карточки для колоды. Покупайте за монеты активности — их получают за чтение тайтлов и активность на сайте.",
    keywords:
      "магазин, украшения, аватары, фоны, карточки, колода, монеты активности, чтение тайтлов",
  });

  return (
    <main className="min-h-screen bg-[var(--background)] overflow-x-hidden">
      <Header />

      <div className="max-w-6xl mx-auto px-3 py-4 sm:px-6 sm:py-8">
        {/* Герой */}
        <div className="relative mb-6 sm:mb-8 rounded-2xl border border-[var(--border)]/80 bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--muted)]/40 px-4 py-5 sm:px-8 sm:py-7 text-center overflow-hidden shadow-sm">
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[var(--primary)]/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl"
            aria-hidden
          />
          <div className="relative inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-3 py-1 text-[11px] sm:text-xs font-medium text-[var(--primary)] mb-3">
            <Sparkles className="w-3.5 h-3.5" aria-hidden />
            Украшения профиля
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--foreground)] tracking-tight mb-2">
            Магазин украшений
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted-foreground)] max-w-lg mx-auto leading-relaxed">
            Аватары, рамки, фоны и карточки — за монеты активности. Скидки, бесплатные позиции и
            популярность товаров видны на карточках.
          </p>
        </div>

        {/* Предложенные украшения */}
        <section className="mb-6 sm:mb-8">
          <ShopSuggestionsBlock />
        </section>

        {/* Вкладки */}
        <section className="sticky top-0 z-20 -mx-3 px-3 sm:-mx-6 sm:px-6 py-3 mb-5 border-b border-[var(--border)]/70 bg-[var(--background)]/90 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--background)]/75">
          <div className="flex justify-center overflow-x-auto overflow-y-hidden scrollbar-thin pb-0.5">
            <ShopTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </section>

        <div
          id="shop-section"
          role="tabpanel"
          aria-labelledby={`shop-tab-${activeTab}`}
          className="min-h-[360px] pb-2"
        >
          {(["avatar", "frame", "background", "card"] as const).map(tabType => (
            <div
              key={tabType}
              className={activeTab === tabType ? "block animate-in fade-in duration-200" : "hidden"}
              hidden={activeTab !== tabType}
            >
              <ShopSection type={tabType} />
            </div>
          ))}
        </div>

        <footer className="mt-8 sm:mt-12 pt-6 border-t border-[var(--border)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-center sm:text-left text-xs sm:text-sm text-[var(--muted-foreground)]">
            <span>Выберите вкладку → отфильтруйте по цене → купите или получите бесплатно → наденьте в профиле.</span>
            <span className="inline-flex items-center justify-center sm:justify-end gap-2 shrink-0">
              <Coins className="w-4 h-4 text-amber-500 shrink-0" aria-hidden />
              Монеты за чтение глав и активность на сайте.
            </span>
          </div>
        </footer>
      </div>

      <Footer />
    </main>
  );
}
