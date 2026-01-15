"use client";
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

import LatestUpdateCard from "@/shared/last-updates/last-updates";
import { GridSection, Footer, Header } from "@/widgets";
import { pageTitle } from "@/lib/page-title";
import { useGetLatestUpdatesQuery } from "@/store/api/titlesApi";
import { useSEO } from "@/hooks/useSEO";

export default function UpdatesPage() {
  const [mounted, setMounted] = useState(false);
  const { data: latestUpdatesData, isLoading, error } = useGetLatestUpdatesQuery();

  // SEO для страницы ленты обновлений
  useSEO({
    title: "Лента новых глав - Tomilo-lib.ru",
    description: "Свежие главы манги и маньхуа, которые только что вышли. Следите за обновлениями ваших любимых тайтлов.",
    keywords: "новые главы, обновления, манга, маньхуа, свежие релизы",
    type: "website",
  });

  useEffect(() => {
    setMounted(true);
    pageTitle.setTitlePage("Лента новых глав - Tomilo-lib.ru");
  }, []);

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="flex flex-col items-center justify-center gap-6">
          <div className="w-full max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 animate-pulse">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-full bg-[var(--muted)] rounded-lg border border-border h-20"></div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center gap-6">
        {/* Лента новых глав */}
        {isLoading ? (
          <div className="w-full max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 animate-pulse">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-full bg-[var(--muted)] rounded-lg border border-border h-20"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="w-full max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-center items-center h-32 text-[var(--muted-foreground)]">
              Ошибка загрузки обновлений
            </div>
          </div>
        ) : latestUpdatesData?.data && latestUpdatesData.data.length > 0 ? (
          <GridSection
            title="Лента новых глав"
            description="Свежие главы, которые только что вышли. Следите за обновлениями ваших любимых тайтлов."
            type="browse"
            icon={<Clock className="w-6 h-6" />}
            data={latestUpdatesData.data}
            cardComponent={LatestUpdateCard}
          />
        ) : (
          <div className="w-full max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-center items-center h-32 text-[var(--muted-foreground)]">
              Нет новых обновлений
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

