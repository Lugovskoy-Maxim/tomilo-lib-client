"use client";

import { AuthGuard } from "@/guard/AuthGuard";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useGetChaptersByTitleQuery,
  useDeleteChapterMutation,
  useUpdateChapterMutation,
} from "@/store/api/chaptersApi";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { useMemo, useCallback, useState, useRef, useId } from "react";
import { useDispatch } from "react-redux";
import { Header, Footer } from "@/widgets";
import { mangaParserApi } from "@/store/api/mangaParserApi";
import { useGetAutoParsingJobsQuery } from "@/store/api/autoParsingApi";
import { chaptersApi } from "@/store/api/chaptersApi";
import type { AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { Chapter } from "@/types/title";
import { getChapterStatusLabel, getChapterStatusStyles } from "@/lib/chapter-status";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import { ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw } from "lucide-react";

type ChapterSortField = "chapterNumber" | "title" | "status" | "views" | "pages" | "isPublished";
type SortDirection = "asc" | "desc";

export default function ChaptersManagementPage() {
  const params = useParams();
  const titleId = (params?.id as string) || "";
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchChapterNumber, setSearchChapterNumber] = useState("");
  const [foundChapter, setFoundChapter] = useState<Chapter | null>(null);
  const [draggedChapter, setDraggedChapter] = useState<Chapter | null>(null);
  const [sortField, setSortField] = useState<ChapterSortField>("chapterNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncingEmpty, setIsSyncingEmpty] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const checkboxIdPrefix = useId();

  const dispatch = useDispatch<AppDispatch>();
  const { data: titleData } = useGetTitleByIdQuery({ id: titleId }, { skip: !titleId });
  const { data: autoParsingJobs } = useGetAutoParsingJobsQuery(undefined, { skip: !titleId });
  const autoParsingJobForTitle = useMemo(
    () =>
      autoParsingJobs?.find(j => {
        const id = typeof j.titleId === "string" ? j.titleId : (j.titleId as { _id?: string })?._id;
        return id === titleId;
      }),
    [autoParsingJobs, titleId],
  );
  const syncSourceUrl =
    (autoParsingJobForTitle?.sources?.[0] ?? autoParsingJobForTitle?.url)?.trim() ?? "";
  const { data, isLoading, error } = useGetChaptersByTitleQuery(
    { titleId, page: currentPage, limit: 10000, sortOrder: "desc" },
    { skip: !titleId },
  );
  const [deleteChapter] = useDeleteChapterMutation();
  const [updateChapter] = useUpdateChapterMutation();

  const chapters = useMemo(() => data?.chapters || [], [data]);
  const hasMore = data?.hasMore || false;

  // Поиск главы по номеру
  const handleSearch = useCallback(() => {
    if (!searchChapterNumber.trim()) {
      setFoundChapter(null);
      return;
    }

    const chapterNumber = parseInt(searchChapterNumber.trim());
    if (isNaN(chapterNumber)) {
      toast.error("Введите корректный номер главы");
      return;
    }

    // Ищем главу в текущем списке
    const found = chapters.find(ch => ch.chapterNumber === chapterNumber);
    if (found) {
      setFoundChapter(found);
      toast.success(`Глава #${chapterNumber} найдена`);
      // Прокручиваем к найденной главе
      setTimeout(() => {
        const element = document.querySelector(`[data-chapter-id="${found._id}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } else {
      setFoundChapter(null);
      toast.error(`Глава #${chapterNumber} не найдена на текущей странице`);
    }
  }, [searchChapterNumber, chapters, toast]);

  // Сброс поиска при смене страницы
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    setFoundChapter(null);
    setSearchChapterNumber("");
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить главу?")) {
      return;
    }
    try {
      await deleteChapter(id).unwrap();
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Глава удалена");
    } catch (e) {
      const error = e as Error;
      toast.error(error?.message || "Ошибка удаления");
    }
  };

  // Сортировка глав (объявляем до chaptersWithoutPages и логики выбора)
  const sortedChapters = useMemo(() => {
    const arr = [...chapters];
    arr.sort((a, b) => {
      let aVal: number | string | boolean;
      let bVal: number | string | boolean;
      switch (sortField) {
        case "chapterNumber":
          aVal = a.chapterNumber ?? 0;
          bVal = b.chapterNumber ?? 0;
          return sortDirection === "asc"
            ? (aVal as number) - (bVal as number)
            : (bVal as number) - (aVal as number);
        case "title":
          aVal = (a.title ?? a.name ?? "").toLowerCase();
          bVal = (b.title ?? b.name ?? "").toLowerCase();
          return sortDirection === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
        case "status":
          aVal = String(a.status ?? "").toLowerCase();
          bVal = String(b.status ?? "").toLowerCase();
          return sortDirection === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
        case "views":
          aVal = a.views ?? 0;
          bVal = b.views ?? 0;
          return sortDirection === "asc"
            ? (aVal as number) - (bVal as number)
            : (bVal as number) - (aVal as number);
        case "pages":
          aVal = a.pages?.length ?? a.images?.length ?? 0;
          bVal = b.pages?.length ?? b.images?.length ?? 0;
          return sortDirection === "asc"
            ? (aVal as number) - (bVal as number)
            : (bVal as number) - (aVal as number);
        case "isPublished":
          aVal = a.isPublished ? 1 : 0;
          bVal = b.isPublished ? 1 : 0;
          return sortDirection === "asc"
            ? (aVal as number) - (bVal as number)
            : (bVal as number) - (aVal as number);
        default:
          return 0;
      }
    });
    return arr;
  }, [chapters, sortField, sortDirection]);

  // Главы без страниц (для кнопки удаления)
  const chaptersWithoutPages = useMemo(
    () =>
      sortedChapters.filter(
        ch => (ch.pages?.length ?? ch.images?.length ?? 0) === 0,
      ),
    [sortedChapters],
  );
  const countWithoutPages = chaptersWithoutPages.length;

  // Выбор глав
  const selectedCount = selectedIds.size;
  const isAllSelected =
    sortedChapters.length > 0 &&
    sortedChapters.every(ch => selectedIds.has(ch._id));
  const isSomeSelected = selectedCount > 0;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedChapters.map(ch => ch._id)));
    }
  }, [isAllSelected, sortedChapters]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedCount === 0) return;
    if (
      !confirm(
        `Удалить выбранные главы (${selectedCount})? Это действие нельзя отменить.`,
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      let ok = 0;
      let err = 0;
      for (const id of selectedIds) {
        try {
          await deleteChapter(id).unwrap();
          ok++;
        } catch {
          err++;
        }
      }
      setSelectedIds(new Set());
      if (err === 0) toast.success(`Удалено глав: ${ok}`);
      else toast.error(`Удалено: ${ok}, ошибок: ${err}`);
    } catch {
      toast.error("Ошибка при удалении");
    } finally {
      setIsDeleting(false);
    }
  }, [selectedCount, selectedIds, deleteChapter, toast]);

  const handleDeleteChaptersWithoutPages = useCallback(async () => {
    if (countWithoutPages === 0) {
      toast.info("Нет глав без страниц");
      return;
    }
    if (
      !confirm(
        `Удалить ${countWithoutPages} глав без страниц? Это действие нельзя отменить.`,
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      let ok = 0;
      let err = 0;
      for (const ch of chaptersWithoutPages) {
        try {
          await deleteChapter(ch._id).unwrap();
          ok++;
          setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(ch._id);
            return next;
          });
        } catch {
          err++;
        }
      }
      if (err === 0) toast.success(`Удалено глав без страниц: ${ok}`);
      else toast.error(`Удалено: ${ok}, ошибок: ${err}`);
    } catch {
      toast.error("Ошибка при удалении");
    } finally {
      setIsDeleting(false);
    }
  }, [countWithoutPages, chaptersWithoutPages, deleteChapter, toast]);

  const handleSyncEmptyChaptersFromSource = useCallback(async () => {
    if (countWithoutPages === 0) {
      toast.info("Нет глав без страниц для синхронизации");
      return;
    }
    if (!syncSourceUrl) {
      toast.error("У задачи автопарсинга не задан URL источника");
      return;
    }
    if (
      !confirm(
        `Синхронизировать ${countWithoutPages} глав без страниц с источником? Будет загружено содержимое с источника.`,
      )
    ) {
      return;
    }
    setIsSyncingEmpty(true);
    try {
      const res = await dispatch(
        mangaParserApi.endpoints.syncChapters.initiate({
          titleId,
          sourceUrl: syncSourceUrl,
          chapterNumbers: chaptersWithoutPages.map(ch => ch.chapterNumber ?? 0).filter(Boolean),
        }),
      ).unwrap();
      if (res.data) {
        const { synced, errors } = res.data;
        const syncedNumbers = Array.isArray(synced)
          ? synced.map(s => (typeof s === "number" ? s : (s as { chapterNumber?: number })?.chapterNumber)).filter((n): n is number => typeof n === "number")
          : [];
        const errorMessages = (errors || []).map(e => (typeof e === "object" && e && "message" in e ? e.message : String(e)));
        if (errorMessages.length === 0) {
          toast.success(`Синхронизировано глав: ${syncedNumbers.length}`);
        } else {
          toast.success(
            `Синхронизировано: ${syncedNumbers.length}, ошибок: ${errorMessages.length}. ${errorMessages.slice(0, 3).join("; ")}${errorMessages.length > 3 ? "…" : ""}`,
          );
        }
        dispatch(chaptersApi.util.invalidateTags([{ type: "Chapters", id: `title-${titleId}` }]));
      }
    } catch (e) {
      const message =
        e && typeof e === "object" && "data" in e
          ? String((e as { data?: { message?: string } }).data?.message ?? "Ошибка синхронизации")
          : "Ошибка синхронизации";
      toast.error(message);
    } finally {
      setIsSyncingEmpty(false);
    }
  }, [
    countWithoutPages,
    chaptersWithoutPages,
    syncSourceUrl,
    titleId,
    dispatch,
    toast,
  ]);

  const handleSort = (field: ChapterSortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: ChapterSortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    dragItem.current = index;
    setDraggedChapter(sortedChapters[index]);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    dragOverItem.current = index;
    e.preventDefault();
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
  };

  const handleDrop = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const newChapters = [...sortedChapters];
    const draggedItem = newChapters[dragItem.current];

    // Удаляем элемент из старой позиции
    newChapters.splice(dragItem.current, 1);
    // Вставляем в новую позицию
    newChapters.splice(dragOverItem.current, 0, draggedItem);

    // Обновляем номера глав
    try {
      const updatePromises = newChapters.map((chapter, index) => {
        const newChapterNumber = newChapters.length - index;
        if (chapter.chapterNumber !== newChapterNumber) {
          return updateChapter({
            id: chapter._id,
            data: { chapterNumber: newChapterNumber },
          }).unwrap();
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      toast.success("Порядок глав успешно изменен");
    } catch (error) {
      toast.error("Ошибка при изменении порядка глав");
      console.error(error);
    }

    // Сбрасываем значения
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggedChapter(null);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggedChapter(null);
  };

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Breadcrumbs
            items={[
              { name: "Главная", href: "/" },
              { name: "Админка", href: "/admin" },
              { name: "Тайтлы", href: "/admin?tab=titles" },
              { name: "Редактирование", href: `/admin/titles/edit/${titleId}` },
              { name: titleData?.name || "Тайтл", href: `/admin/titles/edit/${titleId}` },
              { name: "Главы", isCurrent: true },
            ]}
            className="mb-6"
          />
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Link
                  href={`/admin/titles/edit/${titleId}`}
                  className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm hover:bg-[var(--accent)] transition-colors"
                >
                  Назад к редактированию тайтла
                </Link>
                <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]">
                  Главы тайтла
                </h1>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Номер главы"
                    value={searchChapterNumber}
                    onChange={e => setSearchChapterNumber(e.target.value)}
                    onKeyPress={e => e.key === "Enter" && handleSearch()}
                    className="flex-1 min-w-0 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]"
                  />
                  <button
                    onClick={handleSearch}
                    className="shrink-0 px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors"
                  >
                    Найти
                  </button>
                </div>
                <Link
                  href={`/admin/titles/edit/${titleId}/chapters/new`}
                  className="px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-center text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Добавить главу
                </Link>
              </div>
            </div>
          </div>

          {!!error && (
            <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded">
              Ошибка загрузки глав. Попробуйте обновить страницу.
            </div>
          )}

          <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
            <div className="p-4 border-b border-[var(--border)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Список глав</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <span>Загружено: {sortedChapters.length} глав</span>
                  {hasMore && !isLoading && (
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                    >
                      Загрузить ещё
                    </button>
                  )}
                </div>
              </div>
              {/* Панель действий: выбор и удаление */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border)]">
                {isSomeSelected && (
                  <>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      Выбрано: {selectedCount}
                    </span>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDeleteSelected}
                      className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--destructive)] hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Удалить выбранные
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedIds(new Set())}
                      className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                    >
                      Снять выбор
                    </button>
                  </>
                )}
                {countWithoutPages > 0 && (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteChaptersWithoutPages}
                    className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--destructive)] hover:bg-red-500/10 disabled:opacity-50"
                    title={`Удалить ${countWithoutPages} глав без страниц`}
                  >
                    Удалить главы без страниц ({countWithoutPages})
                  </button>
                )}
                {countWithoutPages > 0 && autoParsingJobForTitle && syncSourceUrl && (
                  <button
                    type="button"
                    disabled={isSyncingEmpty || isDeleting}
                    onClick={handleSyncEmptyChaptersFromSource}
                    className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
                    title="Синхронизировать пустые главы с главой из источника (по задаче автопарсинга)"
                  >
                    {isSyncingEmpty ? (
                      <RefreshCw className="w-4 h-4 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw className="w-4 h-4" aria-hidden />
                    )}
                    {isSyncingEmpty ? "Синхронизация..." : "Синхронизировать пустые с источником"}
                  </button>
                )}
              </div>
            </div>

            {isLoading && currentPage === 1 ? (
              <div className="p-6 text-center text-[var(--muted-foreground)]">Загрузка глав...</div>
            ) : (
              <>
                {/* Десктоп: таблица с горизонтальным скроллом и липким заголовком */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="bg-[var(--secondary)] border-b border-[var(--border)] sticky top-0 z-10">
                        <th className="w-10 p-3 text-left">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              ref={input => {
                                if (input) input.indeterminate = isSomeSelected && !isAllSelected;
                              }}
                              onChange={toggleSelectAll}
                              className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                              aria-label="Выбрать все"
                            />
                          </label>
                        </th>
                        <th className="text-left p-3 font-medium text-[var(--foreground)] whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleSort("chapterNumber")}
                            className="flex items-center hover:text-[var(--primary)] transition-colors"
                          >
                            Глава
                            <SortIcon field="chapterNumber" />
                          </button>
                        </th>
                        <th className="text-left p-3 font-medium text-[var(--foreground)]">
                          <button
                            type="button"
                            onClick={() => handleSort("title")}
                            className="flex items-center hover:text-[var(--primary)] transition-colors"
                          >
                            Название
                            <SortIcon field="title" />
                          </button>
                        </th>
                        <th className="text-left p-3 font-medium text-[var(--foreground)] whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleSort("status")}
                            className="flex items-center hover:text-[var(--primary)] transition-colors"
                          >
                            Статус
                            <SortIcon field="status" />
                          </button>
                        </th>
                        <th className="text-left p-3 font-medium text-[var(--foreground)] whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleSort("isPublished")}
                            className="flex items-center hover:text-[var(--primary)] transition-colors"
                          >
                            Публик.
                            <SortIcon field="isPublished" />
                          </button>
                        </th>
                        <th className="text-left p-3 font-medium text-[var(--foreground)] whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleSort("pages")}
                            className="flex items-center hover:text-[var(--primary)] transition-colors"
                          >
                            Страницы
                            <SortIcon field="pages" />
                          </button>
                        </th>
                        <th className="text-left p-3 font-medium text-[var(--foreground)] whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleSort("views")}
                            className="flex items-center hover:text-[var(--primary)] transition-colors"
                          >
                            Просмотры
                            <SortIcon field="views" />
                          </button>
                        </th>
                        <th className="text-right p-3 font-medium text-[var(--foreground)] w-40">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedChapters.map((ch: Chapter, index: number) => (
                        <tr
                          key={ch._id}
                          data-chapter-id={ch._id}
                          className={`border-b border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors ${
                            foundChapter?._id === ch._id
                              ? "bg-amber-500/10 dark:bg-amber-500/20 border-l-2 border-l-amber-500"
                              : ""
                          } ${draggedChapter?._id === ch._id ? "opacity-50" : ""}`}
                          draggable
                          onDragStart={e => handleDragStart(e, index)}
                          onDragEnter={e => handleDragEnter(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onDragEnd={handleDragEnd}
                        >
                          <td className="w-10 p-3" onClick={e => e.stopPropagation()}>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                id={`${checkboxIdPrefix}-${ch._id}`}
                                checked={selectedIds.has(ch._id)}
                                onChange={() => toggleSelect(ch._id)}
                                className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                                aria-label={`Выбрать главу ${ch.chapterNumber}`}
                              />
                            </label>
                          </td>
                          <td className="p-3 font-medium">#{ch.chapterNumber}</td>
                          <td className="p-3 text-[var(--foreground)] max-w-[200px] truncate">
                            {ch.title || ch.name || "-"}
                          </td>
                          <td className="p-3">
                            <span className={getChapterStatusStyles(ch)}>
                              {getChapterStatusLabel(ch)}
                            </span>
                          </td>
                          <td className="p-3 text-[var(--muted-foreground)]">
                            {ch.isPublished ? "Да" : "Нет"}
                          </td>
                          <td className="p-3 text-[var(--muted-foreground)]">
                            {ch.pages?.length ?? ch.images?.length ?? 0}
                          </td>
                          <td className="p-3 text-[var(--muted-foreground)]">
                            {(ch.views ?? 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            <div className="inline-flex flex-wrap justify-end gap-1.5">
                              <Link
                                href={`/titles/${titleData?.slug || titleId}/chapter/${ch._id}`}
                                className="px-2 py-1 rounded border border-[var(--border)] text-xs hover:bg-[var(--accent)]"
                              >
                                Открыть
                              </Link>
                              <Link
                                href={`/admin/titles/edit/${titleId}/chapters/${ch._id}`}
                                className="px-2 py-1 rounded border border-[var(--border)] text-xs hover:bg-[var(--accent)]"
                              >
                                Редактировать
                              </Link>
                              <button
                                type="button"
                                className="px-2 py-1 rounded border border-[var(--border)] text-xs text-[var(--destructive)] hover:bg-red-500/10"
                                onClick={() => handleDelete(ch._id)}
                              >
                                Удалить
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Мобильный вид: карточки */}
                <div className="md:hidden divide-y divide-[var(--border)]">
                  {sortedChapters.map((ch: Chapter) => (
                    <div
                      key={ch._id}
                      data-chapter-id={ch._id}
                      className={`p-4 space-y-3 ${
                        foundChapter?._id === ch._id
                          ? "bg-amber-500/10 dark:bg-amber-500/20 border-l-4 border-l-amber-500"
                          : ""
                      } ${draggedChapter?._id === ch._id ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <label className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            id={`${checkboxIdPrefix}-mobile-${ch._id}`}
                            checked={selectedIds.has(ch._id)}
                            onChange={() => toggleSelect(ch._id)}
                            className="shrink-0 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                            aria-label={`Выбрать главу ${ch.chapterNumber}`}
                          />
                          <span className="font-semibold text-[var(--foreground)]">
                            #{ch.chapterNumber}
                          </span>
                          <span className={getChapterStatusStyles(ch)}> {getChapterStatusLabel(ch)}</span>
                          {ch.isPublished && (
                            <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">
                              · Публик.
                            </span>
                          )}
                        </label>
                      </div>
                      {(ch.title || ch.name) && (
                        <p className="text-sm text-[var(--foreground)] line-clamp-2">
                          {ch.title || ch.name}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
                        <span>Страницы: {ch.pages?.length ?? ch.images?.length ?? 0}</span>
                        <span>Просмотры: {(ch.views ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link
                          href={`/titles/${titleData?.slug || titleId}/chapter/${ch._id}`}
                          className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium hover:bg-[var(--accent)]"
                        >
                          Открыть
                        </Link>
                        <Link
                          href={`/admin/titles/edit/${titleId}/chapters/${ch._id}`}
                          className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium hover:bg-[var(--accent)]"
                        >
                          Редактировать
                        </Link>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--destructive)] hover:bg-red-500/10"
                          onClick={() => handleDelete(ch._id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {sortedChapters.length === 0 && (
                  <div className="p-6 text-center text-[var(--muted-foreground)]">
                    Пока нет глав
                  </div>
                )}

                {/* Пагинация */}
                <div className="p-4 border-t border-[var(--border)]">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-sm text-[var(--muted-foreground)]">
                      Страница {currentPage}
                      {hasMore && (
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="ml-2 sm:ml-4 px-3 py-1.5 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                        >
                          Следующая
                        </button>
                      )}
                    </div>
                    {currentPage > 1 && (
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[var(--secondary)] border border-[var(--border)] hover:bg-[var(--accent)]"
                      >
                        Предыдущая страница
                      </button>
                    )}
                  </div>
                  {!hasMore && sortedChapters.length > 0 && (
                    <div className="text-center text-[var(--muted-foreground)] text-sm mt-2">
                      Все главы загружены
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <Footer />
      </main>
    </AuthGuard>
  );
}
