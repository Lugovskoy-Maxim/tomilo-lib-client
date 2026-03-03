"use client";

import { useState } from "react";
import { Header, Footer } from "@/widgets";
import { ShopTabs, type ShopTabId } from "@/shared/shop/ShopTabs";
import { ShopSection } from "@/shared/shop/ShopSection";
import { useSEO } from "@/hooks/useSEO";
import { Coins } from "lucide-react";

export default function TomiloShopPage() {
  const [activeTab, setActiveTab] = useState<ShopTabId>("avatar");

  useSEO({
    title: "Магазин украшений - Tomilo-lib.ru",
    description:
      "Аватары и фоны для профиля, карточки для колоды. Покупайте за монеты активности — их получают за чтение тайтлов и активность на сайте.",
    keywords: "магазин, украшения, аватары, фоны, карточки, колода, монеты активности, чтение тайтлов",
  });

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Header />

      {/* Компактный герой + вкладки в одном блоке */}
      <section className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 sm:px-6">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] tracking-tight mb-1">
              Магазин украшений
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
              Аватары, фоны и карточки — покупайте за монеты активности, наденьте на профиль.
            </p>
          </div>
          <div className="flex justify-center">
            <ShopTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 sm:px-6">
        <div className="min-h-[360px]">
          <ShopSection type={activeTab} />
        </div>

        {/* Как это работает — одна строка + подсказка про монеты */}
        <footer className="mt-10 pt-6 border-t border-[var(--border)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-6 text-center sm:text-left text-sm text-[var(--muted-foreground)]">
            <span className="order-2 sm:order-1">
              Выберите товар → оплатите монетами → наденьте в профиле.
            </span>
            <span className="order-1 sm:order-2 inline-flex items-center justify-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-500 shrink-0" aria-hidden />
              Монеты начисляются за чтение глав и активность на сайте.
            </span>
          </div>
        </footer>
      </div>

      <Footer />
    </main>
  );
}
