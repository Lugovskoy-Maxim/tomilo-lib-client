"use client";

import { useState } from "react";
import { Header, Footer } from "@/widgets";
import { ShopTabs } from "@/shared/shop/shop-tabs";
import { ShopSection } from "@/shared/shop/shop-section";
import { useSEO } from "@/hooks/useSEO";

export default function TomiloShopPage() {
  const [activeTab, setActiveTab] = useState<'avatar' | 'background' | 'card'>('avatar');

  // SEO для страницы магазина
  useSEO({
    title: "Магазин украшений - Tomilo-lib.ru",
    description: "Купите уникальные аватары, фоны и карточки для персонализации вашего профиля в Tomilo-lib.ru",
    keywords: "магазин, украшения, аватары, фоны, карточки, персонализация",
  });

  const getTabTitle = () => {
    switch (activeTab) {
      case 'avatar':
        return 'Аватары';
      case 'background':
        return 'Фоны';
      case 'card':
        return 'Карточки';
      default:
        return 'Товары';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Заголовок страницы */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
            🛒 Магазин Tomilo
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
            Персонализируйте свой профиль с помощью уникальных украшений. 
            Выбирайте из аватаров, фонов и карточек, чтобы выделиться среди других пользователей.
          </p>
        </div>

        {/* Навигация по вкладкам */}
        <div className="flex justify-center mb-8">
          <ShopTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Контент вкладки */}
        <div className="min-h-[400px]">
          <ShopSection type={activeTab} />
        </div>

        {/* Дополнительная информация */}
        <div className="mt-12 text-center">
          <div className="bg-[var(--secondary)] border border-[var(--border)] rounded-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
              💡 Как это работает?
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-[var(--muted-foreground)]">
              <div className="text-center">
                <div className="text-2xl mb-2">1️⃣</div>
                <p><strong>Выберите товар</strong><br />Просмотрите доступные украшения в каждой категории</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">2️⃣</div>
                <p><strong>Купите за монеты</strong><br />Используйте игровую валюту для покупки понравившихся товаров</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">3️⃣</div>
                <p><strong>Наденьте на профиль</strong><br />Активируйте украшения, чтобы они отображались в вашем профиле</p>
              </div>
            </div>
          </div>
        </div>

        {/* Информация о монетах */}
        <div className="mt-6 text-center">
          <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-[var(--muted-foreground)]">
              💰 <strong>Монеты</strong> можно получить за активность на сайте, чтение манги и участие в сообществе
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
