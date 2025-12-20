"use client";

import { Footer, Header } from "@/widgets";
import { useState, useEffect, useMemo } from "react";
import { Title } from "@/types/title";

import { useIncrementViewsMutation, useGetTitleBySlugQuery } from "@/store/api/titlesApi";
import { useGetChaptersByTitleQuery } from "@/store/api/chaptersApi";
import { useGetReadingHistoryByTitleQuery } from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";
import LoadingState from "./loading";
import ErrorState from "./error";
import MobileCover from "@/shared/browse/title-view/mobile-cover";
import { LeftSidebar } from "@/shared/browse/title-view/left-sidebar";
import { RightContent } from "@/shared/browse/title-view/right-content";

export default function TitleViewClient({
  slug,
}: {
  slug: string;
}) {
  const { user } = useAuth();

  // Получаем данные тайтла по slug
  const {
    data: titleData,
    isLoading: titleLoading,
    error: titleError,
  } = useGetTitleBySlugQuery({ slug, includeChapters: true });

  const titleId = titleData?._id as string;

  // RTK Query hooks - загружаем все главы сразу
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [incrementViews] = useIncrementViewsMutation();

  // Load all chapters at once
  const {
    data: chaptersData,
    isLoading: chaptersLoading,
    error: chaptersError,
  } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: 1,
      limit: 10000, // Load all chapters
    },
    {
      skip: !titleId, // Skip if no titleId
    }
  );

  // Load all chapters for ReadButton to ensure correct chapter determination
  const { data: allChaptersData } = useGetChaptersByTitleQuery(
    {
      titleId: titleId as string,
      page: 1,
      limit: 1000, // Load all chapters for ReadButton
      sortOrder: "asc",
    },
    {
      skip: !titleId, // Skip if no titleId
    }
  );

  // Load reading history for the current title
  const { data: readingHistoryData } = useGetReadingHistoryByTitleQuery(
    titleId,
    { skip: !user || !titleId }
  );

  // Обработка данных глав
  const processedChaptersData = useMemo(() => {
    if (!chaptersData?.chapters) return [];
    return chaptersData.chapters;
  }, [chaptersData]);

  // Состояние для активной вкладки
  const [activeTab, setActiveTab] = useState<
    "main" | "chapters" | "comments" 
  >("main");

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
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: titleData?.name,
        text: `Посмотрите тайтл: ${titleData?.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Показываем состояние загрузки
  if (titleLoading || (chaptersLoading && processedChaptersData.length === 0)) {
    return <LoadingState />;
  }

  // Показываем ошибку
  if (titleError) {
    return <ErrorState error={"Ошибка загрузки тайтла"} slug={slug} />;
  }

  if (!titleData) {
    return <ErrorState error={"Тайтл не найден"} slug={slug} />;
  }

  return (
    <main className="relative min-h-screen bg-[var(--background)]">
      <Header />
      <div className="container mx-auto px-4 lg:py-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <MobileCover
            titleData={titleData}
            chapters={allChaptersData?.chapters || processedChaptersData}
            onShare={handleShare}
            isAdmin={displayIsAdmin}
            onAgeVerificationRequired={() => {}}
          />


          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Десктопная версия - sticky обложка слева */}
            <div className="hidden lg:block lg:w-1/4">
              <div className="sticky top-24">
                <LeftSidebar
                  titleData={titleData}
                  chapters={allChaptersData?.chapters || processedChaptersData}
                  onShare={handleShare}
                  isAdmin={displayIsAdmin}
                  onAgeVerificationRequired={() => {}}
                />
              </div>
            </div>

            <div className="w-full lg:w-3/4">
              <RightContent
                titleData={titleData}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isDescriptionExpanded={isDescriptionExpanded}
                onDescriptionToggle={() =>
                  setIsDescriptionExpanded(!isDescriptionExpanded)
                }
                chapters={processedChaptersData}
                hasMoreChapters={false}
                chaptersLoading={chaptersLoading}
                onLoadMoreChapters={() => {}}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                titleId={titleId}
                user={user}
                // Новые пропсы для формирования ссылок на /titles
                basePath="/titles"
                slug={titleData.slug}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
