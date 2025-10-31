"use client";

import { Footer, Header } from "@/widgets";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/index";
import { Title, Chapter } from "@/types/title";
import { useParams } from "next/navigation";
import {
  LeftSidebar,
  RightContent,
} from "@/shared/browse/title-view";

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

    const data = await response.json();
    return data;
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

  const [titleData, setTitleData] = useState<Title | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояния для глав
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersPage, setChaptersPage] = useState(1);
  const [hasMoreChapters, setHasMoreChapters] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Состояния UI
  const [activeTab, setActiveTab] = useState<
    "description" | "chapters" | "comments" | "statistics"
  >("description");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAdmin, ] = useState(true);

  // Загрузка данных тайтла
  useEffect(() => {
    const loadData = async () => {
      if (!titleId) {
        const errorMsg = "ID тайтла не указан";
        console.error("❌", errorMsg);
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const loadedTitleData = existingTitle || (await loadTitleData(titleId));

        if (loadedTitleData) {
          const processedData = {
            ...loadedTitleData,
            ageLimit: Number(loadedTitleData.ageLimit) || 0,
            releaseYear:
              Number(loadedTitleData.releaseYear) || new Date().getFullYear(),
            views: Number(loadedTitleData.views) || 0,
            totalChapters: Number(loadedTitleData.totalChapters) || 0,
            rating: Number(loadedTitleData.rating) || 0,
          };
          setTitleData(processedData);
        } else {
          const errorMsg = "Тайтл не найден";
          console.error("❌", errorMsg);
          setError(errorMsg);
        }
      } catch (err) {
        const errorMsg = "Ошибка при загрузке данных тайтла";
        console.error("❌ Error in loadData:", err);
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [titleId, existingTitle]);

  // Загрузка глав
  const loadChapters = useCallback(
    (page: number, search: string = "", append: boolean = false) => {
      if (chaptersLoading) return;
      setChaptersLoading(true);
      try {
        const source = (titleData?.chapters as unknown as Chapter[]) || [];
        const result = filterAndPaginateChapters(source, page, 25, search);

        if (append) {
          setChapters((prev) => [...prev, ...result.chapters]);
        } else {
          setChapters(result.chapters);
        }
        setHasMoreChapters(result.hasMore);
      } finally {
        setChaptersLoading(false);
      }
    },
    [chaptersLoading, titleData]
  );

  // Первоначальная загрузка глав
  useEffect(() => {
    if (activeTab === "chapters") {
      setChapters([]);
      setChaptersPage(1);
      loadChapters(1, searchQuery, false);
    }
  }, [activeTab, searchQuery, loadChapters, titleData]);

  // Обработчики
  const handleLoadMoreChapters = () => {
    if (hasMoreChapters && !chaptersLoading) {
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
    console.log("Add to bookmarks");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: titleData?.name,
        text: titleData?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Ссылка скопирована в буфер обмена");
    }
  };

  // Состояния загрузки и ошибок
  if (isLoading) return <LoadingState />;
  if (error || !titleData)
    return <ErrorState error={error || "Тайтл не найден"} titleId={titleId} />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="sm:col-span-1">
            <LeftSidebar
              titleData={titleData}
              onBookmark={handleBookmark}
              onShare={handleShare}
              isAdmin={isAdmin}
            />
          </div>

          <div className="sm:col-span-3">
            <RightContent
              titleData={titleData}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isDescriptionExpanded={isDescriptionExpanded}
              onDescriptionToggle={() =>
                setIsDescriptionExpanded(!isDescriptionExpanded)
              }
              chapters={chapters}
              hasMoreChapters={hasMoreChapters}
              chaptersLoading={chaptersLoading}
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
