import React, { useState, useMemo, useCallback } from "react";
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
  Filter,
  Grid3X3,
  List,
  X,
  CheckSquare,
  Square,
  MoreHorizontal,
  Download,
} from "lucide-react";
import Link from "next/link";
import { Title } from "@/types/title";
import { useSearchTitlesQuery, useDeleteTitleMutation } from "@/store/api/titlesApi";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";
import { useRouter } from "next/navigation";
import { translateTitleStatus } from "@/lib/title-type-translations";
import { getTitlePath } from "@/lib/title-paths";
import { AdminCard, StatCard, MiniCard } from "./ui";
import { AdminTable } from "./ui";
import Pagination from "@/shared/browse/pagination";
import { ConfirmModal, AlertModal } from "./ui";
import { formatNumber } from "@/lib/utils";
import { baseUrl } from "@/api/config";

// Helper to normalize image URLs
function getImageUrl(coverImage: string | undefined): string {
  if (!coverImage) return typeof IMAGE_HOLDER === 'string' ? IMAGE_HOLDER : IMAGE_HOLDER.src;
  
  // If it's already a full URL, return it
  if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
    return coverImage;
  }
  
  // If it's a relative URL starting with /, prepend the base URL
  if (coverImage.startsWith("/")) {
    return `${baseUrl}${coverImage}`;
  }
  
  // Otherwise, assume it's a relative path and prepend baseUrl + /
  return `${baseUrl}/${coverImage}`;
}

// Get fallback image URL
const fallbackImageUrl = typeof IMAGE_HOLDER === 'string' ? IMAGE_HOLDER : IMAGE_HOLDER.src;

// Cover image component with error handling
function CoverImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = "" 
}: { 
  src: string; 
  alt: string; 
  width: number; 
  height: number; 
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <OptimizedImage
      src={imgError ? fallbackImageUrl : src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={() => setImgError(true)}
    />
  );
}

// Grid cover image component
function GridCoverImage({ 
  title, 
  fallbackImageUrl, 
  getImageUrl 
}: { 
  title: Title; 
  fallbackImageUrl: string; 
  getImageUrl: (url: string | undefined) => string;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <OptimizedImage
      src={imgError ? fallbackImageUrl : getImageUrl(title.coverImage)}
      alt={title.name}
      className="object-cover transition-transform duration-300 group-hover:scale-105 w-full h-full"
      width={300}
      height={450}
      onError={() => setImgError(true)}
    />
  );
}

type ViewMode = "grid" | "list";
type SortField = "name" | "createdAt" | "updatedAt" | "releaseYear" | "totalChapters" | "views";
type SortDirection = "asc" | "desc";

interface TitlesSectionProps {
  onTitleSelect: (titleId: string) => void;
}

// Status filter options
const statusFilters = [
  { value: "all", label: "Все", color: "gray" },
  { value: "ongoing", label: "Онгоинг", color: "green" },
  { value: "completed", label: "Завершён", color: "blue" },
  { value: "hiatus", label: "Приостановлен", color: "yellow" },
  { value: "cancelled", label: "Отменён", color: "red" },
];

export function TitlesSection({ onTitleSelect }: TitlesSectionProps) {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [titleToDelete, setTitleToDelete] = useState<{ id: string; name: string } | null>(null);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({ isOpen: false, title: "", message: "", type: "success" });

  // API hooks — используем пагинацию для отображения всех тайтлов
  const PAGE_SIZE = 50;
  const { data: titlesResponse, isLoading } = useSearchTitlesQuery({
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page: currentPage,
    limit: PAGE_SIZE,
  });
  const [deleteTitle, { isLoading: isDeleting }] = useDeleteTitleMutation();
  const router = useRouter();

  // Сброс страницы при изменении поиска или фильтра
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Filter and sort titles
  const filteredTitles = useMemo(() => {
    let items = titlesResponse?.data?.data || [];

    // Apply status filter
    if (statusFilter !== "all") {
      items = items.filter((title: Title) => title.status === statusFilter);
    }

    // Apply sorting
    items = [...items].sort((a: Title, b: Title) => {
      let aVal: string | number | Date | undefined;
      let bVal: string | number | Date | undefined;

      switch (sortField) {
        case "name":
          aVal = a.name?.toLowerCase();
          bVal = b.name?.toLowerCase();
          break;
        case "createdAt":
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        case "updatedAt":
          aVal = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          bVal = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          break;
        case "releaseYear":
          aVal = a.releaseYear || 0;
          bVal = b.releaseYear || 0;
          break;
        case "totalChapters":
          aVal = a.totalChapters || 0;
          bVal = b.totalChapters || 0;
          break;
        case "views":
          aVal = a.views || 0;
          bVal = b.views || 0;
          break;
        default:
          return 0;
      }

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return items;
  }, [titlesResponse, sortField, sortDirection, statusFilter]);

  // Stats — total из API, ongoing/completed из текущей страницы (приблизительно)
  const apiTotal = titlesResponse?.data?.total ?? 0;
  const apiTotalPages = titlesResponse?.data?.totalPages ?? 1;
  const currentPageTitles = titlesResponse?.data?.data || [];
  const stats = useMemo(() => {
    const titles = currentPageTitles;
    return {
      total: apiTotal,
      ongoing: statusFilter === "ongoing" ? apiTotal : titles.filter((t: Title) => t.status === "ongoing").length,
      completed: statusFilter === "completed" ? apiTotal : titles.filter((t: Title) => t.status === "completed").length,
      totalViews: titles.reduce((sum: number, t: Title) => sum + (t.views || 0), 0),
    };
  }, [titlesResponse, statusFilter, apiTotal, currentPageTitles]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setTitleToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!titleToDelete) return;

    try {
      await deleteTitle(titleToDelete.id).unwrap();
      setAlertModal({
        isOpen: true,
        title: "Успешно",
        message: `Тайтл "${titleToDelete.name}" удалён`,
        type: "success",
      });
      setSelectedIds(prev => prev.filter(id => id !== titleToDelete.id));
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: "Ошибка",
        message: "Не удалось удалить тайтл",
        type: "error",
      });
    } finally {
      setDeleteModalOpen(false);
      setTitleToDelete(null);
    }
  };

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === filteredTitles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTitles.map((t: Title) => t._id));
    }
  }, [selectedIds.length, filteredTitles]);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = confirm(
      `Удалить ${selectedIds.length} тайтлов? Это действие нельзя отменить.`,
    );
    if (!confirmed) return;

    setIsBulkDeleting(true);
    try {
      const results = await Promise.allSettled(selectedIds.map(id => deleteTitle(id).unwrap()));
      const failedCount = results.filter(result => result.status === "rejected").length;
      const successCount = results.length - failedCount;

      if (failedCount === 0) {
        setAlertModal({
          isOpen: true,
          title: "Успешно",
          message: `Удалено ${successCount} тайтлов`,
          type: "success",
        });
        setSelectedIds([]);
        return;
      }

      setAlertModal({
        isOpen: true,
        title: "Удаление завершено с ошибками",
        message: `Удалено ${successCount}, ошибок: ${failedCount}`,
        type: "error",
      });
      setSelectedIds(prev =>
        prev.filter((_, index) => results[index]?.status === "rejected"),
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-[var(--admin-radius)] text-sm transition-colors ${
        sortField === field
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/80"
      }`}
    >
      {label}
      {sortField === field &&
        (sortDirection === "asc" ? (
          <ArrowUp className="w-3.5 h-3.5" />
        ) : (
          <ArrowDown className="w-3.5 h-3.5" />
        ))}
    </button>
  );

  // Table columns for list view
  const tableColumns = [
    {
      key: "cover",
      header: "Обложка",
      width: "80px",
      render: (title: Title) => (
        <div className="relative w-12 h-16 rounded overflow-hidden bg-[var(--muted)]">
          <CoverImage
            src={getImageUrl(title.coverImage)}
            alt={title.name}
            className="object-cover w-full h-full"
            width={48}
            height={64}
          />
        </div>
      ),
    },
    {
      key: "name",
      header: "Название",
      sortable: true,
      render: (title: Title) => (
        <div>
          <p className="font-medium text-[var(--foreground)]">{title.name}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{title.author || "—"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Статус",
      sortable: true,
      render: (title: Title) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            title.status === "ongoing"
              ? "bg-green-500/10 text-green-600"
              : title.status === "completed"
              ? "bg-blue-500/10 text-blue-600"
              : "bg-gray-500/10 text-gray-600"
          }`}
        >
          {translateTitleStatus(title.status)}
        </span>
      ),
    },
    {
      key: "chapters",
      header: "Главы",
      sortable: true,
      render: (title: Title) => (
        <span className="text-sm">{title.totalChapters || 0}</span>
      ),
    },
    {
      key: "year",
      header: "Год",
      sortable: true,
      render: (title: Title) => (
        <span className="text-sm text-[var(--muted-foreground)]">
          {title.releaseYear || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          value={stats.total}
          label="Всего тайтлов"
          icon={<Grid3X3 className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          value={stats.ongoing}
          label="Онгоинг"
          icon={<AlertCircle className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          value={stats.completed}
          label="Завершены"
          icon={<CheckCircle className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          value={formatNumber(stats.totalViews)}
          label="Просмотры"
          icon={<Eye className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* Toolbar */}
      <AdminCard noPadding>
        <div className="p-4 space-y-4">
          {/* Search and main actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Поиск тайтлов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-input w-full pl-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* View mode toggle */}
              <div className="flex bg-[var(--accent)] rounded-[var(--admin-radius)] p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-[var(--card)] text-[var(--primary)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-[var(--card)] text-[var(--primary)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-[var(--admin-radius)] border transition-colors ${
                  showFilters
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                    : "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>

              {/* Add button */}
              <button
                onClick={() => router.push("/admin/titles/new")}
                className="admin-btn admin-btn-primary flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Создать</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--border)]">
              <span className="text-sm text-[var(--muted-foreground)]">Сортировка:</span>
              <div className="flex flex-wrap gap-2">
                <SortButton field="name" label="Название" />
                <SortButton field="createdAt" label="Дата создания" />
                <SortButton field="updatedAt" label="Обновление" />
                <SortButton field="releaseYear" label="Год" />
                <SortButton field="totalChapters" label="Главы" />
              </div>

              <div className="w-px h-6 bg-[var(--border)] mx-2 hidden sm:block" />

              <span className="text-sm text-[var(--muted-foreground)]">Статус:</span>
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`px-3 py-1.5 rounded-[var(--admin-radius)] text-sm transition-colors ${
                      statusFilter === filter.value
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/80"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bulk actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 pt-3 border-t border-[var(--border)] bg-[var(--primary)]/5 -mx-4 px-4 py-2">
              <span className="text-sm font-medium text-[var(--primary)]">
                Выбрано: {selectedIds.length}
              </span>
              <button
                onClick={handleSelectAll}
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                {selectedIds.length === filteredTitles.length ? "Снять все" : "Выбрать все"}
              </button>
              <div className="flex-1" />
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded-[var(--admin-radius)] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {isBulkDeleting ? "Удаление..." : "Удалить"}
              </button>
            </div>
          )}
        </div>
      </AdminCard>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)] overflow-hidden"
            >
              <div className="aspect-[2/3] bg-[var(--muted)] animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-[var(--muted)] rounded animate-pulse w-3/4" />
                <div className="h-3 bg-[var(--muted)] rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTitles.length === 0 ? (
        <div className="text-center py-12 bg-[var(--card)] rounded-[var(--admin-radius)] border border-[var(--border)]">
          <Grid3X3 className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">Тайтлы не найдены</h3>
          <p className="text-[var(--muted-foreground)]">
            {searchTerm ? "Попробуйте изменить поисковый запрос" : "Нет тайтлов для отображения"}
          </p>
        </div>
      ) : viewMode === "list" ? (
        /* List View */
        <AdminTable
          data={filteredTitles}
          columns={tableColumns}
          keyExtractor={(title) => title._id}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          actions={(title) => (
            <>
              <Link
                href={getTitlePath(title)}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded transition-colors"
                title="Просмотреть"
                target="_blank"
              >
                <Eye className="w-4 h-4" />
              </Link>
              <button
                onClick={() => onTitleSelect(title._id)}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded transition-colors"
                title="Редактировать"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteClick(title._id, title.name)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTitles.map((title: Title) => (
            <div
              key={title._id}
              className={`group bg-[var(--card)] rounded-[var(--admin-radius)] border overflow-hidden transition-all duration-200 hover:shadow-lg ${
                selectedIds.includes(title._id)
                  ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                  : "border-[var(--border)] hover:border-[var(--primary)]/50"
              }`}
            >
              {/* Cover */}
              <div className="relative aspect-[2/3] overflow-hidden bg-[var(--muted)]">
                <GridCoverImage 
                  title={title} 
                  fallbackImageUrl={fallbackImageUrl} 
                  getImageUrl={getImageUrl} 
                />
                
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIds((prev) =>
                        prev.includes(title._id)
                          ? prev.filter((id) => id !== title._id)
                          : [...prev, title._id]
                      );
                    }}
                    className={`p-1.5 rounded-[var(--admin-radius)] transition-colors ${
                      selectedIds.includes(title._id)
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-black/50 text-white hover:bg-black/70"
                    }`}
                  >
                    {selectedIds.includes(title._id) ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded-[var(--admin-radius)] text-xs font-medium backdrop-blur-sm ${
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
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white font-medium">
                    {title.totalChapters || 0} гл.
                  </span>
                </div>

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Link
                    href={getTitlePath(title)}
                    className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                    title="Просмотреть"
                    target="_blank"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => onTitleSelect(title._id)}
                    className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                    title="Редактировать"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(title._id, title.name)}
                    className="p-3 bg-red-500/80 backdrop-blur-sm rounded-full text-white hover:bg-red-500 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-medium text-[var(--foreground)] text-sm truncate mb-1">
                  {title.name}
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] truncate">
                  {title.author || "—"}
                </p>
                <div className="flex items-center justify-between mt-2 text-xs text-[var(--muted-foreground)]">
                  <span>{title.releaseYear || "—"}</span>
                  <span>{formatNumber(title.views || 0)} просм.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filteredTitles.length > 0 && apiTotalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Страница {currentPage} из {apiTotalPages} • Всего: {apiTotal} тайтлов
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={apiTotalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTitleToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Подтвердите удаление"
        message={`Вы уверены, что хотите удалить тайтл "${titleToDelete?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        confirmVariant="danger"
        isLoading={isDeleting}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}
