"use client";

import React, { useState, useMemo } from "react";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import type { Decoration, DecorationRarity } from "@/api/shop";
import { getDecorationImageUrls } from "@/api/shop";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import type { DecorationType } from "@/api/shop";
import {
  useGetDecorationsQuery,
  useCreateDecorationMutation,
  useCreateDecorationWithImageMutation,
  useUpdateDecorationMutation,
  useUpdateDecorationWithImageMutation,
  useDeleteDecorationMutation,
} from "@/store/api/shopApi";
import { AdminCard } from "./ui";
import { AdminModal, ConfirmModal } from "./ui";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ErrorState as SharedErrorState } from "@/shared/error-state";
import { useToast } from "@/hooks/useToast";

const DECORATION_TYPES: { value: DecorationType; label: string }[] = [
  { value: "avatar", label: "Аватар" },
  { value: "frame", label: "Рамка аватара" },
  { value: "background", label: "Фон" },
  { value: "card", label: "Карточка" },
];

const RARITY_OPTIONS: { value: DecorationRarity; label: string }[] = [
  { value: "common", label: "Обычная" },
  { value: "rare", label: "Редкая" },
  { value: "epic", label: "Эпическая" },
  { value: "legendary", label: "Легендарная" },
];

const emptyForm = {
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  type: "avatar" as DecorationType,
  rarity: "common" as DecorationRarity,
  isAvailable: true,
  /** Пустая строка = без лимита. Число = макс. количество в магазине. */
  stock: "" as number | "",
};

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/jpg,image/webp,image/gif";

/** 20MB — GIF может быть большим */
const MAX_DECORATION_FILE_SIZE = 20 * 1024 * 1024;

export function ShopManagementSection() {
  const toast = useToast();
  const [typeFilter, setTypeFilter] = useState<DecorationType | "all">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDecoration, setEditingDecoration] = useState<Decoration | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Decoration | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data: decorations = [], isLoading, error, refetch } = useGetDecorationsQuery();
  const [, { isLoading: isCreatingJson }] = useCreateDecorationMutation();
  const [createDecorationWithImage, { isLoading: isCreatingWithImage }] =
    useCreateDecorationWithImageMutation();
  const [updateDecoration, { isLoading: isUpdatingJson }] = useUpdateDecorationMutation();
  const [updateDecorationWithImage, { isLoading: isUpdatingWithImage }] =
    useUpdateDecorationWithImageMutation();
  const [deleteDecoration] = useDeleteDecorationMutation();

  const isCreating = isCreatingJson || isCreatingWithImage;
  const isUpdating = isUpdatingJson || isUpdatingWithImage;

  const filtered = useMemo(() => {
    if (typeFilter === "all") return decorations;
    return decorations.filter(d => d.type === typeFilter);
  }, [decorations, typeFilter]);

  const openCreate = () => {
    setEditingDecoration(null);
    setForm(emptyForm);
    setImageFile(null);
    setIsFormOpen(true);
  };

  const openEdit = (d: Decoration) => {
    setEditingDecoration(d);
    setForm({
      name: d.name,
      description: d.description,
      price: d.price,
      imageUrl: d.imageUrl,
      type: d.type,
      rarity: d.rarity ?? "common",
      isAvailable: d.isAvailable ?? true,
      stock: d.stock !== undefined && d.stock !== null ? d.stock : "",
    });
    setImageFile(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingDecoration(null);
    setForm(emptyForm);
    setImageFile(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setImageFile(null);
      return;
    }
    if (file.size > MAX_DECORATION_FILE_SIZE) {
      toast.error(
        `Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ). Максимум — 20 МБ.`,
      );
      setImageFile(null);
      e.target.value = "";
      return;
    }
    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.price < 0) return;

    const stockValue = form.stock === "" ? undefined : (typeof form.stock === "number" ? form.stock : parseInt(String(form.stock), 10));
    const stockParam = stockValue !== undefined && !Number.isNaN(stockValue) && stockValue >= 0 ? stockValue : undefined;

    try {
      if (editingDecoration) {
        if (imageFile) {
          await updateDecorationWithImage({
            id: editingDecoration.id,
            file: imageFile,
            name: form.name.trim(),
            description: form.description.trim(),
            price: form.price,
            type: form.type,
            rarity: form.rarity,
            isAvailable: form.isAvailable,
            stock: stockParam,
          }).unwrap();
        } else {
          await updateDecoration({
            id: editingDecoration.id,
            dto: {
              name: form.name.trim(),
              description: form.description.trim(),
              price: form.price,
              imageUrl: form.imageUrl.trim() || undefined,
              type: form.type,
              rarity: form.rarity,
              isAvailable: form.isAvailable,
              stock: stockParam,
            },
          }).unwrap();
        }
        toast.success("Украшение обновлено");
        closeForm();
        refetch();
      } else {
        if (!imageFile) {
          toast.error("Выберите файл изображения");
          return;
        }
        await createDecorationWithImage({
          file: imageFile,
          type: form.type,
          name: form.name.trim() || undefined,
          description: form.description.trim() || undefined,
          price: form.price,
          rarity: form.rarity,
          isAvailable: form.isAvailable,
          stock: stockParam,
        }).unwrap();
        toast.success("Украшение добавлено");
        closeForm();
        refetch();
      }
    } catch (e) {
      const msg = e && typeof e === "object" && "data" in e
        ? String((e as { data?: { message?: string } }).data?.message ?? "Ошибка сохранения")
        : "Ошибка сохранения";
      toast.error(msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteDecoration(deleteTarget.id).unwrap();
      toast.success("Украшение удалено");
      setDeleteTarget(null);
      refetch();
    } catch (e) {
      const msg = e && typeof e === "object" && "data" in e
        ? String((e as { data?: { message?: string } }).data?.message ?? "Ошибка удаления")
        : "Ошибка удаления";
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const typeLabel = (t: DecorationType) =>
    DECORATION_TYPES.find(x => x.value === t)?.label ?? t;

  if (error) {
    let errMsg = "Не удалось загрузить украшения магазина.";
    if (error && typeof error === "object") {
      const e = error as { status?: number; data?: { message?: string } };
      if (e.status === 404) errMsg = "API магазина не найден (404). Возможно, модуль магазина не подключён на бэкенде.";
      else if (e.status === 401 || e.status === 403) errMsg = "Доступ запрещён. Проверьте авторизацию.";
      else if (e.data?.message) errMsg = String(e.data.message);
    }
    return (
      <div className="space-y-4">
        <SharedErrorState title="Ошибка загрузки" message={errMsg} />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => refetch()}
            className="admin-btn admin-btn-primary"
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminCard className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Украшения магазина
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Добавляйте и редактируйте аватары, фоны и карточки для магазина
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/tomilo-shop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] border border-[var(--border)] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Открыть магазин
            </Link>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Добавить украшение
            </button>
          </div>
        </div>

        {/* Фильтр по типу */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === "all"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            Все
          </button>
          {DECORATION_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTypeFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === value
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            {decorations.length === 0
              ? "Нет украшений. Добавьте первое."
              : "Нет украшений выбранного типа."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">
                    Изображение
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">
                    Название
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">
                    Тип
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-[var(--muted-foreground)]">
                    Цена
                  </th>
                  <th className="text-center py-3 px-2 font-medium text-[var(--muted-foreground)]">
                    Остаток / Статус
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-[var(--muted-foreground)]">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr
                    key={d.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--accent)]/30"
                  >
                    <td className="py-2 px-2">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--muted)] flex items-center justify-center">
                        {d.imageUrl ? (
                          <OptimizedImage
                            src={getDecorationImageUrls(d.imageUrl).primary}
                            fallbackSrc={getDecorationImageUrls(d.imageUrl).fallback}
                            alt=""
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-[var(--muted-foreground)]" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <span className="font-medium text-[var(--foreground)]">
                        {d.name}
                      </span>
                      {d.description && (
                        <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mt-0.5">
                          {d.description}
                        </p>
                      )}
                    </td>
                    <td className="py-2 px-2 text-[var(--muted-foreground)]">
                      {typeLabel(d.type)}
                    </td>
                    <td className="py-2 px-2 text-right font-medium">
                      {d.price} монет
                    </td>
                    <td className="py-2 px-2 text-center">
                      {d.stock !== undefined ? (
                        d.isSoldOut || d.stock <= 0 ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-medium px-2 py-0.5">
                            Продано
                          </span>
                        ) : (
                          <span className="text-[var(--foreground)]">Осталось: {d.stock}</span>
                        )
                      ) : (
                        <span className="text-[var(--muted-foreground)]">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(d)}
                          className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(d)}
                          className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
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
      </AdminCard>

      {/* Модалка создания/редактирования */}
      <AdminModal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingDecoration ? "Редактировать украшение" : "Добавить украшение"}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="admin-btn admin-btn-secondary"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="shop-decoration-form"
              disabled={isCreating || isUpdating}
              className="admin-btn admin-btn-primary disabled:opacity-50"
            >
              {isCreating || isUpdating
                ? "Сохранение..."
                : editingDecoration
                  ? "Сохранить"
                  : "Добавить"}
            </button>
          </div>
        }
      >
        <form
          id="shop-decoration-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Название
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Название украшения"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Описание
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[80px]"
              placeholder="Краткое описание"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Цена (монеты)
              </label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={e =>
                  setForm(f => ({ ...f, price: parseInt(e.target.value, 10) || 0 }))
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Тип
              </label>
              <select
                value={form.type}
                onChange={e =>
                  setForm(f => ({ ...f, type: e.target.value as DecorationType }))
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {DECORATION_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Редкость
              </label>
              <select
                value={form.rarity}
                onChange={e =>
                  setForm(f => ({ ...f, rarity: e.target.value as DecorationRarity }))
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {RARITY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))}
                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Доступно в магазине
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Лимит количества
              </label>
              <input
                type="number"
                min={0}
                value={form.stock === "" ? "" : form.stock}
                onChange={e => {
                  const v = e.target.value;
                  setForm(f => ({ ...f, stock: v === "" ? "" : parseInt(v, 10) || 0 }));
                }}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="Без лимита"
              />
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Оставьте пустым для неограниченного количества. Иначе — макс. число товара в магазине.
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              {editingDecoration
                ? "Изображение (оставьте пустым, чтобы не менять)"
                : "Файл изображения * (макс. 20 МБ)"}
            </label>
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              onChange={handleImageFileChange}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[var(--primary)] file:text-[var(--primary-foreground)]"
            />
            {(imageFile || form.imageUrl) && (
              <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden bg-[var(--muted)]">
                {imageFile ? (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <OptimizedImage
                    src={getDecorationImageUrls(form.imageUrl).primary}
                    fallbackSrc={getDecorationImageUrls(form.imageUrl).fallback}
                    alt=""
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
          </div>
        </form>
      </AdminModal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Удалить украшение?"
        message={
          deleteTarget
            ? `Украшение «${deleteTarget.name}» будет удалено. Это действие нельзя отменить.`
            : ""
        }
        confirmText="Удалить"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}
