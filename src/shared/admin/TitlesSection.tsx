import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, Eye, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Title } from "@/types/title";
import { useSearchTitlesQuery, useDeleteTitleMutation } from "@/store/api/titlesApi";

import { useRouter } from "next/navigation";
import { translateTitleStatus } from "@/lib/title-type-translations";
import { getTitlePath } from "@/lib/title-paths";

interface TitlesSectionProps {
  onTitleSelect: (titleId: string) => void;
}

export function TitlesSection({ onTitleSelect }: TitlesSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: titlesResponse, isLoading } = useSearchTitlesQuery(
    searchTerm
      ? {
          search: searchTerm,
          page: 1,
          limit: 50,
        }
      : { limit: 10000 },
  );
  const [deleteTitle] = useDeleteTitleMutation();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message: string } | null>(null);
  const titles = titlesResponse?.data?.data || [];

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Вы уверены, что хотите удалить тайтл "${title}"? Это действие нельзя отменить.`)) {
      try {
        await deleteTitle(id).unwrap();
        // Показываем модальное окно с результатом
        setModalContent({
          title: "Удаление завершено",
          message: "Тайтл успешно удален",
        });
        setIsModalOpen(true);
      } catch (error) {
        console.error("Ошибка при удалении тайтла:", error);
        // Показываем модальное окно с ошибкой
        setModalContent({
          title: "Ошибка удаления",
          message: "Произошла ошибка при удалении тайтла",
        });
        setIsModalOpen(true);
      }
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
            <p className="text-[var(--muted-foreground)] mb-6">{modalContent.message}</p>
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

      {/* Header with search and create button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск тайтлов..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <button
          onClick={() => router.push("/admin/titles/new")}
          className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Создать тайтл
        </button>
      </div>


      {/* Titles list */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
            <p className="text-[var(--muted-foreground)]">Загрузка тайтлов...</p>
          </div>
        ) : titles.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[var(--muted-foreground)]">Нет тайтлов</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--secondary)]">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-sm">
                    Название
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-sm hidden md:table-cell">
                    Автор
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-sm hidden lg:table-cell">
                    Статус
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-sm hidden sm:table-cell">
                    Глав
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-[var(--foreground)] text-sm hidden xl:table-cell">
                    Просмотры
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-[var(--foreground)] text-sm">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {titles.map((title: Title) => (
                  <tr
                    key={title._id}
                    className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--foreground)] text-sm truncate max-w-[150px] sm:max-w-[200px]">
                          {title.name}
                        </p>
                        {title.altNames && title.altNames.length > 0 && (
                          <p className="text-xs text-[var(--muted-foreground)] truncate max-w-[150px] sm:max-w-[200px] hidden xs:table-cell">
                            {title.altNames.slice(0, 2).join(", ")}
                            {title.altNames.length > 2 && "..."}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <span className="text-[var(--foreground)] text-sm truncate max-w-[100px] block">
                        {title.author || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          title.status === "ongoing"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : title.status === "completed"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {translateTitleStatus(title.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <span className="text-[var(--foreground)] text-sm font-medium">
                        {title.totalChapters || 0}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden xl:table-cell">
                      <span className="text-[var(--foreground)] text-sm">
                        {title.views?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={getTitlePath(title)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded transition-colors"
                          title="Просмотреть"
                          target="_blank"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => onTitleSelect(title._id)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(title._id, title.name)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
