"use client";

import { Footer, Header } from "@/widgets";
import { Share, Edit } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Title } from "@/types/title";
import { User } from "@/types/auth";

import { useIncrementViewsMutation} from "@/store/api/titlesApi";
import { useGetChaptersByTitleQuery } from "@/store/api/chaptersApi";
import { useGetReadingHistoryByTitleQuery } from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { ReadButton } from "@/shared/browse/read-button";
import { BookmarkButton } from "@/shared/bookmark-button";
import LoadingState from "./loading";
import ErrorState from "./error";
import AdultContentWarning from "./adult";
import { checkAgeVerification } from "@/shared/modal/age-verification-modal";
import { LeftSidebar, RightContent } from "@/shared/browse/title-view";

export default function TitleViewClient({
  initialTitleData,
}: {
  initialTitleData: Title;
}) {
  const titleId = initialTitleData._id as string;
  const { user } = useAuth();

  // Используем initialTitleData напрямую, без дополнительных запросов
  const processedTitleData = useMemo(
    () => initialTitleData,
    [initialTitleData]
  );

  // RTK Query hooks - загружаем главы с пагинацией
  const [chaptersPage, setChaptersPage] = useState(1);
  const [hasMoreChapters, setHasMoreChapters] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [incrementViews] = useIncrementViewsMutation();

  // Use paginated chapters API for display, but load all chapters for ReadButton
  const {
    data: chaptersData,
    isLoading: chaptersLoading,
    error: chaptersError,
  } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: chaptersPage,
      limit: 50, // Load 50 chapters per page for display
      sortOrder: sortOrder === "desc" ? "desc" : "asc",
    },
    {
      skip: false, // Всегда загружаем главы для отображения
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
    titleId as string,
    { skip: !titleId }
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

  // Состояния UI
  const [activeTab, setActiveTab] = useState<
    "description" | "chapters" | "comments" | "statistics"
  >("chapters");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isClient, setIsClient] = useState(false); // Для предотвращения гидрационных ошибок

  // Флаг для предотвращения множественных инкрементов просмотров
  const [hasIncrementedViews, setHasIncrementedViews] = useState(false);

  // Simplify isAdmin state usage
  const isAdmin = user?.role == "admin";

  const isLoading = false; // Убираем состояние загрузки, так как данные уже есть
  const error = null; // Убираем состояние ошибки, так как данные уже есть

  // Устанавливаем isClient в true после монтирования
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Reset pagination when tab changes
  useEffect(() => {
    if (activeTab === "chapters") {
      setChaptersPage(1);
    }
  }, [activeTab]);

  // Обработчики
  const handleLoadMoreChapters = () => {
    if (hasMoreChapters && !chaptersLoading) {
      setChaptersPage((prev) => prev + 1);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setChaptersPage(1);
  };

  const handleSortChange = (order: "desc" | "asc") => {
    setSortOrder(order);
    setChaptersPage(1);
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
    return <AdultContentWarning />;
  }

  // Для предотвращения гидрационной ошибки, показываем одинаковый контент на сервере и клиенте
  const displayIsAdmin = isClient ? isAdmin : false;

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
                chapters={allChaptersData?.chapters || processedChaptersData}
                className="flex-1 text-sm"
                onAgeVerificationRequired={() => setShowAgeModal(true)}
              />
              <BookmarkButton titleId={titleId} initialBookmarked={false} />
              <button
                onClick={handleShare}
                className="p-4 bg-[var(--secondary)] rounded-full hover:bg-[var(--secondary)]/80 transition-colors"
                aria-label="Поделиться"
              >
                <Share className="w-4 h-4 text-[var(--foreground)]" />
              </button>
              {displayIsAdmin && (
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
                chapters={allChaptersData?.chapters || processedChaptersData}
                readingHistory={readingHistoryData?.data}
                onShare={handleShare}
                isAdmin={displayIsAdmin}
                onAgeVerificationRequired={() => setShowAgeModal(true)}
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
