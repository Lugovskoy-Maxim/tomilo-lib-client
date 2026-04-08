"use client";

import React, { useState, useMemo } from "react";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import type { Decoration, DecorationRarity } from "@/api/shop";
import { getDecorationImageUrls, getPriceByRarity } from "@/api/shop";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import type { DecorationType } from "@/api/shop";
import {
  useGetAdminDecorationsQuery,
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
import { SuggestionsSection } from "./SuggestionsSection";

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
  price: getPriceByRarity("common"),
  imageUrl: "",
  type: "avatar" as DecorationType,
  rarity: "common" as DecorationRarity,
  isAvailable: true,
  /** Пустая строка = без лимита. Число = макс. количество в магазине. */
  stock: "" as number | "",
  isFree: false,
  originalPrice: "" as number | "",
};

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/jpg,image/webp,image/gif";

/** 20MB — GIF может быть большим */
const MAX_DECORATION_FILE_SIZE = 20 * 1024 * 1024;

type ShopSubTab = "decorations" | "suggestions";

export function ShopManagementSection() {
  const toast = useToast();
  const [subTab, setSubTab] = useState<ShopSubTab>("decorations");
  const [typeFilter, setTypeFilter] = useState<DecorationType | "all">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDecoration, setEditingDecoration] = useState<Decoration | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Decoration | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /** Запрос выполняется только при NEXT_PUBLIC_SHOP_ADMIN_DECORATIONS_ENABLED=true (бэкенд должен реализовать GET /api/shop/admin/decorations). Иначе показываем пустой список без 404. */
  const skipAdminDecorations = process.env.NEXT_PUBLIC_SHOP_ADMIN_DECORATIONS_ENABLED !== "true";
  const adminDecorationsQuery = useGetAdminDecorationsQuery(undefined, {
    skip: skipAdminDecorations,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- decorations из запроса
  const decorations = adminDecorationsQuery.data ?? [];
  const isLoading = adminDecorationsQuery.isLoading;
  const error = adminDecorationsQuery.error;
  const refetch = adminDecorationsQuery.refetch;
  const [createDecoration, { isLoading: isCreatingJson }] = useCreateDecorationMutation();
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
    const rarity = (d.rarity ?? "common") as DecorationRarity;
    const p = typeof d.price === "number" ? d.price : getPriceByRarity(rarity);
    setForm({
      name: d.name,
      description: d.description,
      price: p,
      imageUrl: d.imageUrl,
      type: d.type,
      rarity,
      isAvailable: d.isAvailable ?? true,
      stock: d.stock !== undefined && d.stock !== null ? d.stock : "",
      isFree: p === 0,
      originalPrice:
        d.originalPrice != null && !Number.isNaN(Number(d.originalPrice))
          ? Number(d.originalPrice)
          : ("" as number | ""),
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
    const effectivePrice = form.isFree ? 0 : form.price;
    if (!form.name.trim() || effectivePrice < 0) return;

    const stockValue =
      form.stock === ""
        ? undefined
        : typeof form.stock === "number"
          ? form.stock
          : parseInt(String(form.stock), 10);
    const stockParam =
      stockValue !== undefined && !Number.isNaN(stockValue) && stockValue >= 0
        ? stockValue
        : undefined;

    const origParsed =
      form.originalPrice === ""
        ? NaN
        : typeof form.originalPrice === "number"
          ? form.originalPrice
          : parseInt(String(form.originalPrice), 10);
    const originalPriceParam =
      Number.isFinite(origParsed) && origParsed > effectivePrice ? Math.floor(origParsed) : undefined;

    try {
      if (editingDecoration) {
        if (imageFile) {
          await updateDecorationWithImage({
            id: editingDecoration.id,
            file: imageFile,
            name: form.name.trim(),
            description: form.description.trim(),
            price: effectivePrice,
            type: form.type,
            rarity: form.rarity,
            isAvailable: form.isAvailable,
            stock: stockParam,
            originalPrice: originalPriceParam,
          }).unwrap();
        } else {
          await updateDecoration({
            id: editingDecoration.id,
            dto: {
              name: form.name.trim(),
              description: form.description.trim(),
              price: effectivePrice,
              imageUrl: form.imageUrl.trim() || undefined,
              type: form.type,
              rarity: form.rarity,
              isAvailable: form.isAvailable,
              stock: stockParam,
              originalPrice: originalPriceParam,
            },
          }).unwrap();
        }
        toast.success("Украшение обновлено");
        closeForm();
        refetch();
      } else {
        if (imageFile) {
          await createDecorationWithImage({
            file: imageFile,
            type: form.type,
            name: form.name.trim() || undefined,
            description: form.description.trim() || undefined,
            price: effectivePrice,
            rarity: form.rarity,
            isAvailable: form.isAvailable,
            stock: stockParam,
            originalPrice: originalPriceParam,
          }).unwrap();
        } else {
          const url = form.imageUrl.trim();
          if (!url) {
            toast.error("Выберите файл изображения или укажите URL");
            return;
          }
          await createDecoration({
            name: form.name.trim(),
            description: form.description.trim(),
            price: effectivePrice,
            imageUrl: url,
            type: form.type,
            rarity: form.rarity,
            isAvailable: form.isAvailable,
            stock: stockParam,
            originalPrice: originalPriceParam,
          }).unwrap();
        }
        toast.success("Украшение добавлено");
        closeForm();
        refetch();
      }
    } catch (e) {
      const err = e as { data?: unknown; error?: unknown; status?: unknown };
      const data = err?.data as
        | { errors?: Array<string | { message?: string }>; message?: string }
        | undefined;
      const firstError =
        Array.isArray(data?.errors) && data.errors.length > 0
          ? typeof data.errors[0] === "string"
            ? data.errors[0]
            : data.errors[0]?.message
          : undefined;
      const msg =
        (typeof data?.message === "string" && data.message) ||
        firstError ||
        (typeof err?.error === "string" && err.error) ||
        "Ошибка сохранения";
      toast.error(String(msg));
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
      const err = e as { status?: number; data?: { message?: string } };
      if (err?.status === 404) {
        toast.info("Украшение уже удалено или не найдено");
        setDeleteTarget(null);
        refetch();
      } else {
        const msg =
          err && typeof err === "object" && "data" in err
            ? String(err.data?.message ?? "Ошибка удаления")
            : "Ошибка удаления";
        toast.error(msg);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const typeLabel = (t: DecorationType) => DECORATION_TYPES.find(x => x.value === t)?.label ?? t;

  // 404: backend does not have GET /api/shop/admin/decorations — show section with empty list and a note (no retry)
  const is404 = Boolean(
    error && typeof error === "object" && (error as { status?: number }).status === 404,
  );
  if (error && !is404) {
    let errMsg = "Не удалось загрузить украшения магазина.";
    if (typeof error === "object") {
      const e = error as { status?: number; data?: { message?: string } };
      if (e.status === 401 || e.status === 403) errMsg = "Доступ запрещён. Проверьте авторизацию.";
      else if (e.data?.message) errMsg = String(e.data.message);
    }
    return (
      <div className="space-y-4">
        <SharedErrorState title="Ошибка загрузки" message={errMsg} />
        <div className="flex justify-center">
          <button type="button" onClick={() => refetch()} className="admin-btn admin-btn-primary">
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  if (subTab === "suggestions") {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubTab("decorations")}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
          >
            Украшения магазина
          </button>
          <button
            type="button"
            onClick={() => setSubTab("suggestions")}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)]"
          >
            Предложенные декорации
          </button>
        </div>
        <SuggestionsSection />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSubTab("decorations")}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)]"
        >
          Украшения магазина
        </button>
        <button
          type="button"
          onClick={() => setSubTab("suggestions")}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
        >
          Предложенные декорации
        </button>
      </div>
      {is404 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 px-4 py-3 text-sm text-[var(--muted-foreground)]">
          Эндпоинт{" "}
          <code className="rounded bg-[var(--muted)] px-1">GET /api/shop/admin/decorations</code> не
          найден (404). Возможно, модуль магазина не подключён на бэкенде. Список украшений
          недоступен.
        </div>
      )}
      <AdminCard className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Украшения магазина</h2>
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
          <div className="text-center py-12 text-[var(--muted-foreground)] space-y-2">
            {decorations.length === 0
              ? "Нет украшений. Добавьте первое."
              : "Нет украшений выбранного типа."}
            {skipAdminDecorations && (
              <p className="text-xs max-w-md mx-auto pt-2">
                Чтобы загружать список с бэкенда, реализуйте GET /api/shop/admin/decorations и
                задайте NEXT_PUBLIC_SHOP_ADMIN_DECORATIONS_ENABLED=true.
              </p>
            )}
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
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">
                    Статистика
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
                      <span className="font-medium text-[var(--foreground)]">{d.name}</span>
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
                      {d.price === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Бесплатно</span>
                      ) : (
                        <>
                          {d.price} монет
                          {d.originalPrice != null && d.originalPrice > d.price && (
                            <span className="block text-xs text-[var(--muted-foreground)] line-through font-normal">
                              было {d.originalPrice}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="py-2 px-2 text-[var(--muted-foreground)] text-xs max-w-[10rem]">
                      {d.ownersCount != null || d.purchaseCount != null ? (
                        <>
                          {d.ownersCount != null && (
                            <span className="block">У {d.ownersCount} игроков</span>
                          )}
                          {d.purchaseCount != null && (
                            <span className="block">Покупок: {d.purchaseCount}</span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
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
            <button type="button" onClick={closeForm} className="admin-btn admin-btn-secondary">
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
        <form id="shop-decoration-form" onSubmit={handleSubmit} className="space-y-4">
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
                Цена (по редкости)
              </label>
              <input
                type="number"
                min={0}
                readOnly
                value={form.isFree ? 0 : form.price}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 text-[var(--foreground)] cursor-default"
                title="Цена по редкости: 800 / 1200 / 1800 / 4000. «Бесплатно» — 0 монет."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Тип</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as DecorationType }))}
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
                onChange={e => {
                  const rarity = e.target.value as DecorationRarity;
                  setForm(f => ({
                    ...f,
                    rarity,
                    price: f.isFree ? 0 : getPriceByRarity(rarity),
                  }));
                }}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {RARITY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFree}
                  onChange={e => {
                    const free = e.target.checked;
                    setForm(f => ({
                      ...f,
                      isFree: free,
                      price: free ? 0 : getPriceByRarity(f.rarity),
                    }));
                  }}
                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Бесплатно (0 монет)
                </span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Старая цена для скидки (необязательно)
              </label>
              <input
                type="number"
                min={0}
                value={form.originalPrice === "" ? "" : form.originalPrice}
                onChange={e => {
                  const v = e.target.value;
                  setForm(f => ({
                    ...f,
                    originalPrice: v === "" ? ("" as number | "") : parseInt(v, 10) || 0,
                  }));
                }}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="Больше текущей цены — покажем зачёркнутой в магазине"
              />
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
                Оставьте пустым для неограниченного количества. Иначе — макс. число товара в
                магазине.
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
            <div className="mt-3">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                URL изображения (альтернатива файлу)
              </label>
              <input
                type="text"
                value={form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="https://... или /uploads/..."
              />
              {!editingDecoration && (
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Можно создать украшение без загрузки файла, если бэкенд принимает URL.
                </p>
              )}
            </div>
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
