"use client";

import { useState, useMemo, useEffect } from "react";
import { UserProfile } from "@/types/user";
import type { BookmarkEntry, BookmarkCategory } from "@/types/user";
import { normalizeBookmarks } from "@/lib/bookmarks";
import BookmarkCard from "@/shared/bookmark-card/BookmarkCard";
import { Bookmark, ChevronDown, ChevronUp } from "lucide-react";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";

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
  onRemove,
  onCategoryChange,
}: {
  entry: BookmarkEntry;
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
      onRemove={handleRemove}
      onCategoryChange={onCategoryChange}
      isLoading={false}
    />
  );
}

function BookmarksSection({ bookmarks, showAll = false, showSectionHeader = true }: BookmarksSectionProps) {
  const normalized = useMemo(() => normalizeBookmarks(bookmarks), [bookmarks]);
  const [currentBookmarks, setCurrentBookmarks] = useState(normalized);
  const [activeCategory, setActiveCategory] = useState<BookmarkCategory | "all">("all");
  const [isExpanded, setIsExpanded] = useState(showAll);

  useEffect(() => {
    setCurrentBookmarks(normalizeBookmarks(bookmarks));
  }, [bookmarks]);

  const byCategory = useMemo(() => {
    const map = new Map<BookmarkCategory, BookmarkEntry[]>();
    CATEGORY_ORDER.forEach(c => map.set(c, []));
    currentBookmarks.forEach(entry => {
      const list = map.get(entry.category) ?? [];
      list.push(entry);
      map.set(entry.category, list);
    });
    return map;
  }, [currentBookmarks]);

  const categoriesWithCount = useMemo(
    () =>
      CATEGORY_ORDER.map(cat => ({
        category: cat,
        label: CATEGORY_LABELS[cat],
        count: byCategory.get(cat)?.length ?? 0,
      })).filter(c => c.count > 0),
    [byCategory],
  );

  const visibleEntries =
    activeCategory === "all"
      ? currentBookmarks
      : byCategory.get(activeCategory) ?? [];
  const visibleList = isExpanded ? visibleEntries : visibleEntries.slice(0, 6);
  const hasMore = visibleEntries.length > 6;

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
      <div className="flex flex-col items-center justify-center py-12 px-4 min-h-[240px]">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mb-4">
          <Bookmark className="h-8 w-8 text-[var(--primary)]" />
        </div>
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">Нет закладок</h3>
        <p className="text-sm text-[var(--muted-foreground)] text-center">
          Сохраняйте тайтлы в закладки и распределяйте по категориям
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-h-[280px] flex flex-col">
      {showSectionHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-[var(--primary)]" />
            <span>Закладки</span>
            <span className="text-xs font-normal text-[var(--muted-foreground)] bg-[var(--background)] px-2 py-0.5 rounded-full">
              {currentBookmarks.length}
            </span>
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeCategory === "all"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--background)]/60 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              }`}
            >
              Все
            </button>
            {categoriesWithCount.map(({ category, label, count }) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeCategory === category
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--background)]/60 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 flex-1">
        {visibleList.map(entry => (
          <BookmarkItem
            key={entry.titleId}
            entry={entry}
            onRemove={handleRemoveBookmark}
            onCategoryChange={handleCategoryChange}
          />
        ))}
      </div>

      {hasMore && !isExpanded && (
        <div className="text-center pt-2">
          <button
            type="button"
            className="text-sm text-[var(--primary)] hover:underline font-medium"
            onClick={() => setIsExpanded(true)}
          >
            Показать все ({visibleEntries.length})
          </button>
        </div>
      )}
      {hasMore && isExpanded && visibleEntries.length > 6 && (
        <div className="text-center pt-2">
          <button
            type="button"
            className="text-sm text-[var(--muted-foreground)] hover:underline font-medium flex items-center gap-1 mx-auto"
            onClick={() => setIsExpanded(false)}
          >
            <ChevronUp className="h-3.5 w-3.5" /> Свернуть
          </button>
        </div>
      )}
    </div>
  );
}

export default BookmarksSection;
