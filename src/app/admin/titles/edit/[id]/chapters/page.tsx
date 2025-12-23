
"use client";

import { AuthGuard } from "@/guard/auth-guard";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGetChaptersByTitleQuery, useDeleteChapterMutation } from "@/store/api/chaptersApi";
import { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { Header, Footer } from "@/widgets";
import { useToast } from "@/hooks/useToast";
import { Chapter } from "@/types/title";


export default function ChaptersManagementPage() {
  const params = useParams();
  const titleId = (params?.id as string) || "";
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching, error } = useGetChaptersByTitleQuery(
    { titleId, page: currentPage, limit: 50, sortOrder: "desc" },
    { skip: !titleId }
  );
  const [deleteChapter] = useDeleteChapterMutation();

  // Обновляем список глав при получении новых данных
  useEffect(() => {
    if (data?.chapters) {
      if (currentPage === 1) {
        setAllChapters(data.chapters);
      } else {
        setAllChapters(prev => {
          const existingIds = new Set(prev.map(ch => ch._id));
          const newChapters = data.chapters.filter(ch => !existingIds.has(ch._id));
          return [...prev, ...newChapters];
        });
      }
      setHasMore(data.hasMore);
    }
  }, [data, currentPage]);

  // Intersection Observer для бесконечной прокрутки
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isFetching) {
          loadMoreChapters();
        }
      },
      { threshold: 0.1 }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, isLoadingMore, isFetching]);

  const loadMoreChapters = useCallback(() => {
    if (!hasMore || isLoadingMore || isFetching) return;
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
  }, [hasMore, isLoadingMore, isFetching]);

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить главу?")) {
      return;
    }
    try {
      await deleteChapter(id).unwrap();
      // Обновляем локальный список после удаления
      setAllChapters(prev => prev.filter(ch => ch._id !== id));
    } catch (e) {
      const error = e as Error;
      toast.error(error?.message || "Ошибка удаления");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Сортировка глав
  const sortedChapters = useMemo(() => {
    return [...allChapters].sort((a, b) => (b.chapterNumber ?? 0) - (a.chapterNumber ?? 0));
  }, [allChapters]);

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
          <Link
            href={`/admin/titles/edit/${titleId}/chapters/new`}
            className="px-3 py-2 rounded bg-[var(--primary)] text-[var(--primary-foreground)]"
          >
            Добавить главу
          </Link>
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
                    onClick={loadMoreChapters} 
                    className="ml-4 px-3 py-1 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded hover:opacity-90"
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? "Загрузка..." : "Загрузить еще"}
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
                  {sortedChapters.map((ch: Chapter) => (
                    <tr key={ch._id} className="border-b border-[var(--border)] hover:bg-[var(--accent)]/30">
                      <td className="p-3">#{ch.chapterNumber}</td>
                      <td className="p-3">{ch.title || "-"}</td>
                      <td className="p-3">{ch.status}</td>
                      <td className="p-3">{ch.isPublished ? "Да" : "Нет"}</td>
                      <td className="p-3">{ch.views ?? 0}</td>
                      <td className="p-3 text-right">
                        <div className="inline-flex gap-2">
                          <Link href={`/browse/${titleId}/chapter/${ch._id}`} className="px-2 py-1 border rounded">
                            Открыть
                          </Link>
                          <Link href={`/admin/titles/edit/${titleId}/chapters/${ch._id}`} className="px-2 py-1 border rounded">
                            Редактировать
                          </Link>
                          <button className="px-2 py-1 border rounded text-red-600" onClick={() => handleDelete(ch._id)}>
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {sortedChapters.length === 0 && (
                <div className="p-6 text-center text-[var(--muted-foreground)]">Пока нет глав</div>
              )}

              {/* Индикатор для бесконечной прокрутки */}
              <div ref={sentinelRef} className="p-4 text-center">
                {isLoadingMore && (
                  <div className="text-[var(--muted-foreground)]">Загрузка дополнительных глав...</div>
                )}
                {!hasMore && sortedChapters.length > 0 && (
                  <div className="text-[var(--muted-foreground)] text-sm">Все главы загружены</div>
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
