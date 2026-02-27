"use client";
import { useState, useEffect } from "react";
import { Clock, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";

import LatestUpdateCard from "@/shared/last-updates/LastUpdates";
import { GridSection, Footer, Header } from "@/widgets";
import { pageTitle } from "@/lib/page-title";
import { useGetLatestUpdatesQuery } from "@/store/api/titlesApi";
import { useSEO } from "@/hooks/useSEO";

const UPDATES_PAGE_SIZE = 20;

export default function UpdatesPage() {
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  type UpdateItem = NonNullable<
    ReturnType<typeof useGetLatestUpdatesQuery>["data"]
  >["data"][number];
  const [accumulatedData, setAccumulatedData] = useState<UpdateItem[]>([]);

  const { data: latestUpdatesData, isLoading, isFetching, error } = useGetLatestUpdatesQuery(
    { page, limit: UPDATES_PAGE_SIZE },
    { refetchOnMountOrArgChange: false }
  );

  const rawPageData = latestUpdatesData?.data;
  const pageList: UpdateItem[] = Array.isArray(rawPageData)
    ? rawPageData
    : (rawPageData as { data?: UpdateItem[] } | undefined)?.data ?? [];

  useEffect(() => {
    if (pageList.length === 0) return;
    if (page === 1) {
      setAccumulatedData(pageList);
    } else {
      setAccumulatedData((prev: UpdateItem[]) => {
        const existingIds = new Set(prev.map(item => item.id));
        const newItems = pageList.filter(item => !existingIds.has(item.id));
        return [...prev, ...newItems];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestUpdatesData]);

  const hasMore = pageList.length >= UPDATES_PAGE_SIZE;
  const isLoadingMore = isFetching && page > 1;
  const displayData =
    accumulatedData.length > 0
      ? accumulatedData
      : page === 1
        ? pageList
        : [];

  // SEO для страницы ленты обновлений
  useSEO({
    title: "Лента новых глав - Tomilo-lib.ru",
    description:
      "Свежие главы манги и маньхуа, которые только что вышли. Следите за обновлениями ваших любимых тайтлов.",
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
                <div
                  key={i}
                  className="w-full bg-[var(--muted)] rounded-lg border border-border h-20"
                ></div>
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
                <div
                  key={i}
                  className="w-full bg-[var(--muted)] rounded-lg border border-border h-20"
                ></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="w-full max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-center items-center h-32 text-[var(--muted-foreground)]">
              Ошибка загрузки обновлений
            </div>
          </div>
        ) : displayData.length > 0 ? (
          <>
            <GridSection
              title="Лента новых глав"
              description="Свежие главы, которые только что вышли. Следите за обновлениями ваших любимых тайтлов."
              type="browse"
              icon={<Clock className="w-6 h-6" />}
              data={displayData}
              cardComponent={LatestUpdateCard}
            />
            {hasMore && (
              <div className="w-full max-w-7xl mx-auto px-4 flex justify-center mt-2 pb-10">
                <button
                  type="button"
                  onClick={() => setPage(p => p + 1)}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--secondary)] border border-[var(--border)] hover:bg-[var(--accent)] transition-colors rounded-xl text-[var(--foreground)] font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    "Загрузить ещё"
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full max-w-7xl mx-auto px-4 py-12">
            <div className="flex flex-col items-center justify-center min-h-[280px] text-center">
              <Clock className="w-14 h-14 text-[var(--muted-foreground)]/50 mb-4" />
              <p className="text-[var(--muted-foreground)] text-lg mb-2">Нет новых обновлений</p>
              <p className="text-[var(--muted-foreground)] text-sm mb-6 max-w-md">
                Свежие главы появятся здесь после выхода новых релизов. Загляните в каталог, чтобы выбрать тайтлы для чтения.
              </p>
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:opacity-90 transition-opacity font-medium text-sm"
              >
                <BookOpen className="w-4 h-4" />
                В каталог
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
