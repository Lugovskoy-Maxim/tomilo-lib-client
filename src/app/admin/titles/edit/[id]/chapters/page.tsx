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
import { useMemo, useCallback, useState, useRef } from "react";
import { Header, Footer } from "@/widgets";
import { useToast } from "@/hooks/useToast";
import { Chapter } from "@/types/title";


export default function ChaptersManagementPage() {
  const params = useParams();
  const titleId = (params?.id as string) || "";
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchChapterNumber, setSearchChapterNumber] = useState("");
  const [foundChapter, setFoundChapter] = useState<Chapter | null>(null);
  const [draggedChapter, setDraggedChapter] = useState<Chapter | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const { data: titleData } = useGetTitleByIdQuery({ id: titleId }, { skip: !titleId });
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
      toast.success("Глава удалена");
    } catch (e) {
      const error = e as Error;
      toast.error(error?.message || "Ошибка удаления");
    }
  };

  // Сортировка глав
  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => (b.chapterNumber ?? 0) - (a.chapterNumber ?? 0));
  }, [chapters]);

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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href={`/admin/titles/edit/${titleId}`} className="px-3 py-2 rounded border">
                Назад к редактированию тайтла
              </Link>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Главы тайтла</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Поиск по номеру главы */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Номер главы"
                  value={searchChapterNumber}
                  onChange={e => setSearchChapterNumber(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && handleSearch()}
                  className="px-3 py-2 border rounded text-sm w-32"
                />
                <button
                  onClick={handleSearch}
                  className="px-3 py-2 border rounded text-sm bg-[var(--secondary)] hover:bg-[var(--accent)]"
                >
                  Найти
                </button>
              </div>
              <Link
                href={`/admin/titles/edit/${titleId}/chapters/new`}
                className="px-3 py-2 rounded bg-[var(--primary)] text-[var(--primary-foreground)]"
              >
                Добавить главу
              </Link>
            </div>
          </div>

          {error && (
            <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded">
              Ошибка загрузки глав. Попробуйте обновить страницу.
            </div>
          )}

          <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
            <div className="p-4 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Список глав</h2>
                <div className="text-sm text-[var(--muted-foreground)]">
                  Загружено: {sortedChapters.length} глав
                  {hasMore && !isLoading && (
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="ml-4 px-3 py-1 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded hover:opacity-90"
                    >
                      Загрузить ещё
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isLoading && currentPage === 1 ? (
              <div className="p-6 text-center text-[var(--muted-foreground)]">Загрузка глав...</div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--secondary)] border-b border-[var(--border)]">
                      <th className="text-left p-3">Глава</th>
                      <th className="text-left p-3">Название</th>
                      <th className="text-left p-3">Статус</th>
                      <th className="text-left p-3">Публик.</th>
                      <th className="text-left p-3">Просмотры</th>
                      <th className="text-right p-3">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedChapters.map((ch: Chapter, index: number) => (
                      <tr
                        key={ch._id}
                        data-chapter-id={ch._id}
                        className={`border-b border-[var(--border)] hover:bg-[var(--accent)]/30 ${
                          foundChapter?._id === ch._id ? "bg-yellow-100 border-yellow-300" : ""
                        } ${draggedChapter?._id === ch._id ? "opacity-50" : ""}`}
                        draggable
                        onDragStart={e => handleDragStart(e, index)}
                        onDragEnter={e => handleDragEnter(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                      >
                        <td className="p-3">#{ch.chapterNumber}</td>
                        <td className="p-3">{ch.title || "-"}</td>
                        <td className="p-3">{ch.status}</td>
                        <td className="p-3">{ch.isPublished ? "Да" : "Нет"}</td>
                        <td className="p-3">{ch.views ?? 0}</td>
                        <td className="p-3 text-right">
                          <div className="inline-flex gap-2">
                            <Link
                              href={`/titles/${titleData?.slug || titleId}/chapter/${ch._id}`}
                              className="px-2 py-1 border rounded"
                            >
                              Открыть
                            </Link>
                            <Link
                              href={`/admin/titles/edit/${titleId}/chapters/${ch._id}`}
                              className="px-2 py-1 border rounded"
                            >
                              Редактировать
                            </Link>
                            <button
                              className="px-2 py-1 border rounded text-red-600"
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

                {sortedChapters.length === 0 && (
                  <div className="p-6 text-center text-[var(--muted-foreground)]">
                    Пока нет глав
                  </div>
                )}

                {/* Пагинация */}
                <div className="p-4 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-[var(--muted-foreground)]">
                      Страница {currentPage}
                      {hasMore && (
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="ml-4 px-3 py-1 text-sm bg-[var(--secondary)] border rounded hover:bg-[var(--accent)]"
                        >
                          Следующая страница
                        </button>
                      )}
                    </div>
                    {currentPage > 1 && (
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="px-3 py-1 text-sm bg-[var(--secondary)] border rounded hover:bg-[var(--accent)]"
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
