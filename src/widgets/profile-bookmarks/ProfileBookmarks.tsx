"use client";

import { useState, useMemo, useEffect } from "react";
import { UserProfile } from "@/types/user";
import type { BookmarkEntry, BookmarkCategory } from "@/types/user";
import type { ReadingHistoryEntry } from "@/types/store";
import { normalizeBookmarks } from "@/lib/bookmarks";
import BookmarkCard from "@/shared/bookmark-card/BookmarkCard";
import { Bookmark, ChevronUp, Search, ArrowUpDown, X } from "lucide-react";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";

type SortOption = "name" | "progress" | "chapters" | "recent";

const SORT_LABELS: Record<SortOption, string> = {
  name: "По названию",
  progress: "По прогрессу",
  chapters: "По главам",
  recent: "Недавние",
};

function getTitleIdFromHistoryEntry(entry: ReadingHistoryEntry): string {
  return typeof entry.titleId === "string" ? entry.titleId : entry.titleId?._id ?? "";
}

const CATEGORY_LABELS: Record<BookmarkCategory, string> = {
  reading: "Читаю",
  planned: "В планах",
  completed: "Прочитано",
  favorites: "Избранное",
  dropped: "Брошено",
};

const CATEGORY_ORDER: BookmarkCategory[] = [
  "reading",
  "planned",
  "completed",
  "favorites",
  "dropped",
];

interface BookmarksSectionProps {
  bookmarks: UserProfile["bookmarks"];
  /** История чтения для отображения количества прочитанных глав в карточках */
  readingHistory?: ReadingHistoryEntry[];
  showAll?: boolean;
  showSectionHeader?: boolean;
}

/** Минимальный объект тайтла для карточки (API может отдавать populated titleId) */
function toCardTitle(
  entry: BookmarkEntry,
  fullTitle: { _id: string; name: string; coverImage?: string; slug?: string; status?: string } | null,
): { _id: string; name: string; coverImage?: string; slug?: string; status?: string } {
  if (fullTitle) return fullTitle;
  if (entry.title?.name) {
    return {
      _id: entry.titleId,
      name: entry.title.name,
      coverImage: entry.title.coverImage,
      slug: entry.title.slug,
      status: entry.title.status,
    };
  }
  return { _id: entry.titleId, name: `Манга #${entry.titleId.slice(-6)}` };
}

function BookmarkItem({
  entry,
  chaptersRead,
  onRemove,
  onCategoryChange,
}: {
  entry: BookmarkEntry;
  chaptersRead?: number;
  onRemove: (titleId: string) => void;
  onCategoryChange: (titleId: string, category: BookmarkCategory) => void;
}) {
  const titleId = entry.titleId;
  const hasTitleFromApi = Boolean(entry.title?.name);
  const {
    data: fetchedTitle,
    isLoading,
    error,
  } = useGetTitleByIdQuery({ id: titleId || "null" }, { skip: !titleId || hasTitleFromApi });
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(titleId);
      setIsRemoving(false);
    }, 300);
  };

  const title = toCardTitle(entry, fetchedTitle ?? null);
  const showError = !hasTitleFromApi && (error || (!isLoading && !fetchedTitle));

  if ((isLoading && !hasTitleFromApi) || isRemoving) {
    return (
      <div className="flex items-stretch gap-3 rounded-xl p-3 bg-[var(--background)]/40 border border-[var(--border)] animate-pulse">
        <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-lg bg-[var(--muted)] flex-shrink-0" />
        <div className="flex-1 min-w-0 py-1 space-y-2">
          <div className="h-4 bg-[var(--muted)] rounded w-3/4" />
          <div className="h-3 bg-[var(--muted)] rounded w-1/2" />
          <div className="h-3 bg-[var(--muted)] rounded w-1/3 mt-3" />
        </div>
      </div>
    );
  }

  if (showError) {
    return (
      <div className="flex items-stretch gap-3 rounded-xl p-3 bg-[var(--background)]/40 border border-[var(--border)]">
        <div className="w-20 h-28 rounded-lg bg-gradient-to-br from-[var(--chart-1)]/20 to-[var(--primary)]/20 flex items-center justify-center flex-shrink-0">
          <Bookmark className="w-6 h-6 text-[var(--chart-1)]" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="font-medium text-[var(--muted-foreground)] text-sm">{title.name}</h3>
          <p className="text-xs text-red-500 mt-1">Ошибка загрузки</p>
        </div>
      </div>
    );
  }

  return (
    <BookmarkCard
      title={title as import("@/types/title").Title}
      category={entry.category}
      chaptersRead={chaptersRead}
      onRemove={handleRemove}
      onCategoryChange={onCategoryChange}
      isLoading={false}
    />
  );
}

function BookmarkCategorySection({
  label,
  count,
  entries,
  chaptersReadByTitleId,
  maxPerSection,
  showAll,
  onRemove,
  onCategoryChange,
}: {
  label: string;
  count: number;
  entries: BookmarkEntry[];
  chaptersReadByTitleId: Map<string, number>;
  maxPerSection: number | undefined;
  showAll: boolean;
  onRemove: (titleId: string) => void;
  onCategoryChange: (titleId: string, category: BookmarkCategory) => void;
}) {
  const [sectionExpanded, setSectionExpanded] = useState(false);
  const visible = maxPerSection != null ? entries.slice(0, maxPerSection) : entries;
  const hasMore = maxPerSection != null && entries.length > maxPerSection;
  const displayList = showAll || sectionExpanded ? entries : visible;

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
        <span className="text-[var(--primary)]">{label}</span>
        <span className="text-xs font-normal text-[var(--muted-foreground)] bg-[var(--background)] px-2 py-0.5 rounded-full">
          {count}
        </span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayList.map(entry => (
          <BookmarkItem
            key={entry.titleId}
            entry={entry}
            chaptersRead={chaptersReadByTitleId.get(entry.titleId)}
            onRemove={onRemove}
            onCategoryChange={onCategoryChange}
          />
        ))}
      </div>
      {hasMore && !sectionExpanded && (
        <button
          type="button"
          className="text-sm text-[var(--primary)] hover:underline font-medium"
          onClick={() => setSectionExpanded(true)}
        >
          Показать все ({entries.length})
        </button>
      )}
      {hasMore && sectionExpanded && (
        <button
          type="button"
          className="text-sm text-[var(--muted-foreground)] hover:underline font-medium flex items-center gap-1"
          onClick={() => setSectionExpanded(false)}
        >
          <ChevronUp className="h-3.5 w-3.5" /> Свернуть
        </button>
      )}
    </section>
  );
}

function BookmarksSection({ bookmarks, readingHistory, showAll = false, showSectionHeader = true }: BookmarksSectionProps) {
  const normalized = useMemo(() => normalizeBookmarks(bookmarks), [bookmarks]);
  const [currentBookmarks, setCurrentBookmarks] = useState(normalized);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    setCurrentBookmarks(normalizeBookmarks(bookmarks));
  }, [bookmarks]);

  const chaptersReadByTitleId = useMemo(() => {
    const map = new Map<string, number>();
    if (!readingHistory?.length) return map;
    readingHistory.forEach(entry => {
      const titleId = getTitleIdFromHistoryEntry(entry);
      if (!titleId) return;
      // Используем chaptersCount из API (лёгкий формат), иначе считаем по массиву chapters; суммируем, если по одному тайтлу несколько записей
      const count = entry.chaptersCount ?? entry.chapters?.length ?? 0;
      if (count > 0) {
        map.set(titleId, (map.get(titleId) ?? 0) + count);
      }
    });
    return map;
  }, [readingHistory]);

  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) return currentBookmarks;
    const query = searchQuery.toLowerCase().trim();
    return currentBookmarks.filter(entry => {
      const name = entry.title?.name?.toLowerCase() ?? "";
      return name.includes(query);
    });
  }, [currentBookmarks, searchQuery]);

  const sortedBookmarks = useMemo(() => {
    const sorted = [...filteredBookmarks];
    switch (sortBy) {
      case "name":
        sorted.sort((a, b) => (a.title?.name ?? "").localeCompare(b.title?.name ?? ""));
        break;
      case "progress": {
        sorted.sort((a, b) => {
          const aTotal = a.title?.totalChapters ?? 0;
          const bTotal = b.title?.totalChapters ?? 0;
          const aRead = chaptersReadByTitleId.get(a.titleId) ?? 0;
          const bRead = chaptersReadByTitleId.get(b.titleId) ?? 0;
          const aProgress = aTotal > 0 ? aRead / aTotal : 0;
          const bProgress = bTotal > 0 ? bRead / bTotal : 0;
          return bProgress - aProgress;
        });
        break;
      }
      case "chapters": {
        sorted.sort((a, b) => {
          const aTotal = a.title?.totalChapters ?? 0;
          const bTotal = b.title?.totalChapters ?? 0;
          return bTotal - aTotal;
        });
        break;
      }
      case "recent":
      default:
        break;
    }
    return sorted;
  }, [filteredBookmarks, sortBy, chaptersReadByTitleId]);

  const byCategory = useMemo(() => {
    const map = new Map<BookmarkCategory, BookmarkEntry[]>();
    CATEGORY_ORDER.forEach(c => map.set(c, []));
    sortedBookmarks.forEach(entry => {
      const list = map.get(entry.category) ?? [];
      list.push(entry);
      map.set(entry.category, list);
    });
    return map;
  }, [sortedBookmarks]);

  const categoriesWithCount = useMemo(
    () =>
      CATEGORY_ORDER.map(cat => ({
        category: cat,
        label: CATEGORY_LABELS[cat],
        count: byCategory.get(cat)?.length ?? 0,
      })).filter(c => c.count > 0),
    [byCategory],
  );

  const handleRemoveBookmark = (titleId: string) => {
    setCurrentBookmarks(prev => prev.filter(e => e.titleId !== titleId));
  };

  const handleCategoryChange = (titleId: string, category: BookmarkCategory) => {
    setCurrentBookmarks(prev =>
      prev.map(e => (e.titleId === titleId ? { ...e, category } : e)),
    );
  };

  if (!currentBookmarks || currentBookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 min-h-[280px]">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--chart-1)]/20 flex items-center justify-center border border-[var(--primary)]/30 shadow-lg shadow-[var(--primary)]/10">
            <Bookmark className="h-10 w-10 text-[var(--primary)]" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--chart-2)] flex items-center justify-center text-white text-xs font-bold shadow-md">
            0
          </div>
        </div>
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">Закладки пусты</h3>
        <p className="text-sm text-[var(--muted-foreground)] text-center max-w-sm mb-5">
          Добавляйте тайтлы в закладки со страницы произведения, чтобы не потерять интересные истории
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <a
            href="/catalog"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity shadow-md"
          >
            <Bookmark className="w-4 h-4" />
            Перейти в каталог
          </a>
        </div>
        <div className="mt-6 grid grid-cols-5 gap-2 opacity-30">
          {CATEGORY_ORDER.map(cat => (
            <div key={cat} className="flex flex-col items-center gap-1 text-center">
              <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center">
                <Bookmark className="w-4 h-4 text-[var(--muted-foreground)]" />
              </div>
              <span className="text-[10px] text-[var(--muted-foreground)]">{CATEGORY_LABELS[cat]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const maxPerSection = showAll ? undefined : 6;
  const hasFilters = searchQuery.trim().length > 0;
  const noResults = hasFilters && sortedBookmarks.length === 0;

  return (
    <div className="space-y-5 min-h-[280px] flex flex-col">
      {showSectionHeader && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-[var(--primary)]" />
              <span>Закладки</span>
              <span className="text-xs font-normal text-[var(--muted-foreground)] bg-[var(--background)] px-2 py-0.5 rounded-full">
                {currentBookmarks.length}
              </span>
            </h2>
          </div>

          {/* Поиск и сортировка */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-[var(--secondary)]/50 border border-[var(--border)]/60 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/50 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSortMenu(prev => !prev)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--secondary)]/50 border border-[var(--border)]/60 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              >
                <ArrowUpDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span className="hidden sm:inline">{SORT_LABELS[sortBy]}</span>
              </button>
              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-lg min-w-[140px]">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSortBy(option);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          sortBy === option
                            ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                            : "text-[var(--foreground)] hover:bg-[var(--accent)]"
                        }`}
                      >
                        {SORT_LABELS[option]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {hasFilters && (
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <span>
                Найдено: <span className="font-medium text-[var(--foreground)]">{sortedBookmarks.length}</span> из {currentBookmarks.length}
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[var(--primary)] hover:underline"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>
      )}

      {noResults && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Search className="w-12 h-12 text-[var(--muted-foreground)] opacity-50 mb-3" />
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">Ничего не найдено</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Попробуйте изменить поисковый запрос
          </p>
        </div>
      )}

      {!noResults && categoriesWithCount.map(({ category, label, count }) => (
        <BookmarkCategorySection
          key={category}
          label={label}
          count={count}
          entries={byCategory.get(category) ?? []}
          chaptersReadByTitleId={chaptersReadByTitleId}
          maxPerSection={maxPerSection}
          showAll={showAll}
          onRemove={handleRemoveBookmark}
          onCategoryChange={handleCategoryChange}
        />
      ))}
    </div>
  );
}

export default BookmarksSection;
