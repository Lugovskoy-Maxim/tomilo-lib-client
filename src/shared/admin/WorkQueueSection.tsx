"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, FileWarning, RefreshCcw } from "lucide-react";
import { useSearchTitlesQuery } from "@/store/api/titlesApi";
import { useSearchChaptersQuery } from "@/store/api/chaptersApi";
import { formatNumber } from "@/lib/utils";

function getPagesCount(pages?: string[], images?: string[]) {
  return pages?.length ?? images?.length ?? 0;
}

export function WorkQueueSection() {
  const [search, setSearch] = useState("");
  const [titlesPage, setTitlesPage] = useState(1);
  const [chaptersPage, setChaptersPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const {
    data: titlesResponse,
    isLoading: isTitlesLoading,
    isFetching: isTitlesFetching,
    refetch: refetchTitles,
  } = useSearchTitlesQuery({
    page: 1,
    limit: 500,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  const {
    data: chaptersResponse,
    isLoading: isChaptersLoading,
    isFetching: isChaptersFetching,
    refetch: refetchChapters,
  } = useSearchChaptersQuery({
    page: 1,
    limit: 500,
    sortOrder: "desc",
  });

  const normalizedSearch = search.trim().toLowerCase();

  const titlesWithoutChapters = useMemo(() => {
    const allTitles = titlesResponse?.data?.data || [];
    const queue = allTitles.filter(title => (title.totalChapters || 0) === 0);
    if (!normalizedSearch) return queue;
    return queue.filter(title =>
      [title.name, title.author, title.slug, title._id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [titlesResponse, normalizedSearch]);

  const chaptersWithoutPages = useMemo(() => {
    const allChapters = chaptersResponse?.chapters || [];
    const queue = allChapters.filter(chapter => getPagesCount(chapter.pages, chapter.images) === 0);
    if (!normalizedSearch) return queue;
    return queue.filter(chapter =>
      [
        chapter.title,
        chapter.name,
        chapter.titleInfo?.name,
        String(chapter.chapterNumber ?? ""),
        chapter.titleId,
        chapter._id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [chaptersResponse, normalizedSearch]);

  const pagedTitles = useMemo(() => {
    const start = (titlesPage - 1) * ITEMS_PER_PAGE;
    return titlesWithoutChapters.slice(start, start + ITEMS_PER_PAGE);
  }, [titlesWithoutChapters, titlesPage]);

  const pagedChapters = useMemo(() => {
    const start = (chaptersPage - 1) * ITEMS_PER_PAGE;
    return chaptersWithoutPages.slice(start, start + ITEMS_PER_PAGE);
  }, [chaptersWithoutPages, chaptersPage]);

  const titlesTotalPages = Math.max(1, Math.ceil(titlesWithoutChapters.length / ITEMS_PER_PAGE));
  const chaptersTotalPages = Math.max(1, Math.ceil(chaptersWithoutPages.length / ITEMS_PER_PAGE));
  const isLoading = isTitlesLoading || isChaptersLoading;

  const handleRefresh = () => {
    refetchTitles();
    refetchChapters();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Рабочая очередь контента</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Тайтлы без глав и главы без страниц для оперативной модерации
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            Обновить
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/20 p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <BookOpen className="h-4 w-4" />
              Тайтлы без глав
            </div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">
              {formatNumber(titlesWithoutChapters.length)}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/20 p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <FileWarning className="h-4 w-4" />
              Главы без страниц
            </div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">
              {formatNumber(chaptersWithoutPages.length)}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setTitlesPage(1);
              setChaptersPage(1);
            }}
            placeholder="Поиск по названию, id, автору, номеру главы..."
            className="admin-input w-full"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Анализ по последним 500 тайтлам и 500 главам. Увеличим выборку, если нужно.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--muted-foreground)]">
          Загрузка рабочей очереди...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <h3 className="font-semibold text-[var(--foreground)]">Тайтлы без глав</h3>
              <span className="text-sm text-[var(--muted-foreground)]">{titlesWithoutChapters.length}</span>
            </div>
            {pagedTitles.length === 0 ? (
              <div className="p-6 text-sm text-[var(--muted-foreground)]">Ничего не найдено</div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {pagedTitles.map(title => (
                  <div key={title._id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">{title.name}</p>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        {title.author || "Автор не указан"} · {title._id}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/admin/titles/edit/${title._id}`}
                        className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--accent)]"
                      >
                        Открыть
                      </Link>
                      <Link
                        href={`/admin/titles/edit/${title._id}/chapters/new`}
                        className="rounded-lg bg-[var(--primary)] px-2.5 py-1.5 text-xs font-medium text-[var(--primary-foreground)]"
                      >
                        + Глава
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 text-xs">
              <button
                type="button"
                disabled={titlesPage <= 1}
                onClick={() => setTitlesPage(prev => Math.max(1, prev - 1))}
                className="rounded border border-[var(--border)] px-2 py-1 disabled:opacity-50"
              >
                Назад
              </button>
              <span className="text-[var(--muted-foreground)]">
                {titlesPage} / {titlesTotalPages}
              </span>
              <button
                type="button"
                disabled={titlesPage >= titlesTotalPages}
                onClick={() => setTitlesPage(prev => Math.min(titlesTotalPages, prev + 1))}
                className="rounded border border-[var(--border)] px-2 py-1 disabled:opacity-50"
              >
                Вперёд
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <h3 className="font-semibold text-[var(--foreground)]">Главы без страниц</h3>
              <span className="text-sm text-[var(--muted-foreground)]">{chaptersWithoutPages.length}</span>
            </div>
            {pagedChapters.length === 0 ? (
              <div className="p-6 text-sm text-[var(--muted-foreground)]">Ничего не найдено</div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {pagedChapters.map(chapter => (
                  <div key={chapter._id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        Глава {chapter.chapterNumber}: {chapter.title || chapter.name || "Без названия"}
                      </p>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        Тайтл: {chapter.titleInfo?.name || chapter.titleId} · {chapter._id}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded bg-[var(--destructive)]/10 px-2 py-1 text-xs text-[var(--destructive)]">
                        0 стр.
                      </span>
                      <Link
                        href={`/admin/titles/edit/${chapter.titleId}/chapters/${chapter._id}`}
                        className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--accent)]"
                      >
                        Исправить
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 text-xs">
              <button
                type="button"
                disabled={chaptersPage <= 1}
                onClick={() => setChaptersPage(prev => Math.max(1, prev - 1))}
                className="rounded border border-[var(--border)] px-2 py-1 disabled:opacity-50"
              >
                Назад
              </button>
              <span className="text-[var(--muted-foreground)]">
                {chaptersPage} / {chaptersTotalPages}
              </span>
              <button
                type="button"
                disabled={chaptersPage >= chaptersTotalPages}
                onClick={() => setChaptersPage(prev => Math.min(chaptersTotalPages, prev + 1))}
                className="rounded border border-[var(--border)] px-2 py-1 disabled:opacity-50"
              >
                Вперёд
              </button>
            </div>
          </div>
        </div>
      )}

      {(isTitlesFetching || isChaptersFetching) && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
          <AlertTriangle className="h-4 w-4" />
          Обновляем данные очереди...
        </div>
      )}
    </div>
  );
}
