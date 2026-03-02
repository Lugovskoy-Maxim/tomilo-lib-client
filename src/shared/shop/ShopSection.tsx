"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Decoration, DecorationRarity, DecorationType } from "@/api/shop";
import {
  getUserDecorations,
  purchaseDecoration,
  equipDecoration,
  unequipDecoration,
  getDecorationImageUrls,
} from "@/api/shop";
import { DecorationCard } from "./DecorationCard";
import { useAuth } from "@/hooks/useAuth";
import { useGetProfileQuery } from "@/store/api/authApi";
import type { UserProfile } from "@/types/user";
import {
  useGetDecorationsByTypeQuery,
  useCreateDecorationMutation,
  useCreateDecorationWithImageMutation,
  useUpdateDecorationMutation,
  useUpdateDecorationWithImageMutation,
  useDeleteDecorationMutation,
} from "@/store/api/shopApi";
import { AdminModal, ConfirmModal } from "@/shared/admin/ui";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { useToast } from "@/hooks/useToast";
import { RefreshCw, PackageOpen, Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";

function getEquippedId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const o = value as Record<string, unknown>;
    const id = o.id ?? o._id;
    return typeof id === "string" ? id : "";
  }
  return "";
}

interface ShopSectionProps {
  type: "avatar" | "frame" | "background" | "card";
}

interface UserDecorations {
  owned: string[];
  equipped: string[];
}

const RARITY_OPTIONS: { value: DecorationRarity; label: string }[] = [
  { value: "common", label: "Обычная" },
  { value: "rare", label: "Редкая" },
  { value: "epic", label: "Эпическая" },
  { value: "legendary", label: "Легендарная" },
];

const emptyAdminForm = {
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  type: "avatar" as DecorationType,
  rarity: "common" as DecorationRarity,
  isAvailable: true,
  stock: "" as number | "",
};

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/jpg,image/webp,image/gif";
const MAX_DECORATION_FILE_SIZE = 20 * 1024 * 1024;

function ShopSectionSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-3 lg:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden animate-pulse"
        >
          <div className="aspect-[9/16] bg-[var(--muted)]" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-[var(--muted)] rounded-lg w-3/4" />
            <div className="h-3 bg-[var(--muted)] rounded w-1/2" />
            <div className="h-10 bg-[var(--muted)] rounded-xl w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getQueryErrorMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (typeof error !== "object") return String(error);

  const e = error as {
    status?: unknown;
    data?: unknown;
    error?: unknown;
    message?: unknown;
  };

  const dataMessage =
    e.data && typeof e.data === "object" && "message" in (e.data as Record<string, unknown>)
      ? String((e.data as Record<string, unknown>).message ?? "")
      : typeof e.data === "string"
        ? e.data
        : "";

  const status = e.status != null ? String(e.status) : "";
  const main = dataMessage || (e.error != null ? String(e.error) : "") || (e.message != null ? String(e.message) : "");

  if (status && main) return `${status}: ${main}`;
  if (status) return `Ошибка (${status})`;
  return main || "Ошибка при загрузке";
}

export function ShopSection({ type }: ShopSectionProps) {
  const toast = useToast();
  const { isAuthenticated, refetchProfile, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [userDecorations, setUserDecorations] = useState<UserDecorations>({
    owned: [],
    equipped: [],
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const publicDecorationsQuery = useGetDecorationsByTypeQuery({ type });
  const decorations: Decoration[] = publicDecorationsQuery.data ?? [];
  const decorationsLoading = publicDecorationsQuery.isLoading;
  const decorationsError = publicDecorationsQuery.error;
  const refetchDecorations = publicDecorationsQuery.refetch;

  const decorationsErrorText = useMemo(() => getQueryErrorMessage(decorationsError), [decorationsError]);

  const loadUserDecorations = useCallback(async () => {
    if (!isAuthenticated) {
      setUserDecorations({ owned: [], equipped: [] });
      return;
    }
    try {
      const response = await getUserDecorations();
      if (response.success && response.data) {
        setUserDecorations({
          owned: response.data.map(d => d.id),
          equipped: response.data.filter(d => d.isEquipped).map(d => d.id),
        });
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserDecorations();
    } else {
      setUserDecorations({ owned: [], equipped: [] });
    }
  }, [isAuthenticated, loadUserDecorations]);

  const { data: profileData } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const profile = profileData?.success ? profileData.data : null;
  const profileWithDecorations = profile as (typeof profile) & UserProfile | null;
  /** API может вернуть equippedDecorations или equipped_decorations */
  const equippedRaw =
    profileWithDecorations?.equippedDecorations ??
    (profileWithDecorations as unknown as Record<string, unknown>)?.equipped_decorations;

  /** Купленные и надетые: из API магазина или fallback из профиля (если API пуст). Как в инвентаре профиля. */
  const { effectiveOwned, effectiveEquipped } = useMemo(() => {
    let owned = userDecorations.owned;
    let equipped = userDecorations.equipped;
    if (owned.length === 0 && profileWithDecorations?.ownedDecorations?.length) {
      owned = profileWithDecorations.ownedDecorations.map(e => e.decorationId);
    }
    if (equipped.length === 0 && equippedRaw && typeof equippedRaw === "object") {
      const eq = equippedRaw as Record<string, unknown>;
      equipped = [
        getEquippedId(eq.avatar),
        getEquippedId(eq.frame),
        getEquippedId(eq.background),
        getEquippedId(eq.card),
      ].filter(Boolean);
    }
    return { effectiveOwned: owned, effectiveEquipped: equipped };
  }, [userDecorations.owned, userDecorations.equipped, profileWithDecorations, equippedRaw]);

  // --- Admin: create/edit decorations right on shop page ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDecoration, setEditingDecoration] = useState<Decoration | null>(null);
  const [form, setForm] = useState({ ...emptyAdminForm, type: type as DecorationType });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Decoration | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [createDecoration, { isLoading: isCreatingJson }] = useCreateDecorationMutation();
  const [createDecorationWithImage, { isLoading: isCreatingWithImage }] = useCreateDecorationWithImageMutation();
  const [updateDecoration, { isLoading: isUpdatingJson }] = useUpdateDecorationMutation();
  const [updateDecorationWithImage, { isLoading: isUpdatingWithImage }] = useUpdateDecorationWithImageMutation();
  const [deleteDecoration] = useDeleteDecorationMutation();

  const isSaving = isCreatingJson || isCreatingWithImage || isUpdatingJson || isUpdatingWithImage;

  const openCreate = () => {
    setEditingDecoration(null);
    setForm({ ...emptyAdminForm, type: type as DecorationType });
    setImageFile(null);
    setIsFormOpen(true);
  };

  const openEdit = (d: Decoration) => {
    setEditingDecoration(d);
    setForm({
      name: d.name ?? "",
      description: d.description ?? "",
      price: d.price ?? 0,
      imageUrl: d.imageUrl ?? "",
      type: d.type,
      rarity: (d.rarity ?? "common") as DecorationRarity,
      isAvailable: d.isAvailable ?? true,
      stock: d.stock !== undefined && d.stock !== null ? d.stock : "",
    });
    setImageFile(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingDecoration(null);
    setForm({ ...emptyAdminForm, type: type as DecorationType });
    setImageFile(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setImageFile(null);
      return;
    }
    if (file.size > MAX_DECORATION_FILE_SIZE) {
      toast.error(`Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ). Максимум — 20 МБ.`);
      setImageFile(null);
      e.target.value = "";
      return;
    }
    setImageFile(file);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!form.name.trim() || form.price < 0) return;

    const stockValue =
      form.stock === ""
        ? undefined
        : (typeof form.stock === "number" ? form.stock : parseInt(String(form.stock), 10));
    const stockParam =
      stockValue !== undefined && !Number.isNaN(stockValue) && stockValue >= 0 ? stockValue : undefined;

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
      } else {
        if (imageFile) {
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
        } else {
          const url = form.imageUrl.trim();
          if (!url) {
            toast.error("Выберите файл изображения или укажите URL");
            return;
          }
          await createDecoration({
            name: form.name.trim(),
            description: form.description.trim(),
            price: form.price,
            imageUrl: url,
            type: form.type,
            rarity: form.rarity,
            isAvailable: form.isAvailable,
            stock: stockParam,
          }).unwrap();
        }
        toast.success("Украшение добавлено");
      }

      closeForm();
      refetchDecorations();
    } catch (err) {
      const e = err as { data?: unknown; error?: unknown; status?: unknown };
      const data = e?.data as any;
      const firstError =
        Array.isArray(data?.errors) && data.errors.length > 0
          ? (typeof data.errors[0] === "string" ? data.errors[0] : data.errors[0]?.message)
          : undefined;
      const msg =
        (typeof data?.message === "string" && data.message) ||
        firstError ||
        (typeof e?.error === "string" && e.error) ||
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
      refetchDecorations();
    } catch (err) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Ошибка удаления")
          : "Ошибка удаления";
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const adminModals = isAdmin ? (
    <>
      <AdminModal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingDecoration ? "Редактировать украшение" : "Добавить украшение"}
        size="lg"
        footer={
          <div className="flex justify-between gap-2">
            {editingDecoration ? (
              <button
                type="button"
                onClick={() => setDeleteTarget(editingDecoration)}
                className="admin-btn bg-[var(--destructive)] hover:bg-[var(--destructive)]/90 text-white border-0"
                disabled={isSaving}
              >
                <Trash2 className="w-4 h-4 mr-2 inline" />
                Удалить
              </button>
            ) : (
              <span />
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeForm} className="admin-btn admin-btn-secondary">
                Отмена
              </button>
              <button
                type="submit"
                form="shop-admin-decoration-form"
                disabled={isSaving}
                className="admin-btn admin-btn-primary disabled:opacity-50"
              >
                {isSaving ? "Сохранение..." : editingDecoration ? "Сохранить" : "Добавить"}
              </button>
            </div>
          </div>
        }
      >
        <form id="shop-admin-decoration-form" onSubmit={handleAdminSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Название</label>
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
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Описание</label>
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
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Цена (монеты)</label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: parseInt(e.target.value, 10) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Редкость</label>
              <select
                value={form.rarity}
                onChange={e => setForm(f => ({ ...f, rarity: e.target.value as DecorationRarity }))}
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
                <span className="text-sm font-medium text-[var(--foreground)]">Доступно в магазине</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Лимит количества</label>
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
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              {editingDecoration ? "Изображение (оставьте пустым, чтобы не менять)" : "Файл изображения * (макс. 20 МБ)"}
            </label>
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              onChange={handleImageFileChange}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[var(--primary)] file:text-[var(--primary-foreground)]"
            />

            <div className="mt-3">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">URL изображения (альтернатива файлу)</label>
              <input
                type="text"
                value={form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="https://... или /uploads/..."
              />
            </div>

            {(imageFile || form.imageUrl) && (
              <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden bg-[var(--muted)] flex items-center justify-center">
                {imageFile ? (
                  <img src={URL.createObjectURL(imageFile)} alt="" className="w-full h-full object-cover" />
                ) : form.imageUrl ? (
                  <OptimizedImage
                    src={getDecorationImageUrls(form.imageUrl).primary}
                    fallbackSrc={getDecorationImageUrls(form.imageUrl).fallback}
                    alt=""
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-[var(--muted-foreground)]" />
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
        message={deleteTarget ? `Украшение «${deleteTarget.name}» будет удалено. Это действие нельзя отменить.` : ""}
        confirmText="Удалить"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />
    </>
  ) : null;

  const handlePurchase = async (decorationId: string) => {
    setActionLoading(decorationId);
    try {
      const response = await purchaseDecoration(type, decorationId);
      if (response.success) {
        setUserDecorations(prev => ({
          ...prev,
          owned: [...prev.owned, decorationId],
        }));
        if (isAuthenticated) await loadUserDecorations();
      } else {
        throw new Error(response.message || "Ошибка при покупке");
      }
    } catch (e) {
      throw e;
    } finally {
      setActionLoading(null);
    }
  };

  const handleEquip = async (decorationId: string) => {
    setActionLoading(decorationId);
    try {
      const response = await equipDecoration(type, decorationId);
      if (response.success) {
        setUserDecorations(prev => ({
          ...prev,
          equipped: [...prev.equipped.filter(id => id !== decorationId), decorationId],
        }));
        await refetchProfile();
      } else {
        throw new Error(response.message || "Ошибка при экипировке");
      }
    } catch (e) {
      throw e;
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnequip = async () => {
    setActionLoading("unequip");
    try {
      const response = await unequipDecoration(type);
      if (response.success) {
        setUserDecorations(prev => ({ ...prev, equipped: [] }));
        await refetchProfile();
      } else {
        throw new Error(response.message || "Ошибка при снятии");
      }
    } catch (e) {
      throw e;
    } finally {
      setActionLoading(null);
    }
  };

  const typeTitles: Record<typeof type, string> = {
    avatar: "Аватары",
    frame: "Рамки для аватара",
    background: "Фоны",
    card: "Карточки",
  };
  const typeDescriptions: Record<typeof type, string> = {
    avatar: "Украсьте профиль стильными аватарами",
    frame: "Рамки вокруг аватара в профиле",
    background: "Выберите фон для своего профиля",
    card: "Собирайте карточки для своей колоды",
  };

  if (decorationsLoading) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-1">
            {typeTitles[type]}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">{typeDescriptions[type]}</p>
        </div>
        <ShopSectionSkeleton />
      </div>
    );
  }

  if (decorationsError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-6 h-6 text-[var(--destructive)]" />
          </div>
          <p className="text-[var(--foreground)] font-medium mb-2">Ошибка при загрузке товаров</p>
          {decorationsErrorText && (
            <p className="text-sm text-[var(--muted-foreground)]">{decorationsErrorText}</p>
          )}
          <button
            onClick={() => refetchDecorations()}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (decorations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--muted)] flex items-center justify-center mx-auto mb-4">
            <PackageOpen className="w-7 h-7 text-[var(--muted-foreground)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Нет товаров в этой категории
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Попробуйте другую вкладку или загляните позже
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Добавить украшение
            </button>
          )}
        </div>
        {adminModals}
      </div>
    );
  }

  return (
    <div id="shop-section" role="tabpanel" aria-labelledby={`shop-tab-${type}`}>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-1">
              {typeTitles[type]}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">{typeDescriptions[type]}</p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity self-start"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          )}
        </div>
      </div>

      <div
        className={`grid gap-3 sm:gap-3 lg:gap-4 ${
          type === "avatar" || type === "frame" || type === "card"
            ? type === "card"
              ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center"
              : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        }`}
      >
        {decorations.map(decoration => (
          <div key={decoration.id} className="relative group">
            {isAdmin && (
              <div
                className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(decoration);
                  }}
                  className="p-1.5 sm:p-2 rounded-lg bg-black/35 text-white hover:bg-black/55 backdrop-blur-sm"
                  title="Редактировать"
                >
                  <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(decoration);
                  }}
                  className="p-1.5 sm:p-2 rounded-lg bg-black/35 text-white hover:bg-black/55 backdrop-blur-sm"
                  title="Удалить"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            )}
            <DecorationCard
              decoration={decoration}
              isOwned={effectiveOwned.includes(decoration.id)}
              isEquipped={effectiveEquipped.includes(decoration.id)}
              onPurchase={handlePurchase}
              onEquip={handleEquip}
              onUnequip={handleUnequip}
              isLoading={actionLoading === decoration.id}
              sectionType={type}
            />
          </div>
        ))}
      </div>

      {!isAuthenticated && (
        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/50 p-4 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Войдите в аккаунт, чтобы покупать и использовать украшения
          </p>
        </div>
      )}
      {adminModals}
    </div>
  );
}
