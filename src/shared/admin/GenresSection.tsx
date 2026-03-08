"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Tag,
  Merge,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  BarChart3,
} from "lucide-react";
import {
  useGetGenresQuery,
  useCreateGenreMutation,
  useUpdateGenreMutation,
  useDeleteGenreMutation,
  useMergeGenresMutation,
  type Genre,
} from "@/store/api/genresApi";
import { AdminCard, AdminModal, ConfirmModal } from "./ui";
import { useToast } from "@/hooks/useToast";
import { Pagination } from "@/shared/ui/pagination";

type GenreSortField = "name" | "titlesCount" | "createdAt";
type SortDirection = "asc" | "desc";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
};

export function GenresSection() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Genre | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSource, setMergeSource] = useState<Genre | null>(null);
  const [mergeTarget, setMergeTarget] = useState<Genre | null>(null);
  const [sortField, setSortField] = useState<GenreSortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [minTitlesFilter, setMinTitlesFilter] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: genresData,
    isLoading,
    error,
    refetch,
  } = useGetGenresQuery({
    search: debouncedSearch,
    page: currentPage,
    limit: 50,
  });

  const [createGenre, { isLoading: isCreating }] = useCreateGenreMutation();
  const [updateGenre, { isLoading: isUpdating }] = useUpdateGenreMutation();
  const [deleteGenre] = useDeleteGenreMutation();
  const [mergeGenres, { isLoading: isMerging }] = useMergeGenresMutation();

  const rawGenres = genresData?.data?.genres || [];
  const pagination = genresData?.data?.pagination || { total: 0, page: 1, limit: 50, pages: 0 };

  const filteredAndSortedGenres = useMemo(() => {
    const filtered = rawGenres.filter(g => g.titlesCount >= minTitlesFilter);

    return [...filtered].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "titlesCount":
          aVal = a.titlesCount || 0;
          bVal = b.titlesCount || 0;
          break;
        case "createdAt":
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal, "ru")
          : bVal.localeCompare(aVal, "ru");
      }

      return sortDirection === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
  }, [rawGenres, sortField, sortDirection, minTitlesFilter]);

  const genres = filteredAndSortedGenres;

  const stats = useMemo(() => {
    const total = rawGenres.length;
    const withTitles = rawGenres.filter(g => (g.titlesCount || 0) > 0).length;
    const empty = total - withTitles;
    const totalTitlesUsage = rawGenres.reduce((sum, g) => sum + (g.titlesCount || 0), 0);
    const avgTitles = total > 0 ? Math.round(totalTitlesUsage / total) : 0;
    const mostUsed = [...rawGenres].sort((a, b) => (b.titlesCount || 0) - (a.titlesCount || 0))[0];
    return { total, withTitles, empty, totalTitlesUsage, avgTitles, mostUsed };
  }, [rawGenres]);

  const handleSort = useCallback(
    (field: GenreSortField) => {
      if (field === sortField) {
        setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection(field === "name" ? "asc" : "desc");
      }
    },
    [sortField],
  );

  const handleExportCSV = useCallback(() => {
    const headers = ["ID", "Название", "Slug", "Тайтлов", "Описание"];
    const rows = genres.map(g => [g._id, g.name, g.slug, g.titlesCount || 0, g.description || ""]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `genres_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Экспорт завершён");
  }, [genres, toast]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s-]/gi, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const openCreate = () => {
    setEditingGenre(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (genre: Genre) => {
    setEditingGenre(genre);
    setForm({
      name: genre.name,
      slug: genre.slug,
      description: genre.description || "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Название жанра обязательно");
      return;
    }

    try {
      if (editingGenre) {
        await updateGenre({
          id: editingGenre._id,
          name: form.name,
          slug: form.slug || generateSlug(form.name),
          description: form.description || undefined,
        }).unwrap();
        toast.success("Жанр обновлён");
      } else {
        await createGenre({
          name: form.name,
          slug: form.slug || generateSlug(form.name),
          description: form.description || undefined,
        }).unwrap();
        toast.success("Жанр создан");
      }
      setIsFormOpen(false);
      setForm(emptyForm);
      refetch();
    } catch (err) {
      toast.error(editingGenre ? "Ошибка при обновлении жанра" : "Ошибка при создании жанра");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteGenre(deleteTarget._id).unwrap();
      toast.success("Жанр удалён");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error("Ошибка при удалении жанра");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleMerge = async () => {
    if (!mergeSource || !mergeTarget) return;
    try {
      await mergeGenres({
        sourceId: mergeSource._id,
        targetId: mergeTarget._id,
      }).unwrap();
      toast.success(`Жанр "${mergeSource.name}" объединён с "${mergeTarget.name}"`);
      setMergeMode(false);
      setMergeSource(null);
      setMergeTarget(null);
      refetch();
    } catch (err) {
      toast.error("Ошибка при объединении жанров");
    }
  };

  const handleGenreClick = (genre: Genre) => {
    if (!mergeMode) return;
    if (!mergeSource) {
      setMergeSource(genre);
    } else if (mergeSource._id === genre._id) {
      setMergeSource(null);
    } else {
      setMergeTarget(genre);
    }
  };

  if (error) {
    return (
      <AdminCard title="Жанры" icon={<Tag className="w-5 h-5" />}>
        <div className="text-center py-8">
          <p className="text-[var(--destructive)]">Ошибка загрузки жанров</p>
          <button onClick={() => refetch()} className="mt-2 admin-btn-secondary">
            Повторить
          </button>
        </div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 min-[480px]:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">Всего жанров</p>
          <p className="mt-1 text-lg sm:text-xl font-bold text-[var(--foreground)]">
            {stats.total}
          </p>
        </div>
        <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">С тайтлами</p>
          <p className="mt-1 text-lg sm:text-xl font-bold text-green-500">{stats.withTitles}</p>
        </div>
        <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">Пустых</p>
          <p className="mt-1 text-lg sm:text-xl font-bold text-yellow-500">{stats.empty}</p>
        </div>
        <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">Среднее исп.</p>
          <p className="mt-1 text-lg sm:text-xl font-bold text-[var(--foreground)]">
            {stats.avgTitles}
          </p>
        </div>
        {stats.mostUsed && (
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)] col-span-2 min-[480px]:col-span-1">
            <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">Популярный</p>
            <p className="mt-1 text-sm sm:text-base font-bold text-[var(--primary)] truncate">
              {stats.mostUsed.name}
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
              {stats.mostUsed.titlesCount} тайтлов
            </p>
          </div>
        )}
      </div>

      <AdminCard
        title="Управление жанрами"
        icon={<Tag className="w-4 h-4 sm:w-5 sm:h-5" />}
        action={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleExportCSV}
              className="admin-btn-secondary flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
              title="Экспорт CSV"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => {
                setMergeMode(!mergeMode);
                setMergeSource(null);
                setMergeTarget(null);
              }}
              className={`admin-btn-secondary flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ${
                mergeMode ? "bg-orange-500/20 border-orange-500 text-orange-500" : ""
              }`}
            >
              <Merge className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden min-[400px]:inline">
                {mergeMode ? "Отмена" : "Объединить"}
              </span>
            </button>
            <button
              onClick={openCreate}
              className="admin-btn-primary flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden min-[400px]:inline">Добавить</span>
            </button>
          </div>
        }
      >
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск жанров..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="admin-input w-full pl-10 text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                <select
                  value={sortField}
                  onChange={e => handleSort(e.target.value as GenreSortField)}
                  className="bg-transparent text-xs sm:text-sm text-[var(--foreground)] outline-none"
                >
                  <option value="name">По названию</option>
                  <option value="titlesCount">По тайтлам</option>
                  <option value="createdAt">По дате</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortDirection(prev => (prev === "asc" ? "desc" : "asc"))}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {sortDirection === "asc" ? (
                    <ArrowUp className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1">
                <BarChart3 className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                <select
                  value={minTitlesFilter}
                  onChange={e => setMinTitlesFilter(Number(e.target.value))}
                  className="bg-transparent text-xs sm:text-sm text-[var(--foreground)] outline-none"
                >
                  <option value={0}>Все</option>
                  <option value={1}>≥1 тайтл</option>
                  <option value={5}>≥5 тайтлов</option>
                  <option value={10}>≥10 тайтлов</option>
                  <option value={50}>≥50 тайтлов</option>
                </select>
              </div>
              <div className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                {genres.length} из {pagination.total}
              </div>
            </div>
          </div>

          {mergeMode && (
            <div className="p-3 sm:p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <div className="flex items-center gap-2 text-orange-500 font-medium mb-1.5 sm:mb-2 text-sm">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Режим объединения</span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-2 sm:mb-3">
                Выберите два жанра. Первый будет удалён, тайтлы перенесены во второй.
              </p>
              <div className="flex flex-col min-[400px]:flex-row flex-wrap items-start min-[400px]:items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm">
                  <span className="text-[var(--muted-foreground)]">Источник: </span>
                  {mergeSource ? (
                    <span className="font-medium text-[var(--foreground)]">{mergeSource.name}</span>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">—</span>
                  )}
                </span>
                <span className="text-[var(--muted-foreground)] hidden min-[400px]:inline">→</span>
                <span className="text-xs sm:text-sm">
                  <span className="text-[var(--muted-foreground)]">Цель: </span>
                  {mergeTarget ? (
                    <span className="font-medium text-[var(--foreground)]">{mergeTarget.name}</span>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">—</span>
                  )}
                </span>
                {mergeSource && mergeTarget && (
                  <button
                    onClick={handleMerge}
                    disabled={isMerging}
                    className="w-full min-[400px]:w-auto min-[400px]:ml-auto mt-2 min-[400px]:mt-0 px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg bg-orange-500 text-white text-xs sm:text-sm font-medium hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isMerging ? "..." : "Объединить"}
                  </button>
                )}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
            </div>
          ) : genres.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted-foreground)]">
              {debouncedSearch ? "Жанры не найдены" : "Нет жанров"}
            </div>
          ) : (
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
              {genres.map(genre => (
                <div
                  key={genre._id}
                  onClick={() => handleGenreClick(genre)}
                  className={`p-3 sm:p-4 rounded-lg border transition-all ${
                    mergeMode
                      ? mergeSource?._id === genre._id
                        ? "bg-orange-500/20 border-orange-500 cursor-pointer"
                        : mergeTarget?._id === genre._id
                          ? "bg-green-500/20 border-green-500 cursor-pointer"
                          : "bg-[var(--secondary)] border-[var(--border)] hover:border-orange-500/50 cursor-pointer"
                      : "bg-[var(--secondary)] border-[var(--border)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-medium text-[var(--foreground)] truncate">
                        {genre.name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] truncate">
                        /{genre.slug}
                      </p>
                      {genre.description && (
                        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1 line-clamp-2">
                          {genre.description}
                        </p>
                      )}
                      <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] mt-1.5 sm:mt-2">
                        Тайтлов: {genre.titlesCount}
                      </p>
                    </div>
                    {!mergeMode && (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => openEdit(genre)}
                          className="p-1.5 sm:p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] active:scale-95 transition-all"
                          title="Редактировать"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(genre)}
                          className="p-1.5 sm:p-2 text-[var(--muted-foreground)] hover:text-red-500 active:scale-95 transition-all"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </AdminCard>

      <AdminModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingGenre ? "Редактировать жанр" : "Создать жанр"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Название *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => {
                setForm({ ...form, name: e.target.value });
                if (!editingGenre && !form.slug) {
                  setForm(prev => ({
                    ...prev,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  }));
                }
              }}
              placeholder="Например: Романтика"
              className="admin-input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm({ ...form, slug: e.target.value })}
              placeholder="romantika"
              className="admin-input w-full"
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Оставьте пустым для автоматической генерации
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Описание
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Краткое описание жанра..."
              className="admin-input w-full resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="admin-btn-secondary"
            >
              Отмена
            </button>
            <button type="submit" disabled={isCreating || isUpdating} className="admin-btn-primary">
              {isCreating || isUpdating ? "Сохранение..." : editingGenre ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Удалить жанр"
        message={
          deleteTarget
            ? `Вы уверены, что хотите удалить жанр "${deleteTarget.name}"? Этот жанр будет удалён из всех тайтлов.`
            : ""
        }
        confirmText="Удалить"
        isLoading={deleteLoading}
        confirmVariant="danger"
      />
    </div>
  );
}
