"use client";

import { Footer, Header } from "@/widgets";
import { useState, useEffect, useMemo } from "react";
import { Title } from "@/types/title";

import {
  useIncrementViewsMutation,
  useGetTitleBySlugQuery,
} from "@/store/api/titlesApi";
import { useGetChaptersByTitleQuery } from "@/store/api/chaptersApi";
import { useGetReadingHistoryByTitleQuery } from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";
import LoadingState from "./loading";
import ErrorState from "./error";
import MobileCover from "@/shared/browse/title-view/mobile-cover";
import { LeftSidebar } from "@/shared/browse/title-view/left-sidebar";
import { RightContent } from "@/shared/browse/title-view/right-content";
import { AgeVerificationModal } from "@/shared/modal/age-verification-modal";

export default function TitleViewClient({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);

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
      sortOrder,
    },
    {
      skip: !titleId, // Skip if no titleId
    }
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
    }
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
    }
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
    }
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
    { skip: !user || !titleId }
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
  }, [
    chaptersData,
    chaptersDataPage2,
    chaptersDataPage3,
    chaptersDataPage4,
    chaptersDataPage5,
  ]);

  // Проверяем, есть ли еще главы для загрузки
  const hasMoreChapters = useMemo(() => {
    return (
      chaptersData?.hasMore ||
      chaptersDataPage2?.hasMore ||
      chaptersDataPage3?.hasMore ||
      chaptersDataPage4?.hasMore ||
      chaptersDataPage5?.hasMore ||
      false
    );
  }, [
    chaptersData?.hasMore,
    chaptersDataPage2?.hasMore,
    chaptersDataPage3?.hasMore,
    chaptersDataPage4?.hasMore,
    chaptersDataPage5?.hasMore,
  ]);

  // Функция для загрузки дополнительных глав (заглушка, так как мы загружаем все сразу)
  const handleLoadMoreChapters = () => {
    // Все главы уже загружены автоматически
  };

  // Состояние для активной вкладки
  const [activeTab, setActiveTab] = useState<"main" | "chapters" | "comments">(
    "main"
  );

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

  // Определяем тип контента для микроразметки
  const contentType =
    titleData.type === "novel" || titleData.type === "light_novel"
      ? "Book"
      : "Article";

  // Формируем полный URL для изображения
  const image = titleData.coverImage
    ? `${window.location.origin}${titleData.coverImage}`
    : undefined;

  return (
    <main className="relative min-h-screen bg-[var(--background)]">
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

      {/* Структурированная разметка Article для поисковых систем */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            // "@type": contentType === "Book" ? "Book" : "Article",
            headline: titleData.name,
            description: titleData.description
              ? titleData.description.replace(/<[^>]*>/g, "").substring(0, 500)
              : `Читать ${titleData.name} онлайн на Tomilo-lib.ru`,
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
              titleData.genres?.map((genre) => ({
                "@type": "Thing",
                name: genre,
              })) || [],

            contentRating: titleData.rating || "general",
            ...(titleData.type === "novel" || titleData.type === "light_novel"
              ? {
                  bookFormat: "EBook",
                  numberOfPages: processedChaptersData?.length || 0,
                  "@type": "Book",
                }
              : {
                  articleSection: titleData.type,
                  wordCount: titleData.description
                    ? titleData.description.replace(/<[^>]*>/g, "").split(" ")
                        .length
                    : 0,
                  "@type": "Article",
                }),
          }),
        }}
      />
      <Header />
      <div className="container mx-auto px-4 lg:py-8 pb-20">
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
          />

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Десктопная версия - sticky обложка слева */}
            <div className="hidden lg:block lg:w-1/4">
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
