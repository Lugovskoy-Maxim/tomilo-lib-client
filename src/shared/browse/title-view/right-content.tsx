import { Title, Chapter } from "@/types/title";
import { User } from "@/types/auth";
import {
  ArrowUpToLine,
  BookOpen,
  Calendar,
  CheckCheck,
  Eye,
  Loader2,
} from "lucide-react";
import { translateTitleType } from "@/lib/title-type-translations";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface RightContentProps {
  titleData: Title;
  activeTab: "description" | "chapters" | "comments" | "statistics";
  onTabChange: (
    tab: "description" | "chapters" | "comments" | "statistics"
  ) => void;
  isDescriptionExpanded: boolean;
  onDescriptionToggle: () => void;
  chapters: Chapter[];
  hasMoreChapters: boolean;
  chaptersLoading: boolean;
  onLoadMoreChapters: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOrder: "desc" | "asc";
  onSortChange: (order: "desc" | "asc") => void;
  titleId: string;
  user: User | null;
}

export function RightContent({
  titleData,
  activeTab,
  onTabChange,
  isDescriptionExpanded,
  onDescriptionToggle,
  chapters,
  hasMoreChapters,
  chaptersLoading,
  onLoadMoreChapters,
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
  titleId,
  user,
}: RightContentProps): React.ReactElement {
  const router = useRouter();
  const [displayedChapters, setDisplayedChapters] = useState<Chapter[]>([]);
  const [visibleChapters, setVisibleChapters] = useState<Chapter[]>([]);
  const [loadedChaptersCount, setLoadedChaptersCount] = useState(20); // Начальное количество отображаемых глав

  useEffect(() => {
    if (searchQuery) {
      // При поиске фильтруем главы по номеру главы
      const filteredChapters = chapters.filter((chapter) => {
        // Извлекаем номер главы из названия (предполагаем формат "Глава N" или просто "N")
        const chapterNumberMatch = chapter.name.match(/(?:Глава\s+)?(\d+)/i);
        const chapterNumber = chapterNumberMatch ? chapterNumberMatch[1] : null;

        // Сравниваем с поисковым запросом
        return chapterNumber === searchQuery.trim();
      });
      setDisplayedChapters(filteredChapters);
      setVisibleChapters(filteredChapters);
      setLoadedChaptersCount(filteredChapters.length); // Показываем все найденные главы
    } else {
      // Без поиска накапливаем главы
      setDisplayedChapters((prev) => {
        const newChapters = chapters.filter(
          (chapter) =>
            !prev.some((prevChapter) => prevChapter._id === chapter._id)
        );
        return [...prev, ...newChapters];
      });
      setLoadedChaptersCount(20); // Сбрасываем количество отображаемых глав
    }
  }, [chapters, searchQuery]);

  // Эффект для постепенной прорисовки глав
  useEffect(() => {
    setVisibleChapters(displayedChapters.slice(0, loadedChaptersCount));
  }, [displayedChapters, loadedChaptersCount]);

  // Сброс отображаемых глав при изменении поискового запроса
  useEffect(() => {
    if (!searchQuery) {
      setVisibleChapters(displayedChapters.slice(0, loadedChaptersCount));
    }
  }, [searchQuery, displayedChapters, loadedChaptersCount]);

  // Обработчик для загрузки дополнительных глав при прокрутке
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - 1000
    ) {
      if (loadedChaptersCount < displayedChapters.length) {
        setLoadedChaptersCount((prev) =>
          Math.min(prev + 10, displayedChapters.length)
        );
      }
    }
  }, [loadedChaptersCount, displayedChapters.length]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const renderTabContent = () => {
    switch (activeTab) {
      case "description":
        return (
          <>
            <div className="rounded-xl p-4">
              <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">
                Полное описание тайтла
              </h2>
              <div>
                {titleData?.altNames && (
                  <span>Альтернативные названия: {titleData.altNames}</span>
                )}
              </div>
            </div>
            <div>Главные герои</div>
            <div>Переводчики</div>
            <div className="flex flex-wrap gap-4 text-sm text-[var(--foreground)]/60 mb-4">
              {titleData?.author && <span>Автор: {titleData.author}</span>}
              {titleData?.artist && <span>Художник: {titleData.artist}</span>}
            </div>
          </>
        );

      case "chapters":
        return (
          <div className="rounded-xl">
            <div className="flex flex-col justify-between bg-[var(--secondary)]/50 backdrop-blur-sm rounded-xl items-center p-4">
              {/* <h2 className="text-xl flex items-start w-full mb-2 font-bold text-[var(--foreground)]">
                Главы
              </h2> */}
              {/* Chapter search and sort controls */}
              <div className="flex w-full flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Поиск глав..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-full text-[var(--foreground)] placeholder-[var(--foreground)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <select
                  value={sortOrder}
                  onChange={(e) =>
                    onSortChange(e.target.value as "desc" | "asc")
                  }
                  className="px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-full text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="desc">Сначала новые</option>
                  <option value="asc">Сначала старые</option>
                </select>
              </div>
            </div>

            {/* Chapters list */}
            <div className="space-y-2 mt-2">
              {visibleChapters.map((chapter) => (
                <div
                  key={chapter._id}
                  className="flex items-center justify-between gap-2 py-2 px-3 bg-[var(--card)]/50 rounded-full hover:bg-[var(--background)]/70 transition-colors"
                >
                  {/* Иконка статуса прочтения */}
                  <Eye className="w-5 h-5 text-[var(--primary)]" />
                  <div className="flex-1">
                    <h3 className="font-medium text-[var(--foreground)]">
                      {chapter.name}
                    </h3>
                    <p className="text-sm text-[var(--foreground)]/60">
                      {chapter.createdAt
                        ? new Date(chapter.createdAt).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-2  no-warp">
                      {"Просмотров: "}
                      {chapter.views && (
                        <span className="flex items-center gap-1">
                          {/* <Eye className="w-4 h-4" /> */}
                          {chapter.views}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/read/${titleId}/${chapter._id}`)
                      }
                      className="px-4 py-2 bg-[var(--accent)] cursor-pointer text-[var(--accent-foreground)] rounded-full hover:bg-[var(--accent)]/80 transition-colors"
                    >
                      Читать
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Кнопка перемотки в верх */}
            <button
              onClick={scrollToTop}
              className="fixed bottom-4 right-4 w-14 h-14 animate-pulse transition-all duration-800 flex items-center justify-center  bg-[var(--chart-1)] text-[var(--accent-foreground)] rounded-full shadow-lg hover:bg-[var(--accent)]/80"
              aria-label="Перемотать в верх"
            >
              <ArrowUpToLine className="w-6 h-6" />
            </button>
          </div>
        );

      case "comments":
        return (
          <div className="bg-[var(--secondary)]/50 backdrop-blur-sm rounded-xl p-4">
            <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">
              Комментарии
            </h2>
            <p className="text-[var(--foreground)]/60">
              Комментарии скоро будут доступны
            </p>
          </div>
        );

      case "statistics":
        return (
          <div className="bg-[var(--secondary)]/50 backdrop-blur-sm rounded-xl p-4">
            <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">
              Статистика
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--accent)]">
                  {titleData?.views || 0}
                </div>
                <div className="text-sm text-[var(--foreground)]/60">
                  Просмотров
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--accent)]">
                  {displayedChapters.length}
                </div>
                <div className="text-sm text-[var(--foreground)]/60">Глав</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center w-full">
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-[var(--background)]/20 px-3 py-1 rounded-full text-[var(--primary)]">
            <Calendar className="w-4 h-4" />
            <span>{titleData.releaseYear}</span>
          </div>
          <div className="flex items-center gap-2 bg-[var(--background)]/20 px-3 py-1 rounded-full text-[var(--primary)]">
            <BookOpen className="w-4 h-4" />
            <span>{translateTitleType(titleData.type || "")}</span>
          </div>
          <div className="flex items-center gap-2 bg-[var(--background)]/20 px-3 py-1 rounded-full text-[var(--primary)]">
            <CheckCheck className="w-4 h-4" />
            {titleData?.status && <span>{titleData.status}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 bg-[var(--background)]/20 px-3 py-1 rounded-full">
          <span className="text-lg font-bold text-[var(--chart-1)]">
            {titleData?.averageRating
              ? titleData?.averageRating.toFixed(2)
              : "0"}
          </span>
          {/* <button
            type="button"
            onClick={() => setIsRatingOpen((v) => !v)}
            className="px-2 py-1 rounded-full bg-[var(--background)] text-[var(--primary)] text-xs hover:bg-[var(--background)]/90 transition-colors cursor-pointer"
          >
            Оценить
          </button> */}
        </div>
      </div>

      {/* Блок с цифрами для оценки тайтла */}
      {/* {isRatingOpen && (
        <div className="relative flex flex-col justify-center items-end w-full ">
          <div className="absolute top-0 right-0 flex flex-col w-max bg-[var(--background)]/80 rounded-full p-2">
            <div className="flex items-end justify-between mb-2">
              <span className="text-sm text-[var(--primary)]">Ваша оценка</span>
              <button
                type="button"
                onClick={() => setIsRatingOpen(false)}
                className="p-1 rounded hover:bg-[var(--accent)]"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setPendingRating(n);
                    setIsRatingOpen(false);
                    // Отправляем рейтинг на сервер
                    updateRating({ id: titleData?._id || "", rating: n });
                  }}
                  className={`min-w-8 h-8 px-2 rounded-md text-sm font-medium cursor-pointer ${
                    pendingRating === n
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent)]/80"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )} */}

      {/* Title info - hidden on mobile, shown on desktop */}
      <h1 className="hidden lg:flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-[var(--foreground)] break-words">
        {titleData?.name}
      </h1>
      {/* Genres */}
      <div className="flex flex-wrap gap-2">
        <span
          className="px-2.5 py-1 cursor-pointer text-red-500 rounded-full text-sm font-semibold bg-[var(--muted)]/60 p-1"
          onClick={() => {
            router.push(
              `/browse?ageLimit=${encodeURIComponent(
                titleData?.ageLimit || ""
              )}`
            );
          }}
        >
          {titleData?.ageLimit}+
        </span>
        {titleData.genres?.map((genre, index) => (
          <span
            key={index}
            className="px-2 py-1 cursor-pointer rounded-full text-sm font-normal bg-[var(--muted)]/50 p-1 text-[var(--foreground)]"
            onClick={() => {
              router.push(`/browse?genres=${encodeURIComponent(genre || "")}`);
            }}
          >
            {genre}
          </span>
        ))}
        {titleData.tags?.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 cursor-pointer rounded-full text-xs font-normal bg-[var(--background)]/50 text-[var(--foreground)]"
            onClick={() => {
              router.push(`/browse?tags=${encodeURIComponent(tag || "")}`);
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      {/* description */}
      <div
        className={`text-[var(--foreground)]/80 leading-relaxed ${
          !isDescriptionExpanded ? "line-clamp-3" : ""
        }`}
        dangerouslySetInnerHTML={{
          __html: titleData?.description || "",
        }}
      ></div>
      {(titleData?.description?.length || 0) > 200 && (
        <button
          onClick={onDescriptionToggle}
          className="mt-2 text-[var(--chart-1)] hover:text-[var(--chart-1)]/80 transition-colors"
        >
          {isDescriptionExpanded ? "Свернуть" : "Развернуть"}
        </button>
      )}

      {/* Tabs */}
      <div className="bg-[var(--secondary)]/50 backdrop-blur-sm rounded-full p-1">
        <div className="flex">
          {[
            { key: "description" as const, label: "Описание" },
            { key: "chapters" as const, label: "Главы" },
            { key: "comments" as const, label: "Комментарии" },
            { key: "statistics" as const, label: "Статистика" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 py-1 px-2 rounded-full font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[var(--chart-1)]/90 text-[var(--foreground)]"
                  : "text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {renderTabContent()}
    </div>
  );
}
