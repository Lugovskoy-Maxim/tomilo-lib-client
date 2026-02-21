"use client";

import { useState } from "react";
import { Header, Footer } from "@/widgets";
import { ShopTabs, type ShopTabId } from "@/shared/shop/ShopTabs";
import { ShopSection } from "@/shared/shop/ShopSection";
import { useSEO } from "@/hooks/useSEO";
import { Sparkles, Coins, ShoppingBag, User } from "lucide-react";

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

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-gradient-to-b from-[var(--secondary)]/60 to-[var(--background)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[var(--primary)]/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-[var(--chart-1)]/5 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-14 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium mb-6 border border-[var(--primary)]/20">
              <Sparkles className="w-4 h-4" />
              Магазин украшений
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--foreground)] tracking-tight mb-4">
              Персонализируйте свой профиль
            </h1>
            <p className="text-base sm:text-lg text-[var(--muted-foreground)] leading-relaxed">
              Аватары и фоны для профиля, карточки для колоды — собирайте коллекцию и выражайте
              свой стиль.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <ShopTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content */}
        <div className="min-h-[420px]">
          <ShopSection type={activeTab} />
        </div>

        {/* How it works */}
        <section className="mt-16 sm:mt-20">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Как это работает
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)]">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-1">Выберите товар</h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                    Аватары, фоны для профиля и карточки для колоды — в каждой категории
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)]">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-1">Купите за монеты активности</h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                    Тратьте монеты активности на аватары, фоны и карточки для колоды
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)]">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-1">Наденьте на профиль</h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                    Активируйте украшения — они отобразятся в вашем профиле
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Coins info */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/20 text-[var(--muted-foreground)] text-sm max-w-xl">
            <Coins className="w-5 h-5 text-amber-500 shrink-0" />
            <span>
              <strong className="text-[var(--foreground)]">Монеты активности</strong> — валюта за
              активность на сайте. Получайте их за чтение тайтлов, участие в сообществе и другую
              активность.
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] text-center max-w-md">
            Читайте главы манги и манхвы — за прогресс по тайтлам начисляются монеты.
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
