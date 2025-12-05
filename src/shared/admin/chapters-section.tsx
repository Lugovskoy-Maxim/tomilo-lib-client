import { Plus, Search, Edit, Trash2, Eye, BookOpen, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useGetTitlesQuery } from "@/store/api/titlesApi";
import {
  useGetChaptersByTitleQuery,
  useDeleteChapterMutation,
} from "@/store/api/chaptersApi";
import { useToast } from "@/hooks/useToast";
import Pagination from "@/shared/browse/pagination";

interface ChaptersSectionProps {
  titleId: string | null;
  onTitleChange: (titleId: string | null) => void;
}

export function ChaptersSection({
  titleId,
  onTitleChange,
}: ChaptersSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteChapter] = useDeleteChapterMutation();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{title: string, message: string} | null>(null);

  // Get titles for selection
  const { data: titlesResponse } = useGetTitlesQuery();

  const titles = titlesResponse?.data?.titles || [];

  // Get chapters for selected title
  const { data: chaptersResponse, isLoading } = useGetChaptersByTitleQuery(
    { titleId: titleId!, page: currentPage, limit: 10000, sortOrder: "desc" },
    { skip: !titleId }
  );

  const chapters = chaptersResponse?.chapters || [];

  const selectedTitle = titles.find((t) => t._id === titleId);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
        message: "Глава успешно удалена"
      });
      setIsModalOpen(true);
    } catch (error) {
      // Показываем модальное окно с ошибкой
      setModalContent({
        title: "Ошибка удаления",
        message: "Произошла ошибка при удалении главы"
      });
      setIsModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Result Modal */}
      {isModalOpen && modalContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              {modalContent.title.includes("Ошибка") ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {modalContent.title}
            </h3>
            <p className="text-[var(--muted-foreground)] mb-6">
              {modalContent.message}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title selection */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Выберите тайтл
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
          <select
            value={titleId || ""}
            onChange={(e) => onTitleChange(e.target.value || null)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="">Выберите тайтл...</option>
            {titles.map((title) => (
              <option key={title._id} value={title._id}>
                {title.name} - {title.author}
              </option>
            ))}
          </select>
        </div>
        {selectedTitle && (
          <div className="mt-4 p-4 bg-[var(--secondary)] rounded-lg">
            <h3 className="font-medium text-[var(--foreground)]">
              {selectedTitle.name}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Автор: {selectedTitle.author} • Глав:{" "}
              {selectedTitle.totalChapters || 0}
            </p>
          </div>
        )}
      </div>

      {titleId && (
        <>
          {/* Header with create button */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Главы тайтла
            </h2>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/titles/edit/${titleId}`}
                className="px-4 py-2 bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] rounded-lg font-medium hover:bg-[var(--accent)] transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Редактировать тайтл
              </Link>
              <Link
                href={`/admin/titles/edit/${titleId}/chapters/new`}
                className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить главу
              </Link>
            </div>
          </div>

          {/* Chapters list */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
                <p className="text-[var(--muted-foreground)]">
                  Загрузка глав...
                </p>
              </div>
            ) : chapters.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[var(--muted-foreground)]">Нет глав</p>
                <Link
                  href={`/admin/titles/edit/${titleId}/chapters/new`}
                  className="inline-block mt-4 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors"
                >
                  Добавить первую главу
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--secondary)]">
                    <tr>
                      <th className="text-left p-4 font-medium text-[var(--foreground)]">
                        Глава
                      </th>
                      <th className="text-left p-4 font-medium text-[var(--foreground)]">
                        Название
                      </th>
                      <th className="text-left p-4 font-medium text-[var(--foreground)]">
                        Статус
                      </th>
                      <th className="text-left p-4 font-medium text-[var(--foreground)]">
                        Публик.
                      </th>
                      <th className="text-left p-4 font-medium text-[var(--foreground)]">
                        Просмотры
                      </th>
                      <th className="text-right p-4 font-medium text-[var(--foreground)]">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapters.map((chapter) => (
                      <tr
                        key={chapter._id}
                        className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30"
                      >
                        <td className="p-4 font-medium text-[var(--foreground)]">
                          #{chapter.chapterNumber}
                          {chapter.volumeNumber &&
                            ` (Том ${chapter.volumeNumber})`}
                        </td>
                        <td className="p-4 text-[var(--foreground)]">
                          {chapter.title || "-"}
                        </td>
                        {/* <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              chapter.status === "draft"
                                ? "bg-gray-100 text-gray-800"
                                : chapter.status === "published"
                                ? "bg-green-100 text-green-800"
                                : chapter.status === "scheduled"
                                ? "bg-yellow-100 text-yellow-800"
                                : chapter.status === "hidden"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {chapter.status === "draft"
                              ? "Черновик"
                              : chapter.status === "published"
                              ? "Опубликован"
                              : chapter.status === "scheduled"
                              ? "Запланирован"
                              : chapter.status === "hidden"
                              ? "Скрыт"
                              : "Удален"}
                          </span>
                        </td> */}
                        <td className="p-4 text-[var(--foreground)]">
                          {chapter.isPublished ? "Да" : "Нет"}
                        </td>
                        <td className="p-4 text-[var(--foreground)]">
                          {chapter.views?.toLocaleString() || 0}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/browse/${titleId}/chapter/${chapter._id}`}
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
                              onClick={() =>
                                handleDelete(chapter._id, chapter.chapterNumber)
                              }
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
            )}
            {chaptersResponse && chaptersResponse.totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={chaptersResponse.page}
                  totalPages={chaptersResponse.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
