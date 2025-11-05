"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useGetChaptersByTitleQuery, useDeleteChapterMutation, useSearchChaptersQuery } from "@/store/api/chaptersApi";
import { useMemo } from "react";
import { Header, Footer } from "@/widgets";

export default function ChaptersManagementPage() {
  const params = useParams();
  const titleId = (params?.id as string) || "";
  const { data: primary = [], isLoading } = useGetChaptersByTitleQuery({ titleId, sortOrder: "desc" }, { skip: !titleId });
  const { data: fallback, isLoading: isLoadingFallback } = useSearchChaptersQuery({ titleId, limit: 200, sortBy: "chapterNumber", sortOrder: "desc" }, { skip: !titleId });
  const chapters = (primary && primary.length ? primary : fallback?.chapters) || [];
  const [deleteChapter] = useDeleteChapterMutation();

  const sorted = useMemo(() => {
    // Проверяем, что chapters является массивом перед применением spread syntax
    if (!Array.isArray(chapters)) {
      return [];
    }
    return [...chapters].sort((a, b) => (b.chapterNumber ?? 0) - (a.chapterNumber ?? 0));
  }, [chapters]);

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить главу?")) return;
    try {
      await deleteChapter(id).unwrap();
    } catch (e) {
      const error = e as Error;
      alert(error?.message || "Ошибка удаления");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={`/admin/titles/edit/${titleId}`} className="px-3 py-2 rounded border">Назад к тайтлу</Link>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Главы тайтла</h1>
          </div>
          <Link href={`/admin/titles/edit/${titleId}/chapters/new`} className="px-3 py-2 rounded bg-[var(--primary)] text-[var(--primary-foreground)]">Добавить главу</Link>
        </div>

        {isLoading || isLoadingFallback ? (
          <div className="text-[var(--muted-foreground)]">Загрузка...</div>
        ) : (
          <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
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
                {sorted.map((ch) => (
                  <tr key={ch._id} className="border-b border-[var(--border)] hover:bg-[var(--accent)]/30">
                    <td className="p-3">#{ch.chapterNumber}</td>
                    <td className="p-3">{ch.title || '-'}</td>
                    <td className="p-3">{ch.status}</td>
                    <td className="p-3">{ch.isPublished ? 'Да' : 'Нет'}</td>
                    <td className="p-3">{ch.views ?? 0}</td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-2">
                        <Link href={`/browse/${titleId}/chapter/${ch._id}`} className="px-2 py-1 border rounded">Открыть</Link>
                        <Link href={`/admin/titles/edit/${titleId}/chapters/${ch._id}`} className="px-2 py-1 border rounded">Редактировать</Link>
                        <button className="px-2 py-1 border rounded text-red-600" onClick={() => handleDelete(ch._id)}>Удалить</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sorted.length === 0 && (
              <div className="p-6 text-center text-[var(--muted-foreground)]">Пока нет глав</div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}


