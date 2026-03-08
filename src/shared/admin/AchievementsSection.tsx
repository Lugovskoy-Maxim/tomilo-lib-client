"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Trophy,
  EyeOff,
  Copy,
  Filter,
  Download,
} from "lucide-react";
import {
  useGetAchievementsQuery,
  useCreateAchievementMutation,
  useUpdateAchievementMutation,
  useDeleteAchievementMutation,
  type Achievement,
} from "@/store/api/achievementsApi";
import type { AchievementType, AchievementRarity } from "@/types/user";
import { AdminCard, AdminModal, ConfirmModal } from "./ui";
import { useToast } from "@/hooks/useToast";
import { Pagination } from "@/shared/ui/pagination";

const ACHIEVEMENT_TYPES: { value: AchievementType; label: string }[] = [
  { value: "reading", label: "Чтение" },
  { value: "collection", label: "Коллекция" },
  { value: "social", label: "Социальные" },
  { value: "veteran", label: "Ветеран" },
  { value: "special", label: "Особые" },
  { value: "level", label: "Уровень" },
];

const RARITY_OPTIONS: { value: AchievementRarity; label: string; color: string }[] = [
  { value: "common", label: "Обычное", color: "text-gray-500 bg-gray-500/10" },
  { value: "uncommon", label: "Необычное", color: "text-green-500 bg-green-500/10" },
  { value: "rare", label: "Редкое", color: "text-blue-500 bg-blue-500/10" },
  { value: "epic", label: "Эпическое", color: "text-purple-500 bg-purple-500/10" },
  { value: "legendary", label: "Легендарное", color: "text-yellow-500 bg-yellow-500/10" },
];

const emptyForm = {
  id: "",
  name: "",
  description: "",
  icon: "trophy",
  type: "reading" as AchievementType,
  rarity: "common" as AchievementRarity,
  maxProgress: "",
  isHidden: false,
};

export function AchievementsSection() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Achievement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [rarityFilter, setRarityFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: achievementsData,
    isLoading,
    error,
    refetch,
  } = useGetAchievementsQuery({
    search: debouncedSearch,
    type: typeFilter,
    rarity: rarityFilter || undefined,
    page: currentPage,
    limit: 50,
  });

  const [createAchievement, { isLoading: isCreating }] = useCreateAchievementMutation();
  const [updateAchievement, { isLoading: isUpdating }] = useUpdateAchievementMutation();
  const [deleteAchievement] = useDeleteAchievementMutation();

  const achievements = achievementsData?.data?.achievements || [];
  const pagination = achievementsData?.data?.pagination || {
    total: 0,
    page: 1,
    limit: 50,
    pages: 0,
  };

  const stats = useMemo(() => {
    const byRarity = RARITY_OPTIONS.reduce(
      (acc, r) => {
        acc[r.value] = achievements.filter(a => a.rarity === r.value).length;
        return acc;
      },
      {} as Record<string, number>,
    );
    const hidden = achievements.filter(a => a.isHidden).length;
    return { byRarity, hidden, total: pagination.total };
  }, [achievements, pagination.total]);

  const handleDuplicate = useCallback((achievement: Achievement) => {
    setEditingAchievement(null);
    setForm({
      id: `${achievement.id}_copy`,
      name: `${achievement.name} (копия)`,
      description: achievement.description,
      icon: achievement.icon,
      type: achievement.type,
      rarity: achievement.rarity,
      maxProgress: achievement.maxProgress?.toString() || "",
      isHidden: achievement.isHidden,
    });
    setIsFormOpen(true);
  }, []);

  const handleExportCSV = useCallback(() => {
    const headers = ["ID", "Название", "Описание", "Тип", "Редкость", "Макс. прогресс", "Скрытое"];
    const rows = achievements.map(a => [
      a.id,
      a.name,
      a.description,
      getTypeName(a.type),
      RARITY_OPTIONS.find(r => r.value === a.rarity)?.label || a.rarity,
      a.maxProgress || "",
      a.isHidden ? "Да" : "Нет",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `achievements_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Экспорт завершён");
  }, [achievements, toast]);

  const generateId = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s-]/gi, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .trim();
  };

  const openCreate = () => {
    setEditingAchievement(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setForm({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      type: achievement.type,
      rarity: achievement.rarity,
      maxProgress: achievement.maxProgress?.toString() || "",
      isHidden: achievement.isHidden,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Название достижения обязательно");
      return;
    }
    if (!form.id.trim() && !editingAchievement) {
      toast.error("ID достижения обязателен");
      return;
    }

    try {
      const data = {
        id: form.id || generateId(form.name),
        name: form.name,
        description: form.description,
        icon: form.icon,
        type: form.type,
        rarity: form.rarity,
        maxProgress: form.maxProgress ? parseInt(form.maxProgress, 10) : undefined,
        isHidden: form.isHidden,
      };

      if (editingAchievement) {
        await updateAchievement({
          _id: editingAchievement._id,
          ...data,
        }).unwrap();
        toast.success("Достижение обновлено");
      } else {
        await createAchievement(data).unwrap();
        toast.success("Достижение создано");
      }
      setIsFormOpen(false);
      setForm(emptyForm);
      refetch();
    } catch {
      toast.error(editingAchievement ? "Ошибка при обновлении" : "Ошибка при создании");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteAchievement(deleteTarget._id).unwrap();
      toast.success("Достижение удалено");
      setDeleteTarget(null);
      refetch();
    } catch {
      toast.error("Ошибка при удалении");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getRarityStyle = (rarity: AchievementRarity) => {
    return RARITY_OPTIONS.find(r => r.value === rarity)?.color || "";
  };

  const getTypeName = (type: AchievementType) => {
    return ACHIEVEMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  if (error) {
    return (
      <AdminCard title="Достижения" icon={<Trophy className="w-5 h-5" />}>
        <div className="text-center py-8">
          <p className="text-[var(--destructive)]">Ошибка загрузки достижений</p>
          <button onClick={() => refetch()} className="mt-2 admin-btn-secondary">
            Повторить
          </button>
        </div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 min-[480px]:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">Всего</p>
          <p className="mt-1 text-lg sm:text-xl font-bold text-[var(--foreground)]">
            {stats.total}
          </p>
        </div>
        {RARITY_OPTIONS.slice(0, 4).map(rarity => (
          <div
            key={rarity.value}
            className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]"
          >
            <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">{rarity.label}</p>
            <p className={`mt-1 text-lg sm:text-xl font-bold ${rarity.color.split(" ")[0]}`}>
              {stats.byRarity[rarity.value] || 0}
            </p>
          </div>
        ))}
        <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">Скрытых</p>
          <p className="mt-1 text-lg sm:text-xl font-bold text-[var(--muted-foreground)]">
            {stats.hidden}
          </p>
        </div>
      </div>

      <AdminCard
        title="Управление достижениями"
        icon={<Trophy className="w-4 h-4 sm:w-5 sm:h-5" />}
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
              onClick={() => setShowFilters(!showFilters)}
              className={`admin-btn-secondary flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ${
                showFilters ? "bg-[var(--primary)]/10" : ""
              }`}
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
          <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
            <div className="flex flex-col min-[400px]:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="relative flex-1 min-[400px]:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="admin-input pl-10 w-full min-[400px]:w-48 sm:w-64 text-sm"
                />
              </div>
              <select
                value={typeFilter}
                onChange={e => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-input text-xs sm:text-sm px-2 sm:px-3"
              >
                <option value="">Все типы</option>
                {ACHIEVEMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs sm:text-sm text-[var(--muted-foreground)]">
              Всего: {pagination.total}
            </div>
          </div>

          {/* Extended filters */}
          {showFilters && (
            <div className="p-3 sm:p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">Редкость:</span>
                <button
                  onClick={() => {
                    setRarityFilter("");
                    setCurrentPage(1);
                  }}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                    rarityFilter === ""
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--card)] hover:bg-[var(--accent)]"
                  }`}
                >
                  Все
                </button>
                {RARITY_OPTIONS.map(rarity => (
                  <button
                    key={rarity.value}
                    onClick={() => {
                      setRarityFilter(rarity.value);
                      setCurrentPage(1);
                    }}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                      rarityFilter === rarity.value
                        ? `${rarity.color}`
                        : "bg-[var(--card)] hover:bg-[var(--accent)]"
                    }`}
                  >
                    {rarity.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
            </div>
          ) : achievements.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted-foreground)]">
              {debouncedSearch || typeFilter ? "Достижения не найдены" : "Нет достижений"}
            </div>
          ) : (
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {achievements.map(achievement => (
                <div
                  key={achievement._id}
                  className="p-3 sm:p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] space-y-2 sm:space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[var(--card)] flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                        {achievement.icon.startsWith("http") ? (
                          <img
                            src={achievement.icon}
                            alt={achievement.name}
                            className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                          />
                        ) : (
                          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--primary)]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <h4 className="text-sm sm:text-base font-medium text-[var(--foreground)] truncate">
                            {achievement.name}
                          </h4>
                          {achievement.isHidden && (
                            <span title="Скрытое" className="flex-shrink-0">
                              <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--muted-foreground)]" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] truncate">
                          {achievement.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => handleDuplicate(achievement)}
                        className="p-1.5 sm:p-2 text-[var(--muted-foreground)] hover:text-green-500 active:scale-95 transition-all"
                        title="Дублировать"
                      >
                        <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(achievement)}
                        className="p-1.5 sm:p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] active:scale-95 transition-all"
                        title="Редактировать"
                      >
                        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(achievement)}
                        className="p-1.5 sm:p-2 text-[var(--muted-foreground)] hover:text-red-500 active:scale-95 transition-all"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--muted-foreground)] line-clamp-2">
                    {achievement.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${getRarityStyle(achievement.rarity)}`}
                    >
                      {RARITY_OPTIONS.find(r => r.value === achievement.rarity)?.label}
                    </span>
                    <span className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs bg-[var(--card)] text-[var(--muted-foreground)]">
                      {getTypeName(achievement.type)}
                    </span>
                    {achievement.maxProgress && (
                      <span className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs bg-[var(--card)] text-[var(--muted-foreground)]">
                        0/{achievement.maxProgress}
                      </span>
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
        title={editingAchievement ? "Редактировать достижение" : "Создать достижение"}
      >
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
                Название *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => {
                  const newName = e.target.value;
                  setForm(prev => ({
                    ...prev,
                    name: newName,
                    id: !editingAchievement && !prev.id ? generateId(newName) : prev.id,
                  }));
                }}
                placeholder="Первые шаги"
                className="admin-input w-full text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
                ID *
              </label>
              <input
                type="text"
                value={form.id}
                onChange={e => setForm({ ...form, id: e.target.value })}
                placeholder="first_steps"
                className="admin-input w-full text-sm"
                disabled={!!editingAchievement}
                required={!editingAchievement}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
              Описание
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Прочитайте первую главу..."
              className="admin-input w-full resize-none text-sm"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
                Иконка
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                  placeholder="URL или emoji"
                  className="admin-input flex-1 text-sm"
                />
                <div className="w-10 h-10 rounded-lg bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  {form.icon.startsWith("http") ? (
                    <img
                      src={form.icon}
                      alt="Preview"
                      className="w-6 h-6 object-contain"
                      onError={e => {
                        (e.target as HTMLImageElement).src = "";
                      }}
                    />
                  ) : form.icon ? (
                    <span className="text-lg">{form.icon}</span>
                  ) : (
                    <Trophy className="w-5 h-5 text-[var(--muted-foreground)]" />
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
                Макс. прогресс
              </label>
              <input
                type="number"
                value={form.maxProgress}
                onChange={e => setForm({ ...form, maxProgress: e.target.value })}
                placeholder="Пусто = мгновенное"
                className="admin-input w-full text-sm"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
                Тип
              </label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as AchievementType })}
                className="admin-input w-full text-sm"
              >
                {ACHIEVEMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
                Редкость
              </label>
              <select
                value={form.rarity}
                onChange={e => setForm({ ...form, rarity: e.target.value as AchievementRarity })}
                className="admin-input w-full text-sm"
              >
                {RARITY_OPTIONS.map(rarity => (
                  <option key={rarity.value} value={rarity.value}>
                    {rarity.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isHidden"
              checked={form.isHidden}
              onChange={e => setForm({ ...form, isHidden: e.target.checked })}
              className="rounded border-[var(--border)] w-4 h-4"
            />
            <label htmlFor="isHidden" className="text-xs sm:text-sm text-[var(--foreground)]">
              Скрытое (не показывать до получения)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="admin-btn-secondary text-xs sm:text-sm px-3 py-2"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="admin-btn-primary text-xs sm:text-sm px-3 py-2"
            >
              {isCreating || isUpdating ? "..." : editingAchievement ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Удалить достижение"
        message={deleteTarget ? `Удалить достижение "${deleteTarget.name}"?` : ""}
        confirmText="Удалить"
        isLoading={deleteLoading}
        confirmVariant="danger"
      />
    </div>
  );
}
