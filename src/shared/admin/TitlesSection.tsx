import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import { Title } from "@/types/title";
import { useSearchTitlesQuery, useDeleteTitleMutation } from "@/store/api/titlesApi";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { useRouter } from "next/navigation";
import { translateTitleStatus } from "@/lib/title-type-translations";
import { getTitlePath } from "@/lib/title-paths";

interface TitlesSectionProps {
  onTitleSelect: (titleId: string) => void;
}

export function TitlesSection({ onTitleSelect }: TitlesSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<
    "name" | "createdAt" | "updatedAt" | "releaseYear" | "totalChapters"
  >("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
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

  // Sort and filter titles
  const sortedTitles = useMemo(() => {
    const items = titlesResponse?.data?.data || [];

    return [...items].sort((a: Title, b: Title) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case "name":
          aVal = a.name?.toLowerCase() || "";
          bVal = b.name?.toLowerCase() || "";
          break;
        case "createdAt":
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
          break;
        case "updatedAt":
          aVal = new Date(a.updatedAt || 0).getTime();
          bVal = new Date(b.updatedAt || 0).getTime();
          break;
        case "releaseYear":
          aVal = a.releaseYear || 0;
          bVal = b.releaseYear || 0;
          break;
        case "totalChapters":
          aVal = a.totalChapters || 0;
          bVal = b.totalChapters || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [titlesResponse, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: typeof sortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-[var(--muted-foreground)]" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[var(--primary)]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[var(--primary)]" />
    );
  };

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

  // Helper function to get proper image URL
  const getImageUrl = (coverImage?: string) => {
    if (!coverImage) return IMAGE_HOLDER.src;
    if (coverImage.startsWith("http")) return coverImage;
    return `${process.env.NEXT_PUBLIC_URL}${coverImage}`;
  };

  return (
    <div className="space-y-6 p-2">
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
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
          </div>
        ) : sortedTitles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--muted-foreground)]">Нет тайтлов</p>
          </div>
        ) : (
          <>
            {/* Sort Controls */}
            <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--muted-foreground)] flex items-center gap-1">
                Сортировка:
              </span>
              <button
                onClick={() => handleSort("name")}
                className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                  sortField === "name"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/80"
                }`}
              >
                По имени {getSortIcon("name")}
              </button>
              <button
                onClick={() => handleSort("releaseYear")}
                className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                  sortField === "releaseYear"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/80"
                }`}
              >
                По году {getSortIcon("releaseYear")}
              </button>
              <button
                onClick={() => handleSort("totalChapters")}
                className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                  sortField === "totalChapters"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/80"
                }`}
              >
                По главам {getSortIcon("totalChapters")}
              </button>
              <button
                onClick={() => handleSort("createdAt")}
                className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                  sortField === "createdAt"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/80"
                }`}
              >
                По дате {getSortIcon("createdAt")}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {sortedTitles.map((title: Title) => (
                <div
                  key={title._id}
                  className="border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--primary)] transition-colors"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-[3/4] w-full bg-[var(--accent)]">
                    {title.coverImage ? (
                      <OptimizedImage
                        src={getImageUrl(title.coverImage)}
                        alt={title.name}
                        className="w-full h-full object-cover"
                        width={307}
                        height={410}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--muted)]">
                        <div className="w-10 h-10 rounded-full border-2 border-[var(--muted)] border-t-[var(--primary)] animate-spin" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-1.5 right-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          title.status === "ongoing"
                            ? "bg-green-500/90 text-white"
                            : title.status === "completed"
                              ? "bg-blue-500/90 text-white"
                              : "bg-gray-500/90 text-white"
                        }`}
                      >
                        {translateTitleStatus(title.status)}
                      </span>
                    </div>
                    {/* Chapters count */}
                    <div className="absolute bottom-1.5 left-1.5">
                      <span className="px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white font-medium">
                        {title.totalChapters || 0} гл.
                      </span>
                    </div>
                  </div>

                  {/* Title Info */}
                  <div className="p-2">
                    <h3 className="font-medium text-[var(--foreground)] text-xs truncate mb-0.5">
                      {title.name}
                    </h3>
                    <p className="text-[10px] text-[var(--muted-foreground)] truncate">
                      {title.author || "—"}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-0.5 mt-2">
                      <Link
                        href={getTitlePath(title)}
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded transition-colors"
                        title="Просмотреть"
                        target="_blank"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => onTitleSelect(title._id)}
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded transition-colors"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(title._id, title.name)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
