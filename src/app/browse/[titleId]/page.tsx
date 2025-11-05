"use client";

import { Footer, Header } from "@/widgets";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/index";
import { Title, Chapter } from "@/types/title";
import { useParams } from "next/navigation";
import { useIncrementViewsMutation, useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { useGetChaptersByTitleQuery } from "@/store/api/chaptersApi";
import {
  LeftSidebar,
  RightContent,
} from "@/shared/browse/title-view";
import { ContinueReadingButton } from "@/shared/continue-reading-button";

// Конфигурация API
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
};

// Улучшенная загрузка данных с отладкой
async function loadTitleData(id: string): Promise<Title | null> {
  try {
    const url = `${API_CONFIG.baseUrl}/titles/${id}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error("❌ HTTP Error:", response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // Проверяем, есть ли у ответа обертка ApiResponseDto
    if (result && typeof result === 'object' && 'success' in result) {
      // Если это объект ApiResponseDto, извлекаем данные
      if (result.success && result.data) {
        return result.data;
      }
    } else if (result && typeof result === 'object' && '_id' in result) {
      // Если это объект Title без обертки ApiResponseDto
      return result;
    }
    // В других случаях возвращаем null
    return null;
  } catch (error) {
    console.error("❌ Error loading title:", error);
    return null;
  }
}

// Клиентская фильтрация и пагинация глав из titleData
function filterAndPaginateChapters(
  allChapters: Chapter[] = [],
  page: number,
  limit: number,
  search: string
): { chapters: Chapter[]; total: number; hasMore: boolean } {
  const normalized = (search || "").trim().toLowerCase();
  let filtered = allChapters;

  if (normalized) {
    filtered = allChapters.filter((ch) => {
      const numberMatch = String(ch.chapterNumber).includes(normalized);
      const titleText = (ch.title || "").toLowerCase();
      const titleMatch = titleText.includes(normalized);
      const comboMatch = `глава ${ch.chapterNumber} ${ch.title || ""}`
        .toLowerCase()
        .includes(normalized);
      return numberMatch || titleMatch || comboMatch;
    });
  }

  // Сортировка по номеру главы по убыванию
  filtered = [...filtered].sort((a, b) => b.chapterNumber - a.chapterNumber);

  const start = (page - 1) * limit;
  const end = start + limit;
  const pageItems = filtered.slice(start, end);
  return {
    chapters: pageItems,
    total: filtered.length,
    hasMore: end < filtered.length,
  };
}

export default function TitleViewPage() {
  const params = useParams();
  const titleId = params.titleId as string;

  const titlesState = useSelector((state: RootState) => state.titles);
  const existingTitle = titlesState.titles?.find((t) => t._id === titleId);

  // RTK Query hooks
  const { data: titleData, isLoading: titleLoading, error: titleError } = useGetTitleByIdQuery(titleId);
  const { data: chaptersData, isLoading: chaptersLoading } = useGetChaptersByTitleQuery({ titleId });

  const [incrementViews] = useIncrementViewsMutation();

  // Состояния для глав
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersPage, setChaptersPage] = useState(1);
  const [hasMoreChapters, setHasMoreChapters] = useState(true);
  const [chaptersLoadingState, setChaptersLoadingState] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Состояния UI
  const [activeTab, setActiveTab] = useState<
    "description" | "chapters" | "comments" | "statistics"
  >("chapters");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAdmin, ] = useState(true);

  // Обработка данных из RTK Query
  const processedTitleData = titleData?.data || null;
  const processedChaptersData = chaptersData || [];

  const isLoading = titleLoading || chaptersLoading;
  const error = titleError ? "Ошибка загрузки данных" : null;

  // Загрузка данных тайтла
  useEffect(() => {
    if (processedTitleData) {
      // Увеличиваем счётчик просмотров
      incrementViews(titleId);
    }
  }, [processedTitleData, incrementViews, titleId]);

  // Загрузка глав
  const loadChapters = useCallback(
    (page: number, search: string = "", append: boolean = false) => {
      if (chaptersLoadingState) return;
      setChaptersLoadingState(true);
      try {
        const source = processedChaptersData;
        const result = filterAndPaginateChapters(source, page, 25, search);

        if (append) {
          setChapters((prev) => [...prev, ...result.chapters]);
        } else {
          setChapters(result.chapters);
        }
        setHasMoreChapters(result.hasMore);
      } finally {
        setChaptersLoadingState(false);
      }
    },
    [chaptersLoadingState, processedChaptersData]
  );

  // Первоначальная загрузка глав
  useEffect(() => {
    if (activeTab === "chapters" && processedChaptersData.length > 0) {
      setChapters([]);
      setChaptersPage(1);
      loadChapters(1, searchQuery, false);
    }
  }, [activeTab, searchQuery, loadChapters, processedChaptersData]);

  // Обработчики
  const handleLoadMoreChapters = () => {
    if (hasMoreChapters && !chaptersLoadingState) {
      const nextPage = chaptersPage + 1;
      setChaptersPage(nextPage);
      loadChapters(nextPage, searchQuery, true);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setChaptersPage(1);
  };

  const handleBookmark = () => {
    // BookmarkButton теперь сам управляет добавлением/удалением закладок
    // Эта функция может использоваться для дополнительной логики, например аналитики
    console.log("Bookmark button clicked");
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

  // Состояния загрузки и ошибок
  if (isLoading) return <LoadingState />;
  if (error || !processedTitleData)
    return <ErrorState error={error || "Тайтл не найден"} titleId={titleId} />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="sm:col-span-1">
            <LeftSidebar
              titleData={processedTitleData}
              chapters={chapters}
              onBookmark={handleBookmark}
              onShare={handleShare}
              isAdmin={isAdmin}
            />
          </div>

          <div className="sm:col-span-3">
            <div className="mb-4">
              <ContinueReadingButton />
            </div>
            <RightContent
              titleData={processedTitleData}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isDescriptionExpanded={isDescriptionExpanded}
              onDescriptionToggle={() =>
                setIsDescriptionExpanded(!isDescriptionExpanded)
              }
              chapters={chapters}
              hasMoreChapters={hasMoreChapters}
              chaptersLoading={chaptersLoadingState}
              onLoadMoreChapters={handleLoadMoreChapters}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              titleId={titleId}
            />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

// Улучшенный компонент ошибки с отладочной информацией
function ErrorState({ error, titleId }: { error: string; titleId?: string }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
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
    </main>
  );
}

// Компонент загрузки (без изменений)
function LoadingState() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
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
    </main>
  );
}
