  "use client";

import { Footer, Header } from "@/widgets";
import { AlertTriangle, Share as ShareIcon, Edit } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Chapter, Title } from "@/types/title";
import { User } from "@/types/auth";
import { useParams } from "next/navigation";
import {
  useIncrementViewsMutation,
  useGetTitleByIdQuery,
} from "@/store/api/titlesApi";
import { useGetChaptersByTitleQuery } from "@/store/api/chaptersApi";
import { LeftSidebar, RightContent } from "@/shared/browse/title-view";
import { useSEO, seoConfigs } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { ReadButton } from "@/shared/browse/read-button";
import { BookmarkButton } from "@/shared/bookmark-button";



export default function TitleViewPage() {
  const params = useParams();
  const titleId = params.titleId as string;

  const { user } = useAuth();

  // Remove unused existingTitle
  // const titlesState = useSelector((state: RootState) => state.titles);

  // RTK Query hooks - load title without chapters for better performance
  const {
    data: titleDataRaw,
    isLoading: titleLoading,
    error: titleError,
  } = useGetTitleByIdQuery({ id: titleId, includeChapters: false });

  const [incrementViews] = useIncrementViewsMutation();

  // Состояния UI
  const [activeTab, setActiveTab] = useState<
    "description" | "chapters" | "comments" | "statistics"
  >("chapters");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Флаг для предотвращения множественных инкрементов просмотров
  const [hasIncrementedViews, setHasIncrementedViews] = useState(false);

  // Состояния для глав
  const [chaptersPage, setChaptersPage] = useState(1);
  const [hasMoreChapters, setHasMoreChapters] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Wrap data in useMemo to prevent useMemo dependency warning
  const processedTitleData = useMemo(
    () => titleDataRaw || null,
    [titleDataRaw]
  );

  // Use paginated chapters API instead of loading all chapters upfront
  const {
    data: chaptersData,
    isLoading: chaptersLoading,
    error: chaptersError,
  } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: chaptersPage,
      limit: 25, // Load 25 chapters per page
      sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
    },
    {
      skip: activeTab !== 'chapters', // Only load when chapters tab is active
    }
  );

  const processedChaptersData = useMemo(
    () => chaptersData?.chapters || [],
    [chaptersData]
  );

  // Update hasMoreChapters based on API response
  useEffect(() => {
    if (chaptersData) {
      setHasMoreChapters(chaptersData.hasMore);
    }
  }, [chaptersData]);

  // Simplify isAdmin state usage
  const isAdmin = user?.role == "admin";

  const isLoading = titleLoading;
  // Suppress error if user not authorized
  const error =
    !user && titleError ? null : titleError ? "Ошибка загрузки данных" : null;

  // SEO для страницы тайтла
  useSEO(seoConfigs.title(processedTitleData || {}));

  // Загрузка данных тайтла
  useEffect(() => {
    if (processedTitleData && !hasIncrementedViews) {
      // Увеличиваем счётчик просмотров только один раз
      incrementViews(titleId);
      setHasIncrementedViews(true);
    }
  }, [processedTitleData, incrementViews, titleId, hasIncrementedViews]);

  // Сброс флага при изменении titleId
  useEffect(() => {
    setHasIncrementedViews(false);
  }, [titleId]);

  // Load more chapters using server-side pagination
  const loadMoreChapters = useCallback(() => {
    if (!chaptersLoading && hasMoreChapters) {
      setChaptersPage(prev => prev + 1);
    }
  }, [chaptersLoading, hasMoreChapters]);

  // Reset pagination when tab changes
  useEffect(() => {
    if (activeTab === "chapters") {
      setChaptersPage(1);
    }
  }, [activeTab]);

  // Обработчики
  const handleLoadMoreChapters = () => {
    if (hasMoreChapters && !chaptersLoading) {
      setChaptersPage(prev => prev + 1);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setChaptersPage(1);
  };

  const handleSortChange = (order: 'desc' | 'asc') => {
    setSortOrder(order);
    setChaptersPage(1);
  };

  const handleBookmark = () => {
    // BookmarkButton теперь сам управляет добавлением/удалением закладок
    // Эта функция может использоваться для дополнительной логики, например аналитики
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: processedTitleData?.name,
        text: processedTitleData?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Ссылка скопирована в буфер обмена");
    }
  };

  // Проверка на взрослый контент
  const isAdultContent = processedTitleData?.isAdult && !user;

  // Состояния загрузки и ошибок
  if (isLoading) return <LoadingState />;
  if (error || !processedTitleData)
    return <ErrorState error={error || "Тайтл не найден"} titleId={titleId} />;

  if (isAdultContent) {
    return <AdultContentWarning titleData={processedTitleData} />;
  }

  return (
    <main className="min-h-screen relative">
      {/* Размытый фон */}
      {processedTitleData?.coverImage && (
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${
              process.env.NEXT_PUBLIC_URL + processedTitleData.coverImage
            })`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 backdrop-blur-3xl bg-black/30"></div>
        </div>
      )}

      {/* Overlay для улучшения читаемости */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/40 z-10"></div>

      {/* Контент */}
      <div className="relative z-20">
        <Header />
        <div className="max-w-7xl mx-auto px-2 py-4 pb-20 md:pb-4">
          {/* Мобильная версия - обложка сверху */}
          <div className="lg:hidden mb-6">
            <div className="flex relative w-max h-max justify-center items-center mx-auto rounded-xl overflow-hidden shadow-2xl">
              {processedTitleData?.coverImage ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_URL}${processedTitleData.coverImage}`}
                  alt={processedTitleData?.name}
                  width={280}
                  height={420}
                  unoptimized={true}
                  className="object-cover"
                  priority
                  sizes="(max-width: 280px) 100vw, 33vw"
                />
              ) : (
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full" />
              )}
            </div>

            {/* Мобильные кнопки действий */}
            <div className="flex justify-center gap-4 mt-4 rounded-full">
              <ReadButton
                titleData={processedTitleData}
                chapters={processedChaptersData}
                className="flex-1 text-sm"
              />
              <BookmarkButton titleId={titleId} initialBookmarked={false} />
              <button
                onClick={handleShare}
                className="p-4 bg-[var(--secondary)] rounded-full hover:bg-[var(--secondary)]/80 transition-colors"
                aria-label="Поделиться"
              >
                <ShareIcon className="w-4 h-4 text-[var(--foreground)]" />
              </button>
              {isAdmin && (
                <Link
                  href={`/admin/titles/${titleId}/edit`}
                  className="p-3 bg-[var(--secondary)] rounded-full hover:bg-[var(--secondary)]/80 transition-colors"
                  aria-label="Редактировать"
                >
                  <Edit className="w-5 h-5 text-[var(--foreground)]" />
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Десктопная версия - обложка слева */}
            <div className="hidden lg:block lg:w-1/4">
              <LeftSidebar
                titleData={processedTitleData}
                chapters={processedChaptersData}
                onBookmark={handleBookmark}
                onShare={handleShare}
                isAdmin={isAdmin}
              />
            </div>

            <div className="lg:w-3/4">
              <RightContent
                titleData={processedTitleData}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isDescriptionExpanded={isDescriptionExpanded}
                onDescriptionToggle={() =>
                  setIsDescriptionExpanded(!isDescriptionExpanded)
                }
                chapters={processedChaptersData}
                hasMoreChapters={hasMoreChapters}
                chaptersLoading={chaptersLoading}
                onLoadMoreChapters={handleLoadMoreChapters}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                titleId={titleId}
                user={user as unknown as User | null}
              />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </main>
  );
}

// Улучшенный компонент ошибки с отладочной информацией
function ErrorState({ error, titleId }: { error: string; titleId?: string }) {
  return (
    <main className="min-h-screen relative">
      {/* Размытый фон */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]"></div>

      {/* Overlay для улучшения читаемости */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/40 z-10"></div>

      {/* Контент */}
      <div className="relative z-20">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                {error}
              </h1>
              <p className="text-[var(--muted-foreground)] mb-4">
                ID тайтла: {titleId || "не указан"}
              </p>
              <p className="text-[var(--muted-foreground)] mb-6">
                Проверьте консоль браузера для подробной информации об ошибке
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/admin/titles"
                  className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors"
                >
                  Вернуться к списку тайтлов
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors"
                >
                  Перезагрузить страницу
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </main>
  );
}

// Компонент загрузки (без изменений)
function LoadingState() {
  return (
    <main className="min-h-screen relative">
      {/* Размытый фон */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]"></div>

      {/* Overlay для улучшения читаемости */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/40 z-10"></div>

      {/* Контент */}
      <div className="relative z-20">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
              <p className="text-[var(--muted-foreground)]">
                Загрузка данных тайтла...
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </main>
  );
}

// Компонент предупреждения о взрослом контенте
function AdultContentWarning({ titleData }: { titleData: Title }) {
  return (
    <main className="min-h-screen relative">
      {/* Размытый фон */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-red-900/20 to-red-800/20"></div>

      {/* Overlay для улучшения читаемости */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 z-10"></div>

      {/* Контент */}
      <div className="relative z-20">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center bg-[var(--background)]/90 backdrop-blur-sm border border-red-500/50 rounded-lg p-8 max-w-md">
              <div className="bg-red-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-2xl font-bold">18+</span>
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                Контент для взрослых
              </h1>
              <p className="text-[var(--muted-foreground)] mb-6">
                Этот тайтл содержит контент для взрослых. Для просмотра необходимо авторизоваться.
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/auth/login"
                  className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors"
                >
                  Войти
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors"
                >
                  На главную
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </main>
  );
}
