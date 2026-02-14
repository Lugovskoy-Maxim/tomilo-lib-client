"use client";

import { useMemo, useState, useEffect } from "react";
import type { BookmarkEntry, BookmarkCategory } from "@/types/user";
import type { ReadingHistoryEntry } from "@/types/store";
import { normalizeBookmarks } from "@/lib/bookmarks";
import BookmarkGridCard from "@/shared/bookmark-card/BookmarkGridCard";
import { Bookmark } from "lucide-react";
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

function getTitleIdFromHistoryEntry(entry: ReadingHistoryEntry): string {
  return typeof entry.titleId === "string" ? entry.titleId : entry.titleId?._id ?? "";
}

interface ProfileBookmarksGridProps {
  bookmarks: BookmarkEntry[];
  readingHistory?: ReadingHistoryEntry[];
  /** false для публичного просмотра — без кнопок удаления и смены категории */
  canEdit?: boolean;
}

function BookmarkGridItem({
  entry,
  chaptersRead,
  onRemove,
  onCategoryChange,
  canEdit,
}: {
  entry: BookmarkEntry;
  chaptersRead?: number;
  onRemove: (titleId: string) => void;
  onCategoryChange: (titleId: string, category: BookmarkCategory) => void;
  canEdit: boolean;
}) {
  const hasTitle = Boolean(entry.title?.name);
  const { data: fetchedTitle } = useGetTitleByIdQuery(
    { id: entry.titleId || "null" },
    { skip: !entry.titleId || hasTitle },
  );

  const title = fetchedTitle ?? entry.title;
  const name = title?.name ?? `Манга #${entry.titleId.slice(-6)}`;
  const coverImage = title?.coverImage ?? entry.title?.coverImage;
  const slug = title?.slug ?? entry.title?.slug;
  const status = title?.status ?? entry.title?.status;
  const totalChapters = title?.totalChapters ?? entry.title?.totalChapters ?? 0;

  return (
    <BookmarkGridCard
      titleId={entry.titleId}
      name={name}
      coverImage={coverImage}
      slug={slug}
      status={status}
      totalChapters={totalChapters}
      category={entry.category}
      chaptersRead={chaptersRead}
      onRemove={canEdit ? onRemove : undefined}
      onCategoryChange={canEdit ? onCategoryChange : undefined}
    />
  );
}

export default function ProfileBookmarksGrid({
  bookmarks,
  readingHistory,
  canEdit = true,
}: ProfileBookmarksGridProps) {
  const normalized = useMemo(() => normalizeBookmarks(bookmarks), [bookmarks]);
  const [currentBookmarks, setCurrentBookmarks] = useState(normalized);
  const [activeCategory, setActiveCategory] = useState<BookmarkCategory | "all">("all");

  useEffect(() => {
    setCurrentBookmarks(normalizeBookmarks(bookmarks));
  }, [bookmarks]);

  const chaptersReadByTitleId = useMemo(() => {
    const map = new Map<string, number>();
    if (!readingHistory?.length) return map;
    readingHistory.forEach(entry => {
      const titleId = getTitleIdFromHistoryEntry(entry);
      if (!titleId) return;
      const count = entry.chaptersCount ?? entry.chapters?.length ?? 0;
      if (count > 0) {
        map.set(titleId, (map.get(titleId) ?? 0) + count);
      }
    });
    return map;
  }, [readingHistory]);

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

  const filteredEntries =
    activeCategory === "all"
      ? currentBookmarks
      : byCategory.get(activeCategory) ?? [];

  const handleRemove = (titleId: string) => {
    setCurrentBookmarks(prev => prev.filter(e => e.titleId !== titleId));
  };

  const handleCategoryChange = (titleId: string, category: BookmarkCategory) => {
    setCurrentBookmarks(prev =>
      prev.map(e => (e.titleId === titleId ? { ...e, category } : e)),
    );
  };

  if (!currentBookmarks.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mb-4">
          <Bookmark className="h-8 w-8 text-[var(--primary)]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Нет закладок</h3>
        <p className="text-sm text-[var(--muted-foreground)] text-center max-w-xs">
          Добавляйте тайтлы в закладки со страницы тайтла
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Табы категорий как на Senkuro */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--border)] pb-3">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          }`}
        >
          Все
          <span className="ml-1.5 text-xs opacity-80">{currentBookmarks.length}</span>
        </button>
        {CATEGORY_ORDER.map(cat => {
          const count = byCategory.get(cat)?.length ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              }`}
            >
              {CATEGORY_LABELS[cat]}
              <span className="ml-1.5 text-xs opacity-80">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Сетка карточек */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {filteredEntries.map(entry => (
          <BookmarkGridItem
            key={entry.titleId}
            entry={entry}
            chaptersRead={chaptersReadByTitleId.get(entry.titleId)}
            onRemove={handleRemove}
            onCategoryChange={handleCategoryChange}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  );
}
