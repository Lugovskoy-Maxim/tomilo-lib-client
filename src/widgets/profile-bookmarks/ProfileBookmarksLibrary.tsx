"use client";

import { useMemo, useState, useEffect, memo } from "react";
import Link from "next/link";
import type { BookmarkEntry, BookmarkCategory } from "@/types/user";
import type { ReadingHistoryEntry } from "@/types/store";
import { normalizeBookmarks } from "@/lib/bookmarks";
import BookmarkGridCard from "@/shared/bookmark-card/BookmarkGridCard";
import { Bookmark, ChevronRight } from "lucide-react";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { Carousel } from "@/widgets";
import { getTitlePath } from "@/lib/title-paths";

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

interface ProfileBookmarksLibraryProps {
  bookmarks: BookmarkEntry[];
  readingHistory?: ReadingHistoryEntry[];
  /** Ссылка «Вся манга» (если нет onShowAllBookmarks) */
  allBookmarksHref?: string;
  /** При клике «Все тайтлы» переключить вкладку (без перехода по URL) */
  onShowAllBookmarks?: () => void;
  /** Лимит карточек (например 6 = один ряд). Без лимита показываются все */
  maxItems?: number;
  /** Текст пустого состояния */
  emptyStateMessage?: string;
}

/** Элемент для карусели: id для ключа и getItemPath, entry + chaptersRead для карточки */
interface CarouselBookmarkItem {
  id: string;
  entry: BookmarkEntry;
  chaptersRead?: number;
  slug?: string;
}

const LibraryCardItem = memo(function LibraryCardItem({
  entry,
  chaptersRead,
}: {
  entry: BookmarkEntry;
  chaptersRead?: number;
}) {
  const hasPopulatedTitle = Boolean(entry.title?.name);
  const { data: fetchedTitle } = useGetTitleByIdQuery(
    { id: entry.titleId },
    { skip: hasPopulatedTitle || !entry.titleId },
  );

  const title = hasPopulatedTitle ? entry.title : (fetchedTitle ?? entry.title);
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
    />
  );
});

/** Обёртка карточки закладки для карусели: передаёт data в LibraryCardItem, маркирует клик для Carousel */
function BookmarkCarouselCard({ data }: { data: CarouselBookmarkItem }) {
  return (
    <div data-card-click-handler>
      <LibraryCardItem
        entry={data.entry}
        chaptersRead={data.chaptersRead}
      />
    </div>
  );
}

export default function ProfileBookmarksLibrary({
  bookmarks,
  readingHistory,
  allBookmarksHref = "/profile/bookmarks",
  onShowAllBookmarks,
  maxItems,
  emptyStateMessage = "Пока нет закладок. Добавляйте тайтлы со страницы произведения.",
}: ProfileBookmarksLibraryProps) {
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

  const filteredEntriesRaw =
    activeCategory === "all"
      ? currentBookmarks
      : byCategory.get(activeCategory) ?? [];
  const filteredEntries = maxItems != null
    ? filteredEntriesRaw.slice(0, maxItems)
    : filteredEntriesRaw;

  const isCarousel = maxItems != null && maxItems > 0;
  const carouselData: CarouselBookmarkItem[] = useMemo(
    () =>
      filteredEntries.map(entry => ({
        id: entry.titleId,
        entry,
        chaptersRead: chaptersReadByTitleId.get(entry.titleId),
        slug: entry.title?.slug,
      })),
    [filteredEntries, chaptersReadByTitleId],
  );

  if (!currentBookmarks.length) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[var(--primary)]" />
            Закладки
            <span className="text-xs font-normal text-[var(--muted-foreground)]">0</span>
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
            {emptyStateMessage}
          </p>
          {onShowAllBookmarks ? (
            <button
              type="button"
              onClick={onShowAllBookmarks}
              className="mt-3 text-sm font-medium text-[var(--primary)] hover:underline inline-flex items-center gap-1"
            >
              Все тайтлы
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href={allBookmarksHref}
              className="mt-3 text-sm font-medium text-[var(--primary)] hover:underline inline-flex items-center gap-1"
            >
              Все тайтлы
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      {/* Заголовок: одна строка — Закладки N + Все тайтлы */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2 min-w-0">
          <Bookmark className="w-4 h-4 text-[var(--primary)] shrink-0" />
          Закладки
          <span className="text-xs font-normal text-[var(--muted-foreground)] tabular-nums">
            {currentBookmarks.length}
          </span>
        </h2>
        {onShowAllBookmarks ? (
          <button
            type="button"
            onClick={onShowAllBookmarks}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--foreground)] bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors shrink-0"
          >
            Все тайтлы
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Link
            href={allBookmarksHref}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--foreground)] bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors shrink-0"
          >
            Все тайтлы
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Категории: компактные pills с горизонтальным скроллом при необходимости */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-0.5 -mx-0.5 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`shrink-0 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          }`}
        >
          Все
          <span className="ml-1 opacity-90 tabular-nums">{currentBookmarks.length}</span>
        </button>
        {CATEGORY_ORDER.map(cat => {
          const count = byCategory.get(cat)?.length ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              }`}
            >
              {CATEGORY_LABELS[cat]}
              <span className="ml-1 opacity-90 tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Один ряд каруселью (при maxItems) — готовая карусель с главной */}
      {isCarousel ? (
        <Carousel<CarouselBookmarkItem>
          hideHeader
          title=""
          type="browse"
          data={carouselData}
          cardComponent={BookmarkCarouselCard}
          idField="id"
          cardWidth="w-[140px] sm:w-[160px] md:w-[180px]"
          getItemPath={item => getTitlePath({ _id: item.id, slug: item.slug })}
          showNavigation={carouselData.length > 4}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {filteredEntries.map(entry => (
            <LibraryCardItem
              key={entry.titleId}
              entry={entry}
              chaptersRead={chaptersReadByTitleId.get(entry.titleId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
