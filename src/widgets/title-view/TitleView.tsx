"use client";

import { Footer, Header } from "@/widgets";
import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import { getCoverUrls } from "@/lib/asset-url";

import { useIncrementViewsMutation, useGetTitleBySlugQuery } from "@/store/api/titlesApi";
import { useGetChaptersByTitleQuery } from "@/store/api/chaptersApi";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import ErrorState from "@/shared/error-state/ErrorState";
import MobileCover from "@/shared/browse/title-view/MobileCover";
import { LeftSidebar } from "@/shared/browse/title-view/LeftSidebar";
import { RightContent } from "@/shared/browse/title-view/RightContent";
import { AgeVerificationModal } from "@/shared/modal/AgeVerificationModal";
import { ReportModal } from "@/shared/report/ReportModal";

const TITLE_TABS = ["main", "chapters", "comments"] as const;
type TitleTab = (typeof TITLE_TABS)[number];
function isValidTab(t: string | null | undefined): t is TitleTab {
  return Boolean(t && TITLE_TABS.includes(t as TitleTab));
}

export default function TitleView({
  slug: slugProp,
  initialTab: initialTabProp,
}: {
  slug: string;
  initialTab?: string;
}) {
  const params = useParams();
  const slug = (typeof params?.slug === "string" ? params.slug : slugProp) ?? slugProp;
  const { user } = useAuth();
  const toast = useToast();
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalData, setReportModalData] = useState<{
    entityType: "title" | "chapter";
    entityId: string;
    entityTitle: string;
    titleId?: string;
  } | null>(null);

  // Получаем данные тайтла по slug (кеш 5 мин — меньше запросов при возврате на страницу)
  const {
    data: titleData,
    isLoading: titleLoading,
    error: titleError,
  } = useGetTitleBySlugQuery(
    { slug, includeChapters: true },
    {
      skip: !slug,
      refetchOnMountOrArgChange: 300,
    },
  );

  const titleId = titleData?._id as string;

  // История по тайтлу — из общего списка useAuth (GET /history?limit=200), без отдельного GET /history/:titleId
  const readingHistoryForTitle = useMemo(() => {
    if (!titleId || !user?.readingHistory?.length) return undefined;
    return user.readingHistory.find(
      item =>
        (typeof item.titleId === "string" ? item.titleId : item.titleId?._id) === titleId,
    );
  }, [titleId, user?.readingHistory]);

  // RTK Query hooks - загружаем все главы одним запросом
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [incrementViews] = useIncrementViewsMutation();

  // Единый запрос всех глав (limit: 10000 охватывает практически любой тайтл; кеш 5 мин)
  const { data: chaptersData, isLoading: chaptersLoading } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: 1,
      limit: 10000,
      sortOrder: "asc",
    },
    {
      skip: !titleId,
      refetchOnMountOrArgChange: 300,
    },
  );

  // Главы для отображения в списке (desc — новые сверху)
  const processedChaptersData = useMemo(() => {
    const chapters = chaptersData?.chapters || [];
    return [...chapters].sort((a, b) => {
      const aNum = a.chapterNumber || 0;
      const bNum = b.chapterNumber || 0;
      return bNum - aNum;
    });
  }, [chaptersData?.chapters]);

  // Временная проверка: пришли ли рейтинг и реакции в списке глав (откройте консоль браузера F12)
  useEffect(() => {
    if (!chaptersData?.chapters?.length || process.env.NODE_ENV !== "development") return;
    const ch = chaptersData.chapters[0];
    console.log("[chapters] Рейтинг в ответе API?", {
      averageRating: ch.averageRating,
      ratingCount: ch.ratingCount,
      ratingSum: ch.ratingSum,
      userRating: ch.userRating,
      reactions: ch.reactions,
      hasRating: ch.averageRating != null || (ch.ratingCount ?? 0) > 0,
    });
  }, [chaptersData?.chapters]);

  // Главы для ReadButton: asc (для корректного определения первой/следующей главы)
  const chaptersForReadButton = useMemo(() => {
    const chapters = chaptersData?.chapters || [];
    return [...chapters].sort((a, b) => (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0));
  }, [chaptersData?.chapters]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = `/titles/${slug}`;

  // Начальная вкладка: с сервера (initialTabProp), иначе из URL; при гидратации синхронизируем с useSearchParams
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TitleTab>(() => {
    if (isValidTab(initialTabProp)) return initialTabProp;
    if (isValidTab(tabFromUrl)) return tabFromUrl;
    return "chapters";
  });

  // Синхронизация вкладки с URL (как в админ-панели)
  useEffect(() => {
    const t = searchParams.get("tab");
    if (isValidTab(t)) setActiveTab(t);
  }, [searchParams]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === activeTab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", activeTab);
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    });
  }, [activeTab, pathname, router, searchParams]);

  // При открытии/возврате на страницу тайтла — скролл вверх (иначе после читалки лента остаётся внизу позже нужно найти баг)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Состояние для раскрытого описания
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Проверка прав администратора
  const displayIsAdmin = user?.role === "admin";

  // Эффект для увеличения просмотров
  useEffect(() => {
    if (titleId) {
      incrementViews(titleId);
    }
  }, [titleId, incrementViews]);

  // Обработчик поиска глав
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Обработчик сортировки глав
  const handleSortChange = (order: "desc" | "asc") => {
    setSortOrder(order);
  };

  // Обработчик поделиться
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: titleData?.name,
          text: `Посмотрите тайтл: ${titleData?.name}`,
          url: window.location.href,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          navigator.clipboard.writeText(window.location.href);
          toast.success("Ссылка скопирована в буфер обмена");
        }
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Ссылка скопирована в буфер обмена");
    }
  };

  // Показываем состояние загрузки с плавным переходом
  if (titleLoading || (chaptersLoading && processedChaptersData.length === 0)) {
    return (
      <main className="relative min-h-screen">
        <div className="fixed inset-0 -z-5 bg-[var(--background)]" />
        <Header />
        <div className="container mx-auto px-4 sm:px-5 lg:py-8 pb-20">
          <div className="max-w-6xl mx-auto p-5 sm:p-6 lg:p-8">
            {/* Skeleton для обложки и информации */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
              {/* Skeleton для обложки */}
              <div className="hidden lg:block lg:w-1/4">
                <div className="sticky top-28 space-y-4">
                  <div className="w-full max-w-[280px] mx-auto aspect-[2/3] rounded-xl bg-[var(--secondary)] animate-pulse" />
                  <div className="space-y-2 mt-6">
                    <div className="h-10 rounded-full bg-[var(--secondary)] animate-pulse" />
                    <div className="h-10 rounded-full bg-[var(--secondary)] animate-pulse" />
                    <div className="h-10 rounded-full bg-[var(--secondary)] animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Skeleton для контента */}
              <div className="w-full lg:w-3/4 space-y-6">
                {/* Мобильная обложка skeleton */}
                <div className="lg:hidden w-full max-w-[300px] mx-auto aspect-[2/3] rounded-xl bg-[var(--secondary)] animate-pulse" />

                {/* Заголовок skeleton */}
                <div className="h-8 w-3/4 mx-auto rounded-lg bg-[var(--secondary)] animate-pulse" />

                {/* Бейджи skeleton */}
                <div className="flex gap-2 flex-wrap">
                  <div className="h-7 w-20 rounded-full bg-[var(--secondary)] animate-pulse" />
                  <div className="h-7 w-24 rounded-full bg-[var(--secondary)] animate-pulse" />
                  <div className="h-7 w-16 rounded-full bg-[var(--secondary)] animate-pulse" />
                </div>

                {/* Жанры skeleton */}
                <div className="flex gap-2 flex-wrap">
                  <div className="h-6 w-16 rounded-full bg-[var(--secondary)] animate-pulse" />
                  <div className="h-6 w-20 rounded-full bg-[var(--secondary)] animate-pulse" />
                  <div className="h-6 w-14 rounded-full bg-[var(--secondary)] animate-pulse" />
                  <div className="h-6 w-18 rounded-full bg-[var(--secondary)] animate-pulse" />
                </div>

                {/* Описание skeleton */}
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-[var(--secondary)] animate-pulse" />
                  <div className="h-4 w-full rounded bg-[var(--secondary)] animate-pulse" />
                  <div className="h-4 w-2/3 rounded bg-[var(--secondary)] animate-pulse" />
                </div>

                {/* Табы skeleton */}
                <div className="h-10 rounded-full bg-[var(--secondary)] animate-pulse" />

                {/* Список глав skeleton */}
                <div className="space-y-2 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-12 rounded-full bg-[var(--secondary)] animate-pulse"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Показываем ошибку
  if (titleError) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
          <ErrorState title="Ошибка загрузки тайтла" message="Попробуйте обновить страницу" />
        </main>
        <Footer />
      </>
    );
  }

  if (!titleData) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
          <ErrorState
            title="Тайтл не найден"
            message="Запрашиваемый тайтл не существует или был удалён"
          />
        </main>
        <Footer />
      </>
    );
  }

  // Формируем URL обложки для фона
  const coverImageUrl = titleData.coverImage ? getCoverUrls(titleData.coverImage).primary : null;

  return (
    <main className="relative min-h-screen">
      {/* Фон: заблюренная обложка + лёгкий градиент для читаемости */}
      {coverImageUrl && (
        <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 blur-3xl opacity-70 [@media(prefers-color-scheme:dark)]:opacity-80"
            style={{ backgroundImage: `url(${coverImageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/70 via-[var(--background)]/85 to-[var(--background)]" />
        </div>
      )}
      <div className="relative z-10">
        {/* JSON-LD разметка генерируется на сервере в page.tsx */}
        <Header />
        <div className="container mx-auto px-4 sm:px-5 pb-24 md:pb-20">
          <div className="max-w-6xl mx-auto pt-6 sm:pt-8">
            <Breadcrumbs
              items={[
                { name: "Главная", href: "/" },
                { name: "Каталог", href: "/titles" },
                { name: titleData.name, isCurrent: true },
              ]}
            />
          </div>
          <div className="max-w-6xl mx-auto mt-4 sm:mt-6">
            <MobileCover
              titleData={titleData}
              chapters={chaptersForReadButton}
              readingHistory={readingHistoryForTitle}
              onShare={handleShare}
              isAdmin={displayIsAdmin}
              onAgeVerificationRequired={() => setIsAgeModalOpen(true)}
              onTabChange={setActiveTab}
            />

            <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-10">
              {/* Десктоп: обложка и действия слева (прокручиваются вместе со страницей) */}
              <div className="hidden lg:block lg:w-[280px] xl:w-[300px] shrink-0">
                <div className="space-y-6">
                  <LeftSidebar
                    titleData={titleData}
                    chapters={chaptersForReadButton}
                    readingHistory={readingHistoryForTitle}
                    onShare={handleShare}
                    isAdmin={displayIsAdmin}
                    onAgeVerificationRequired={() => setIsAgeModalOpen(true)}
                    onReportClick={data => {
                      setReportModalData(data);
                      setIsReportModalOpen(true);
                    }}
                  />
                </div>
              </div>

              <div className="w-full min-w-0 lg:flex-1">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md shadow-sm p-4 sm:p-5 lg:p-6">
                  <RightContent
                    titleData={titleData}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isDescriptionExpanded={isDescriptionExpanded}
                    onDescriptionToggle={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    chapters={processedChaptersData}
                    chaptersLoading={chaptersLoading}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    sortOrder={sortOrder}
                    onSortChange={handleSortChange}
                    titleId={titleId}
                    user={user}
                    slug={titleData.slug}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />

        {/* Модальное окно для подтверждения возраста */}
        {isAgeModalOpen && (
          <AgeVerificationModal
            isOpen={isAgeModalOpen}
            onConfirm={() => {
              setIsAgeModalOpen(false);
              // После подтверждения возраста, можно продолжить действие, которое требовало подтверждения
              console.log("Возраст подтвержден");
            }}
            onCancel={() => setIsAgeModalOpen(false)}
          />
        )}

        {/* Модальное окно для отправки жалобы */}
        {isReportModalOpen && reportModalData && (
          <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => {
              setIsReportModalOpen(false);
              setReportModalData(null);
            }}
            entityType={reportModalData.entityType}
            entityId={reportModalData.entityId}
            entityTitle={reportModalData.entityTitle}
            titleId={reportModalData.titleId}
          />
        )}
      </div>
    </main>
  );
}
