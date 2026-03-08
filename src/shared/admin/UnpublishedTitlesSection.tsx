"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit, EyeOff, RefreshCw } from "lucide-react";
import { useGetAdminTitlesQuery } from "@/store/api/adminApi";
import { AdminTitleListItem } from "@/types/admin";
import Pagination from "@/shared/browse/pagination";
import { translateTitleStatus } from "@/lib/title-type-translations";

const LIMIT = 20;

export function UnpublishedTitlesSection() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useGetAdminTitlesQuery({
    page,
    limit: LIMIT,
    isPublished: false,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  const response = data?.data;
  const titles = response?.titles ?? [];
  const pagination = response?.pagination ?? { total: 0, page: 1, limit: LIMIT, pages: 0 };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <EyeOff className="w-5 h-5 text-[var(--muted-foreground)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Неопубликованные тайтлы
          </h2>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="admin-btn admin-btn-secondary inline-flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Обновить
        </button>
      </div>

      <div className="rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">Загрузка...</div>
        ) : isError ? (
          <div className="p-8 text-center text-[var(--destructive)]">
            Не удалось загрузить список. Попробуйте обновить.
          </div>
        ) : titles.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">
            Нет неопубликованных тайтлов.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                    <th className="text-left p-3 font-medium text-[var(--foreground)]">Название</th>
                    <th className="text-left p-3 font-medium text-[var(--foreground)] hidden sm:table-cell">
                      Slug
                    </th>
                    <th className="text-left p-3 font-medium text-[var(--foreground)]">Статус</th>
                    <th className="text-right p-3 font-medium text-[var(--foreground)]">Главы</th>
                    <th className="text-right p-3 font-medium text-[var(--foreground)] hidden md:table-cell">
                      Обновлён
                    </th>
                    <th className="w-24 p-3" aria-label="Действия" />
                  </tr>
                </thead>
                <tbody>
                  {titles.map((title: AdminTitleListItem) => (
                    <tr
                      key={title._id}
                      className="border-b border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors"
                    >
                      <td className="p-3">
                        <span className="font-medium text-[var(--foreground)]">{title.name}</span>
                      </td>
                      <td className="p-3 text-[var(--muted-foreground)] hidden sm:table-cell truncate max-w-[180px]">
                        {title.slug}
                      </td>
                      <td className="p-3">
                        <span className="text-[var(--muted-foreground)]">
                          {translateTitleStatus(title.status ?? "") || title.status || "—"}
                        </span>
                      </td>
                      <td className="p-3 text-right text-[var(--muted-foreground)]">
                        {title.totalChapters ?? 0}
                      </td>
                      <td className="p-3 text-right text-[var(--muted-foreground)] hidden md:table-cell">
                        {title.updatedAt
                          ? new Date(title.updatedAt).toLocaleDateString("ru-RU", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/admin/titles/edit/${title._id}`}
                          className="admin-btn admin-btn-secondary inline-flex items-center gap-1.5 px-2 py-1.5 text-xs"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Редактировать
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.pages > 1 && (
              <div className="p-3 border-t border-[var(--border)]">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
