"use client";

import { Footer, Header } from "@/widgets";
import { useState, useEffect, useMemo } from "react";
import { Title } from "@/types/title";

import { useIncrementViewsMutation } from "@/store/api/titlesApi";
import { useGetChaptersByTitleQuery } from "@/store/api/chaptersApi";
import { useGetReadingHistoryByTitleQuery } from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";
import LoadingState from "./loading";
import ErrorState from "./error";
// import { LeftSidebar, RightContent } from "@/shared/browse/title-view";
import MobileCover from "@/shared/browse/title-view/mobile-cover";
import { LeftSidebar } from "@/shared/browse/title-view/left-sidebar";
import { RightContent } from "@/shared/browse/title-view/right-content";
import { AgeVerificationModal } from "@/shared/modal/age-verification-modal";

export default function TitleViewClient({
  initialTitleData,
}: {
  initialTitleData: Title;
}) {
  const titleId = initialTitleData._id as string;
  const { user } = useAuth();
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);

  // Используем initialTitleData напрямую, без дополнительных запросов
  const processedTitleData = useMemo(
    () => initialTitleData,
    [initialTitleData]
  );

  // RTK Query hooks - загружаем все главы сразу
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [incrementViews] = useIncrementViewsMutation();

  // Load all chapters - try multiple pages if needed
  const {
    data: chaptersData,
    isLoading: chaptersLoading,
    error: chaptersError,
  } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: 1,
      limit: 10000, // Use backend's max limit per page
    },
    {
      skip: false,
    }
  );

  // Load additional pages if there are more chapters
  const { data: chaptersDataPage2 } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: 2,
      limit: 100,
    },
    {
      skip: !chaptersData?.hasMore,
    }
  );

  const { data: chaptersDataPage3 } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: 3,
      limit: 100,
    },
    {
      skip: !chaptersDataPage2?.hasMore,
    }
  );

  const { data: chaptersDataPage4 } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: 4,
      limit: 100,
    },
    {
      skip: !chaptersDataPage3?.hasMore,
    }
  );

  const { data: chaptersDataPage5 } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: 5,
      limit: 100,
    },
    {
      skip: !chaptersDataPage4?.hasMore,
    }
  );

  // Load all chapters for ReadButton to ensure correct chapter determination
  const { data: allChaptersData } = useGetChaptersByTitleQuery(
    {
      titleId: titleId as string,
      page: 1,
      limit: 100, // Use backend's max limit per page
      sortOrder: "asc",
    },
    {
      skip: !titleId, // Skip if no titleId
    }
  );

  const { data: allChaptersDataPage2 } = useGetChaptersByTitleQuery(
    {
      titleId: titleId as string,
      page: 2,
      limit: 100,
      sortOrder: "asc",
    },
    {
      skip: !titleId || !allChaptersData?.hasMore,
    }
  );

  const { data: allChaptersDataPage3 } = useGetChaptersByTitleQuery(
    {
      titleId: titleId as string,
      page: 3,
      limit: 100,
      sortOrder: "asc",
    },
    {
      skip: !titleId || !allChaptersDataPage2?.hasMore,
    }
  );

  const { data: allChaptersDataPage4 } = useGetChaptersByTitleQuery(
    {
      titleId: titleId as string,
      page: 4,
      limit: 100,
      sortOrder: "asc",
    },
    {
      skip: !titleId || !allChaptersDataPage3?.hasMore,
    }
  );

  const { data: allChaptersDataPage5 } = useGetChaptersByTitleQuery(
    {
      titleId: titleId as string,
      page: 5,
      limit: 100,
      sortOrder: "asc",
    },
    {
      skip: !titleId || !allChaptersDataPage4?.hasMore,
    }
  );

  // Load reading history for the current title
  const { data: readingHistoryData } = useGetReadingHistoryByTitleQuery(
    titleId,
    { skip: !user }
  );

  // Обработка данных глав
  const processedChaptersData = useMemo(() => {
    if (!chaptersData?.chapters) return [];
    return chaptersData.chapters;
  }, [chaptersData]);

  // Состояние для активной вкладки
  const [activeTab, setActiveTab] = useState<"main" | "chapters" | "comments">(
    "main"
  );

  // Ensure main tab is set immediately on component mount
  useEffect(() => {
    setActiveTab("main");
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
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: processedTitleData?.name,
        text: `Посмотрите тайтл: ${processedTitleData?.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Показываем состояние загрузки
  if (chaptersLoading && processedChaptersData.length === 0) {
    return <LoadingState />;
  }

  // Показываем ошибку
  if (chaptersError) {
    return <ErrorState error={"Ошибка загрузки глав"} titleId={titleId} />;
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Header />
      <div className="container mx-auto px-4 lg:py-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <MobileCover
            titleData={processedTitleData}
            chapters={[
              ...(allChaptersData?.chapters || []),
              ...(allChaptersDataPage2?.chapters || []),
              ...(allChaptersDataPage3?.chapters || []),
              ...(allChaptersDataPage4?.chapters || []),
              ...(allChaptersDataPage5?.chapters || []),
              ...processedChaptersData,
            ]}
            onShare={handleShare}
            isAdmin={displayIsAdmin}
            onAgeVerificationRequired={() => setIsAgeModalOpen(true)}
          />

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Десктопная версия - sticky обложка слева */}
            <div className="hidden lg:block lg:w-1/4">
              <div className="sticky top-24">
                <LeftSidebar
                  titleData={processedTitleData}
                  chapters={allChaptersData?.chapters || processedChaptersData}
                  onShare={handleShare}
                  isAdmin={displayIsAdmin}
                  onAgeVerificationRequired={() => setIsAgeModalOpen(true)}
                />
              </div>
            </div>

            <div className="w-full lg:w-3/4">
              <RightContent
                titleData={processedTitleData}
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
