import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, Eye, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Title } from "@/types/title";
import {
  useSearchTitlesQuery,
  useDeleteTitleMutation,
} from "@/store/api/titlesApi";

import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { translateTitleStatus } from "@/lib/title-type-translations";

interface TitlesSectionProps {
  onTitleSelect: (titleId: string) => void;
}

export function TitlesSection({ onTitleSelect }: TitlesSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: titlesResponse, isLoading } = useSearchTitlesQuery(searchTerm ? {
    search: searchTerm,
    page: 1,
    limit: 50,
  } : { limit: 10000 });
  const [deleteTitle] = useDeleteTitleMutation();
  const router = useRouter();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{title: string, message: string} | null>(null);
  const titles = titlesResponse?.data?.data || [];

  const handleDelete = async (id: string, title: string) => {
    if (
      confirm(
        `Вы уверены, что хотите удалить тайтл "${title}"? Это действие нельзя отменить.`
      )
    ) {
      try {
        await deleteTitle(id).unwrap();
        // Показываем модальное окно с результатом
        setModalContent({
          title: "Удаление завершено",
          message: "Тайтл успешно удален"
        });
        setIsModalOpen(true);
      } catch (error) {
        console.error("Ошибка при удалении тайтла:", error);
        // Показываем модальное окно с ошибкой
        setModalContent({
          title: "Ошибка удаления",
          message: "Произошла ошибка при удалении тайтла"
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

      {/* Header with search and create button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск тайтлов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            <p className="text-[var(--muted-foreground)]">
              Загрузка тайтлов...
            </p>
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
                  <th className="text-left p-4 font-medium text-[var(--foreground)]">
                    Название
                  </th>
                  <th className="text-left p-4 font-medium text-[var(--foreground)]">
                    Автор
                  </th>
                  <th className="text-left p-4 font-medium text-[var(--foreground)]">
                    Статус
                  </th>
                  <th className="text-left p-4 font-medium text-[var(--foreground)]">
                    Глав
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
                {titles.map((title: Title) => (
                  <tr
                    key={title._id}
                    className="border-t border-[var(--border)] hover:bg-[var(--accent)]/30"
                  >
                    <td className="p-4">
                      <div className="font-medium text-[var(--foreground)]">
                        {title.name}
                      </div>
                      {title.altNames && title.altNames.length > 0 && (
                        <div className="text-sm text-[var(--muted-foreground)]">
                          {title.altNames.slice(0, 2).join(", ")}
                          {title.altNames.length > 2 && "..."}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-[var(--foreground)]">
                      {title.author}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          title.status === "ongoing"
                            ? "bg-green-100 text-green-800"
                            : title.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"

                        }`}>
                        {translateTitleStatus(title.status)}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--foreground)]">
                      {title.totalChapters || 0}
                    </td>
                    <td className="p-4 text-[var(--foreground)]">
                      {title.views?.toLocaleString() || 0}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/browse/${title._id}`}
                          className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                          title="Просмотреть"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => onTitleSelect(title._id)}
                          className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(title._id, title.name)}
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

        {/* Pagination - TODO: Implement when API supports pagination */}
      </div>
    </div>
  );
}
