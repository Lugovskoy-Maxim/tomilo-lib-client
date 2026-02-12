import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  AlertCircle,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchTitlesQuery, useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { useGetChaptersByTitleQuery, useDeleteChapterMutation } from "@/store/api/chaptersApi";
import Pagination from "@/shared/browse/pagination";
import { getChapterPath } from "@/lib/title-paths";
import { Chapter, Title } from "@/types/title";

type ChapterSortField = "chapterNumber" | "title" | "status" | "views" | "pages" | "isPublished";
type SortDirection = "asc" | "desc";

function getChapterStatusLabel(chapter: Chapter): string {
  const s = String(chapter.status ?? "").toLowerCase();
  if (s === "draft") return "Черновик";
  if (s === "published") return "Опубликован";
  if (s === "scheduled") return "Запланирован";
  if (s === "hidden") return "Скрыт";
  if (s === "deleted") return "Удалён";
  return chapter.isPublished ? "Опубликован" : "Черновик";
}

function getChapterStatusStyles(chapter: Chapter): string {
  const s = String(chapter.status ?? "").toLowerCase();
  const base = "px-2 py-1 rounded-full text-xs font-medium";
  if (s === "draft")
    return `${base} bg-[var(--muted)] text-[var(--muted-foreground)]`;
  if (s === "published")
    return `${base} bg-emerald-500/20 text-emerald-700 dark:text-emerald-400`;
  if (s === "scheduled")
    return `${base} bg-amber-500/20 text-amber-700 dark:text-amber-400`;
  if (s === "hidden")
    return `${base} bg-orange-500/20 text-orange-700 dark:text-orange-400`;
  if (s === "deleted")
    return `${base} bg-red-500/20 text-red-700 dark:text-red-400`;
  return chapter.isPublished
    ? `${base} bg-emerald-500/20 text-emerald-700 dark:text-emerald-400`
    : `${base} bg-[var(--muted)] text-[var(--muted-foreground)]`;
}

interface ChaptersSectionProps {
  titleId: string | null;
  onTitleChange: (titleId: string | null) => void;
}

export function ChaptersSection({ titleId, onTitleChange }: ChaptersSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteChapter] = useDeleteChapterMutation();
  const [titleSearch, setTitleSearch] = useState("");
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [sortField, setSortField] = useState<ChapterSortField>("chapterNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const titleDropdownRef = useRef<HTMLDivElement>(null);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Search titles for selection
  const { data: searchResponse } = useSearchTitlesQuery(
    { search: titleSearch || undefined, limit: 20 },
    { skip: !titleSearch || titleSearch.length < 1 },
  );
  const searchTitles = searchResponse?.data?.data || [];

  // Get selected title details
  const { data: selectedTitleData, isLoading: isTitleLoading } = useGetTitleByIdQuery(
    { id: titleId! },
    { skip: !titleId },
  );
  const selectedTitle = selectedTitleData ?? null;

  // Get chapters for selected title
  const { data: chaptersResponse, isLoading } = useGetChaptersByTitleQuery(
    { titleId: titleId!, page: currentPage, limit: 100, sortOrder: "desc" },
    { skip: !titleId },
  );

  const chapters = chaptersResponse?.chapters || [];

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
          aVal = getChapterStatusLabel(a);
          bVal = getChapterStatusLabel(b);
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
          aVal = (a.pages?.length ?? a.images?.length ?? 0);
          bVal = (b.pages?.length ?? b.images?.length ?? 0);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (titleDropdownRef.current && !titleDropdownRef.current.contains(e.target as Node)) {
        setShowTitleDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset page when title changes
  useEffect(() => {
    setCurrentPage(1);
  }, [titleId]);

  const handleDelete = async (id: string, chapterNumber: number) => {
    if (!confirm(`Удалить главу #${chapterNumber}?`)) return;
    try {
      await deleteChapter(id).unwrap();
      // Показываем модальное окно с результатом
      setModalContent({
        title: "Удаление завершено",
        message: "Глава успешно удалена",
      });
      setIsModalOpen(true);
    } catch {
      // Показываем модальное окно с ошибкой
      setModalContent({
        title: "Ошибка удаления",
        message: "Произошла ошибка при удалении главы",
      });
      setIsModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Result Modal */}
      {isModalOpen && modalContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              {modalContent.title.includes("Ошибка") ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {modalContent.title}
            </h3>
            <p className="text-[var(--muted-foreground)] mb-6">{modalContent.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="admin-btn admin-btn-primary"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title selection with search */}
      <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Выберите тайтл
        </h2>
        <div className="relative" ref={titleDropdownRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={
              titleId
                ? isTitleLoading
                  ? "Загрузка..."
                  : selectedTitle?.name ?? ""
                : titleSearch
            }
            onChange={e => {
              if (titleId) {
                onTitleChange(null);
                setTitleSearch(e.target.value);
              } else {
                setTitleSearch(e.target.value);
              }
              setShowTitleDropdown(true);
            }}
            onFocus={() => setShowTitleDropdown(true)}
            placeholder="Поиск по названию или автору..."
            className="admin-input w-full pl-10"
          />
          {showTitleDropdown && (
            <div className="absolute z-20 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-[var(--admin-radius)] shadow-lg max-h-64 overflow-y-auto">
              {titleId ? (
                <button
                  type="button"
                  onClick={() => {
                    onTitleChange(null);
                    setTitleSearch("");
                    setShowTitleDropdown(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] border-b border-[var(--border)]"
                >
                  Сбросить выбор
                </button>
              ) : searchTitles.length === 0 ? (
                <div className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                  {titleSearch.length < 1
                    ? "Введите название или автора для поиска"
                    : "Ничего не найдено"}
                </div>
              ) : (
                searchTitles.map((title: Title) => (
                  <button
                    key={title._id}
                    type="button"
                    onClick={() => {
                      onTitleChange(title._id);
                      setTitleSearch("");
                      setShowTitleDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-[var(--accent)] border-b border-[var(--border)] last:border-b-0"
                  >
                    <div className="font-medium text-[var(--foreground)]">{title.name}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      {title.author ?? "—"} • {title.releaseYear ?? "—"}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {titleId && selectedTitle && (
          <div className="mt-4 p-4 bg-[var(--secondary)] rounded-[var(--admin-radius)]">
            <h3 className="font-medium text-[var(--foreground)]">{selectedTitle.name}</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Автор: {selectedTitle.author ?? "—"} • Глав: {chaptersResponse?.total ?? 0}
            </p>
          </div>
        )}
      </div>

      {titleId && (
        <>
          {/* Header with create button */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Главы тайтла</h2>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/titles/edit/${titleId}`}
                className="admin-btn admin-btn-secondary flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Редактировать тайтл
              </Link>
              <Link
                href={`/admin/titles/edit/${titleId}/chapters/new`}
                className="admin-btn admin-btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить главу
              </Link>
            </div>
          </div>

          {/* Chapters list */}
          <div className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
                <p className="text-[var(--muted-foreground)]">Загрузка глав...</p>
              </div>
            ) : chapters.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[var(--muted-foreground)]">Нет глав</p>
                <Link
                  href={`/admin/titles/edit/${titleId}/chapters/new`}
                  className="admin-btn admin-btn-primary inline-block mt-4 font-medium"
                >
                  Добавить первую главу
                </Link>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--secondary)]">
                      <tr>
                        <th className="text-left p-4 font-medium text-[var(--foreground)]">
                          <button
                            type="button"
                            onClick={() => handleSort("chapterNumber")}
                            className="flex items-center hover:text-[var(--primary)] transition-colors"
                          >
                            Глава
                            <SortIcon field="chapterNumber" />
                          </button>
                        </th>
                        <th className="text-left p-4 font-medium text-[var(--foreground)]">
                          <button
                            type="button"
                            onClick={() => handleSort("title")}
                            className="flex items-center hover:text-[var(--primary)] transition-colors"
                          >
                            Название
                            <SortIcon field="title" />
                          </button>
                        </th>
                        <th className="text-left p-4 font-medium text-[var(--foreground)]">
                          <button
                            type="button"
                            onClick={() => handleSort("status")}
                            className="flex items-center hover:text-[var(--primary)] transition-colors"
                          >
                            Статус
                            <SortIcon field="status" />
                          </button>
                        </th>
                        <th className="text-left p-4 font-medium text-[var(--foreground)]">
                          <button
                            type="button"
                            onClick={() => handleSort("isPublished")}
                            className="flex items-center hover:text-[var(--primary)] transition-colors"
                          >
                            Публик.
                            <SortIcon field="isPublished" />
                          </button>
                        </th>
                        <th className="text-left p-4 font-medium text-[var(--foreground)]">
                          <button
                            type="button"
                            onClick={() => handleSort("pages")}
                            className="flex items-center hover:text-[var(--primary)] transition-colors"
                          >
                            Страницы
                            <SortIcon field="pages" />
                          </button>
                        </th>
                        <th className="text-left p-4 font-medium text-[var(--foreground)]">
                          <button
                            type="button"
                            onClick={() => handleSort("views")}
                            className="flex items-center hover:text-[var(--primary)] transition-colors"
                          >
                            Просмотры
                            <SortIcon field="views" />
                          </button>
                        </th>
                        <th className="text-right p-4 font-medium text-[var(--foreground)]">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedChapters.map(chapter => (
                        <tr
                          key={chapter._id}
                          className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30"
                        >
                          <td className="p-4 font-medium text-[var(--foreground)]">
                            #{chapter.chapterNumber}
                            {chapter.volumeNumber && ` (Том ${chapter.volumeNumber})`}
                          </td>
                          <td className="p-4 text-[var(--foreground)]">
                            {chapter.title || chapter.name || "-"}
                          </td>
                          <td className="p-4">
                            <span className={getChapterStatusStyles(chapter)}>
                              {getChapterStatusLabel(chapter)}
                            </span>
                          </td>
                          <td className="p-4 text-[var(--foreground)]">
                            {chapter.isPublished ? "Да" : "Нет"}
                          </td>
                          <td className="p-4 text-[var(--foreground)]">
                            {chapter.pages?.length ?? chapter.images?.length ?? 0}
                          </td>
                          <td className="p-4 text-[var(--foreground)]">
                            {chapter.views?.toLocaleString() ?? 0}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={getChapterPath({ _id: titleId } as Title, chapter._id)}
                                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                                title="Просмотреть"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/admin/titles/edit/${titleId}/chapters/${chapter._id}`}
                                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                                title="Редактировать"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(chapter._id, chapter.chapterNumber)}
                                className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                title="Удалить"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {chaptersResponse && (chaptersResponse.totalPages > 1 || chaptersResponse.total > 0) && (
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 pb-4">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Страница {chaptersResponse.page} из {chaptersResponse.totalPages || 1}{" "}
                      • Всего глав: {chaptersResponse.total}
                    </p>
                    {chaptersResponse.totalPages > 1 && (
                      <Pagination
                        currentPage={chaptersResponse.page}
                        totalPages={chaptersResponse.totalPages}
                        onPageChange={handlePageChange}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
