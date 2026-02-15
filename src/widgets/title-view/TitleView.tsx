"use client";

import { Footer, Header } from "@/widgets";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { translateTitleType } from "@/lib/title-type-translations";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";

import { useIncrementViewsMutation, useGetTitleBySlugQuery } from "@/store/api/titlesApi";
import { useGetChaptersByTitleQuery } from "@/store/api/chaptersApi";
import { useAuth } from "@/hooks/useAuth";
import LoadingState from "@/shared/profile/ProfileLoading";
import ErrorState from "@/shared/error-state/ErrorState";
import MobileCover from "@/shared/browse/title-view/MobileCover";
import { LeftSidebar } from "@/shared/browse/title-view/LeftSidebar";
import { RightContent } from "@/shared/browse/title-view/RightContent";
import { AgeVerificationModal } from "@/shared/modal/AgeVerificationModal";
import { ReportModal } from "@/shared/report/ReportModal";

export default function TitleView({ slug: slugProp }: { slug: string }) {
  const params = useParams();
  const slug = (typeof params?.slug === "string" ? params.slug : slugProp) ?? slugProp;
  const { user } = useAuth();
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalData, setReportModalData] = useState<{
    entityType: "title" | "chapter";
    entityId: string;
    entityTitle: string;
    titleId?: string;
    creatorId?: string;
  } | null>(null);

  // Получаем данные тайтла по slug
  const {
    data: titleData,
    isLoading: titleLoading,
    error: titleError,
  } = useGetTitleBySlugQuery(
    { slug, includeChapters: true },
    { skip: !slug },
  );

  const titleId = titleData?._id as string;

  // RTK Query hooks - загружаем все главы сразу
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [incrementViews] = useIncrementViewsMutation();

  // Load all chapters - try multiple pages if needed
  const { data: chaptersData, isLoading: chaptersLoading } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: 1,
      limit: 10000, // Use backend's max limit per page
      sortOrder,
    },
    {
      skip: !titleId, // Skip if no titleId
    },
  );

  // Load additional pages if there are more chapters
  const { data: chaptersDataPage2 } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: 2,
      limit: 100,
      sortOrder,
    },
    {
      skip: !titleId || !chaptersData?.hasMore,
    },
  );

  const { data: chaptersDataPage3 } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: 3,
      limit: 100,
      sortOrder,
    },
    {
      skip: !titleId || !chaptersDataPage2?.hasMore,
    },
  );

  const { data: chaptersDataPage4 } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: 4,
      limit: 100,
      sortOrder,
    },
    {
      skip: !titleId || !chaptersDataPage3?.hasMore,
    },
  );

  const { data: chaptersDataPage5 } = useGetChaptersByTitleQuery(
    {
      titleId,
      page: 5,
      limit: 100,
      sortOrder,
    },
    {
      skip: !titleId || !chaptersDataPage4?.hasMore,
    },
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
    },
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
    },
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
    },
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
    },
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
    },
  );

  // Обработка данных глав - комбинируем все загруженные страницы
  const processedChaptersData = useMemo(() => {
    const allChapters = [
      ...(chaptersData?.chapters || []),
      ...(chaptersDataPage2?.chapters || []),
      ...(chaptersDataPage3?.chapters || []),
      ...(chaptersDataPage4?.chapters || []),
      ...(chaptersDataPage5?.chapters || []),
    ];

    // Сортируем по chapterNumber в порядке убывания (новые главы сверху)
    return allChapters.sort((a, b) => {
      const aNum = a.chapterNumber || 0;
      const bNum = b.chapterNumber || 0;
      return bNum - aNum; // desc order
    });
  }, [chaptersData, chaptersDataPage2, chaptersDataPage3, chaptersDataPage4, chaptersDataPage5]);

  // Состояние для активной вкладки
  const [activeTab, setActiveTab] = useState<"main" | "chapters" | "comments">("chapters");

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

  // Показываем состояние загрузки с плавным переходом
  if (titleLoading || (chaptersLoading && processedChaptersData.length === 0)) {
    return (
      <main className="relative min-h-screen">
        <div className="fixed inset-0 -z-5 bg-[var(--background)]" />
        <Header />
        <div className="container mx-auto px-4 lg:py-8 pb-20">
          <div className="max-w-7xl mx-auto title-page-container p-6 lg:p-8">
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
                    <div key={i} className="h-12 rounded-full bg-[var(--secondary)] animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
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
          <ErrorState title="Тайтл не найден" message="Запрашиваемый тайтл не существует или был удалён" />
        </main>
        <Footer />
      </>
    );
  }

  // Определяем тип тайтла для хлебных крошек
  const titleType = titleData.type || "other";
  const typeLabels: Record<string, string> = {
    manga: "Манга",
    manhwa: "Манхва",
    manhua: "Маньхуа",
    novel: "Ранобэ",
    light_novel: "Лайт-новелла",
    comic: "Комикс",
    other: "Другое",
  };

  const typeLabel = typeLabels[titleType] || "Другое";
  const translatedType = translateTitleType(titleType);
  const titleWithType = `${titleData.name} - ${translatedType ? ` ${translatedType}` : ""}`;

  // Формируем полный URL для изображения
  const image = titleData.coverImage
    ? `${window.location.origin}${titleData.coverImage}`
    : undefined;

  // Формируем URL обложки для фона
  const coverImageUrl = titleData.coverImage
    ? `${process.env.NEXT_PUBLIC_URL}${titleData.coverImage}`
    : null;

  return (
    <main className="relative min-h-screen">
      {/* Заблюренный фон обложки на весь экран - только в темной теме */}
      {coverImageUrl && (
        <div
          className="fixed inset-0 -z-10 data-[theme=dark]:opacity-40 data-[theme=dark]:blur-xl data-[theme=dark]:bg-cover data-[theme=dark]:bg-center pointer-events-none"
          style={{
            backgroundImage: `url(${coverImageUrl})`,
          }}
          data-theme="dark"
        />
      )}

      {/* Градиент для лучшей читаемости контента */}
      <div className="fixed inset-0 -z-5 bg-gradient-to-b from-[var(--background)]/70 via-[var(--background)]/40 to-[var(--background)] pointer-events-none" />

      {/* Микроразметка BreadcrumbList в формате JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Tomilo-lib.ru",
                item: "https://tomilo-lib.ru",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: typeLabel,
                item: `https://tomilo-lib.ru/titles?type=${titleType}`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: titleData.name,
                item: `https://tomilo-lib.ru/titles/${titleData.slug}`,
              },
            ],
          }),
        }}
      />

      {/* Структурированная разметка ComicSeries для поисковых систем */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ComicSeries",
            name: titleData.name,
            description: titleData.description
              ? titleData.description.replace(/<[^>]*>/g, "").substring(0, 500)
              : `Читать ${titleWithType} онлайн на Tomilo-lib.ru`,
            image: image,
            author: titleData.author
              ? { "@type": "Person", name: titleData.author }
              : undefined,
            publisher: {
              "@type": "Organization",
              name: "Tomilo-lib.ru",
              url: "https://tomilo-lib.ru",
            },
            genre: titleData.genres?.join(", "),
            url: `https://tomilo-lib.ru/titles/${titleData.slug}`,
            datePublished: titleData.createdAt,
            dateModified: titleData.updatedAt,
          }),
        }}
      />

      {/* Дополнительная разметка Article для совместимости */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type":
              titleData.type === "novel" || titleData.type === "light_novel" ? "Book" : "Article",
            headline: titleWithType,
            description: titleData.description
              ? titleData.description.replace(/<[^>]*>/g, "").substring(0, 500)
              : `Читать ${titleWithType} онлайн на Tomilo-lib.ru`,
            image: image,
            author: {
              "@type": "Person",
              name: titleData.author || "Неизвестен",
            },
            publisher: {
              "@type": "Organization",
              name: "Tomilo-lib.ru",
              logo: {
                "@type": "ImageObject",
                url: "https://tomilo-lib.ru/logo/tomilo_color.svg",
                width: 200,
                height: 60,
              },
            },

            datePublished: titleData.createdAt,
            dateModified: titleData.updatedAt,
            keywords: [
              titleData.name,
              ...(titleData.genres || []),
              titleData.author,
              "манга",
              "маньхуа",
              "манхва",
              "комиксы",
              "онлайн чтение",
            ]
              .filter(Boolean)
              .join(", "),
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://tomilo-lib.ru/titles/${titleData.slug}`,
            },
            url: `https://tomilo-lib.ru/titles/${titleData.slug}`,
            wordCount: titleData.description
              ? titleData.description.replace(/<[^>]*>/g, "").split(" ").length
              : 0,
            inLanguage: "ru",
            about:
              titleData.genres?.map(genre => ({
                "@type": "Thing",
                name: genre,
              })) || [],

            contentRating: titleData.rating || "general",
            ...(titleData.type === "novel" || titleData.type === "light_novel"
              ? {
                  bookFormat: "EBook",
                  numberOfPages: processedChaptersData?.length || 0,
                }
              : {
                  articleSection: titleData.type,
                }),
          }),
        }}
      />
      <Header />
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-7xl mx-auto pt-8">
          <Breadcrumbs
            items={[
              { name: "Главная", href: "/" },
              { name: "Каталог", href: "/titles" },
              { name: titleData.name, isCurrent: true },
            ]}
          />
        </div>
        <div className="max-w-7xl mx-auto">
          <MobileCover
            titleData={titleData}
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
            onTabChange={setActiveTab}
          />

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Десктопная версия - sticky обложка слева */}
            <div className="hidden lg:block lg:w-1/4 pt-8">
              <div className="sticky top-24">
                <LeftSidebar
                  titleData={titleData}
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
                  onReportClick={data => {
                    setReportModalData(data);
                    setIsReportModalOpen(true);
                  }}
                />
              </div>
            </div>

            <div className="w-full lg:w-3/4">
              <RightContent
                titleData={titleData}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isDescriptionExpanded={isDescriptionExpanded}
                onDescriptionToggle={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
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
          creatorId={reportModalData.creatorId}
        />
      )}
    </main>
  );
}
