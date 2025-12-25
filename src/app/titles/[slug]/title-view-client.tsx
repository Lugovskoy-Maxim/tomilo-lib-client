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
import { AgeVerificationModal } from "@/shared/modal/age-verification-modal";

export default function TitleViewClient({
  slug,
}: {
  slug: string;
}) {
  const { user } = useAuth();
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);

  // Получаем данные тайтла по slug
  const {
    data: titleData,
    isLoading: titleLoading,
    error: titleError,
  } = useGetTitleBySlugQuery({ slug, includeChapters: true });

  const titleId = titleData?._id as string;

  // RTK Query hooks - загружаем главы с пагинацией
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreChapters, setHasMoreChapters] = useState(true);

  const [incrementViews] = useIncrementViewsMutation();

  // Load chapters with pagination
  const {
    data: chaptersData,
    isLoading: chaptersLoading,
    error: chaptersError,
    isFetching,
  } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: currentPage,
      limit: 100, // Load 100 chapters per page
      sortOrder,
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

  // Эффект для обновления состояния hasMoreChapters
  useEffect(() => {
    if (chaptersData) {
      setHasMoreChapters(chaptersData.hasMore);
    }
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
    setCurrentPage(1); // Сброс на первую страницу при изменении сортировки
  };

  // Обработчик загрузки еще глав
  const handleLoadMoreChapters = () => {
    if (hasMoreChapters && !isFetching) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Эффект для автоматической загрузки еще глав при прокрутке
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
        handleLoadMoreChapters();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMoreChapters, isFetching]);

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

  // Определяем тип тайтла для хлебных крошек
  const titleType = titleData.type || 'other';
  const typeLabels: Record<string, string> = {
    'manga': 'Манга',
    'manhwa': 'Манхва',
    'manhua': 'Маньхуа',
    'novel': 'Ранобэ',
    'light_novel': 'Лайт-новелла',
    'comic': 'Комикс',
    'other': 'Другое'
  };
  const typeLabel = typeLabels[titleType] || 'Другое';

  return (
    <main className="relative min-h-screen bg-[var(--background)]">
      {/* Микроразметка BreadcrumbList в формате JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Tomilo-lib.ru",
                "item": "https://tomilo-lib.ru"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": typeLabel,
                "item": `https://tomilo-lib.ru/titles?type=${titleType}`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": titleData.name,
                "item": `https://tomilo-lib.ru/titles/${titleData.slug}`
              }
            ]
          })
        }}
      />
      <Header />
      <div className="container mx-auto px-4 lg:py-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <MobileCover
            titleData={titleData}
            chapters={allChaptersData?.chapters || processedChaptersData}
            onShare={handleShare}
            isAdmin={displayIsAdmin}
            onAgeVerificationRequired={() => setIsAgeModalOpen(true)}
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
                  onAgeVerificationRequired={() => setIsAgeModalOpen(true)}
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
                hasMoreChapters={hasMoreChapters}
                chaptersLoading={chaptersLoading}
                onLoadMoreChapters={handleLoadMoreChapters}
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
      
      {/* Модальное окно для подтверждения возраста */}
      <AgeVerificationModal
        isOpen={isAgeModalOpen}
        onConfirm={() => {
          setIsAgeModalOpen(false);
          // После подтверждения возраста, можно продолжить действие, которое требовало подтверждения
          console.log("Возраст подтвержден");
        }}
        onCancel={() => setIsAgeModalOpen(false)}
      />
    </main>
  );
}
