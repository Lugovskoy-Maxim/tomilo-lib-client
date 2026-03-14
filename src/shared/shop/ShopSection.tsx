"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Decoration, DecorationRarity, DecorationType } from "@/api/shop";
import {
  getUserDecorations,
  purchaseDecoration,
  equipDecoration,
  unequipDecoration,
  getDecorationImageUrls,
  getPriceByRarity,
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
  useGetCardDecksQuery,
  useOpenCardDeckMutation,
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
  price: getPriceByRarity("common"),
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-2 md:gap-3 min-w-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden animate-pulse min-w-0"
        >
          <div className="aspect-[3/4] bg-[var(--muted)]" />
          <div className="p-2 sm:p-3 space-y-2">
            <div className="h-3.5 bg-[var(--muted)] rounded w-4/5" />
            <div className="h-9 bg-[var(--muted)] rounded-lg w-full" />
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
  const main =
    dataMessage ||
    (e.error != null ? String(e.error) : "") ||
    (e.message != null ? String(e.message) : "");

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
  const [lastDeckResult, setLastDeckResult] = useState<{
    deckName: string;
    cards: Array<{
      isNew: boolean;
      shardsGained: number;
      card: {
        characterName?: string;
        currentStage?: string;
        stageImageUrl?: string;
        titleName?: string;
      };
    }>;
    pity?: {
      triggered: boolean;
      hitTarget: boolean;
      threshold: number;
      targetRarity: string;
      progress: number;
      remaining: number;
    };
  } | null>(null);

  const publicDecorationsQuery = useGetDecorationsByTypeQuery({ type });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- decorations из запроса
  const decorations: Decoration[] = publicDecorationsQuery.data ?? [];
  const decorationsLoading = publicDecorationsQuery.isLoading;
  const decorationsError = publicDecorationsQuery.error;
  const refetchDecorations = publicDecorationsQuery.refetch;

  const decorationsErrorText = useMemo(
    () => getQueryErrorMessage(decorationsError),
    [decorationsError],
  );

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
  const profileWithDecorations = profile as (typeof profile & UserProfile) | null;
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

  const [filterRarity, setFilterRarity] = useState<DecorationRarity | "all">("all");
  const [priceFrom, setPriceFrom] = useState<string>("");
  const [priceTo, setPriceTo] = useState<string>("");

  const filteredDecorations = useMemo(() => {
    let list = decorations;
    if (filterRarity !== "all") {
      list = list.filter(d => (d.rarity ?? "common") === filterRarity);
    }
    const from = priceFrom.trim() === "" ? null : parseInt(priceFrom, 10);
    const to = priceTo.trim() === "" ? null : parseInt(priceTo, 10);
    if (from !== null && !Number.isNaN(from)) {
      list = list.filter(d => (d.price ?? 0) >= from);
    }
    if (to !== null && !Number.isNaN(to)) {
      list = list.filter(d => (d.price ?? 0) <= to);
    }
    return list;
  }, [decorations, filterRarity, priceFrom, priceTo]);

  // --- Admin: create/edit decorations right on shop page ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDecoration, setEditingDecoration] = useState<Decoration | null>(null);
  const [form, setForm] = useState({ ...emptyAdminForm, type: type as DecorationType });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Decoration | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [createDecoration, { isLoading: isCreatingJson }] = useCreateDecorationMutation();
  const [createDecorationWithImage, { isLoading: isCreatingWithImage }] =
    useCreateDecorationWithImageMutation();
  const [updateDecoration, { isLoading: isUpdatingJson }] = useUpdateDecorationMutation();
  const [updateDecorationWithImage, { isLoading: isUpdatingWithImage }] =
    useUpdateDecorationWithImageMutation();
  const [deleteDecoration] = useDeleteDecorationMutation();
  const {
    data: decksData,
    isLoading: decksLoading,
    refetch: refetchDecks,
  } = useGetCardDecksQuery(undefined, {
    skip: type !== "card",
  });
  const [openCardDeck, { isLoading: isOpeningDeck }] = useOpenCardDeckMutation();
  const decks = decksData?.decks ?? [];

  const isSaving = isCreatingJson || isCreatingWithImage || isUpdatingJson || isUpdatingWithImage;

  const openCreate = () => {
    setEditingDecoration(null);
    setForm({ ...emptyAdminForm, type: type as DecorationType });
    setImageFile(null);
    setIsFormOpen(true);
  };

  const openEdit = (d: Decoration) => {
    setEditingDecoration(d);
    const rarity = (d.rarity ?? "common") as DecorationRarity;
    setForm({
      name: d.name ?? "",
      description: d.description ?? "",
      price: getPriceByRarity(rarity),
      imageUrl: d.imageUrl ?? "",
      type: d.type,
      rarity,
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
      toast.error(
        `Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ). Максимум — 20 МБ.`,
      );
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
        : typeof form.stock === "number"
          ? form.stock
          : parseInt(String(form.stock), 10);
    const stockParam =
      stockValue !== undefined && !Number.isNaN(stockValue) && stockValue >= 0
        ? stockValue
        : undefined;

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
      const data = e?.data as
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
    } catch (e) {
      const err = e as { status?: number; data?: { message?: string } };
      if (err?.status === 404) {
        toast.info("Украшение уже удалено или не найдено");
        setDeleteTarget(null);
        refetchDecorations();
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
                value={form.price}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 text-[var(--foreground)] cursor-default"
                title="Цена по редкости: 800 / 1200 / 1800 / 4000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Редкость
              </label>
              <select
                value={form.rarity}
                onChange={e => {
                  const rarity = e.target.value as DecorationRarity;
                  setForm(f => ({ ...f, rarity, price: getPriceByRarity(rarity) }));
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
            </div>

            {(imageFile || form.imageUrl) && (
              <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden bg-[var(--muted)] flex items-center justify-center">
                {imageFile ? (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
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
        message={
          deleteTarget
            ? `Украшение «${deleteTarget.name}» будет удалено. Это действие нельзя отменить.`
            : ""
        }
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

  const typeDescriptions: Record<typeof type, string> = {
    avatar: "Украсьте профиль стильными аватарами",
    frame: "Рамки вокруг аватара в профиле",
    background: "Выберите фон для своего профиля",
    card: "Собирайте карточки персонажей и открывайте колоды",
  };

  if (decorationsLoading) {
    return (
      <div>
        <ShopSectionSkeleton />
      </div>
    );
  }

  if (decorationsError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
        <p className="text-[var(--foreground)] font-medium mb-1">Не удалось загрузить товары</p>
        {decorationsErrorText && (
          <p className="text-sm text-[var(--muted-foreground)] mb-4 max-w-sm text-center">
            {decorationsErrorText}
          </p>
        )}
        <button
          onClick={() => refetchDecorations()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4" />
          Повторить
        </button>
        {adminModals}
      </div>
    );
  }

  if (decorations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--muted)] flex items-center justify-center mb-3">
          <PackageOpen className="w-6 h-6 text-[var(--muted-foreground)]" aria-hidden />
        </div>
        <p className="text-[var(--foreground)] font-medium mb-1">В этой категории пока пусто</p>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Выберите другую вкладку или зайдите позже
        </p>
        {isAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        )}
        {adminModals}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="text-sm text-[var(--muted-foreground)]">{typeDescriptions[type]}</p>
        {isAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        )}
      </div>

      {/* Фильтры по качеству и цене — всегда видны, на мобильных удобная вертикальная группировка и крупные поля */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs font-medium text-[var(--muted-foreground)] w-full sm:w-auto">
            Качество
          </span>
          <select
            value={filterRarity}
            onChange={e => setFilterRarity(e.target.value as DecorationRarity | "all")}
            className="min-h-[44px] flex-1 sm:flex-none min-w-[140px] rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            aria-label="Фильтр по редкости"
          >
            <option value="all">Все</option>
            {RARITY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {(filterRarity !== "all" || priceFrom !== "" || priceTo !== "") && (
            <button
              type="button"
              onClick={() => {
                setFilterRarity("all");
                setPriceFrom("");
                setPriceTo("");
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors"
            >
              Сбросить
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs font-medium text-[var(--muted-foreground)] w-full sm:w-auto">
            Цена, монеты
          </span>
          <div className="flex flex-1 sm:flex-none items-center gap-2 min-w-0">
            <label className="sr-only" htmlFor="shop-filter-price-from">
              От
            </label>
            <input
              id="shop-filter-price-from"
              type="number"
              min={0}
              value={priceFrom}
              onChange={e => setPriceFrom(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="от"
              className="min-h-[44px] flex-1 min-w-0 w-20 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Цена от"
            />
            <span className="text-[var(--muted-foreground)] shrink-0">—</span>
            <label className="sr-only" htmlFor="shop-filter-price-to">
              До
            </label>
            <input
              id="shop-filter-price-to"
              type="number"
              min={0}
              value={priceTo}
              onChange={e => setPriceTo(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="до"
              className="min-h-[44px] flex-1 min-w-0 w-20 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Цена до"
            />
          </div>
        </div>
        {filteredDecorations.length !== decorations.length && (
          <p className="text-xs text-[var(--muted-foreground)]">
            Показано {filteredDecorations.length} из {decorations.length}
          </p>
        )}
      </div>

      {type === "card" && (
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Колоды карточек</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Откройте колоду и получите несколько карточек сразу. У тайтл-колод шанс на персонажей из выбранного тайтла выше.
              </p>
            </div>
            <button type="button" onClick={() => refetchDecks()} className="admin-btn admin-btn-secondary">
              Обновить
            </button>
          </div>
          {decksLoading ? (
            <p className="text-sm text-[var(--muted-foreground)]">Загрузка колод...</p>
          ) : decks.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">Колоды пока не добавлены.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[...decks]
                .sort((a, b) => Number(Boolean(b.isPremium)) - Number(Boolean(a.isPremium)))
                .map((deck) => (
                <div key={deck.id ?? deck._id ?? deck.name} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                  <div className="aspect-[3/2] rounded-lg bg-[var(--muted)] overflow-hidden mb-3 flex items-center justify-center">
                    {deck.imageUrl ? (
                      <img src={getDecorationImageUrls(deck.imageUrl).primary} alt={deck.name} className="w-full h-full object-cover" />
                    ) : (
                      <PackageOpen className="w-6 h-6 text-[var(--muted-foreground)]" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-[var(--foreground)] flex flex-wrap items-center gap-2">
                      <span>{deck.name}</span>
                      {deck.isPremium ? (
                        <span className="games-badge">Premium title deck</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {deck.titleName ? `Фокус: ${deck.titleName}` : "Общий пул"} · {deck.cardsPerOpen} карточек
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      Шанс тайтл-пула: {Math.round((deck.titleFocusChance ?? 0) * 100)}%
                      {deck.quantity != null ? ` · осталось ${deck.quantity}` : ""}
                    </div>
                    {(deck.pityThreshold ?? 0) > 0 ? (
                      <div className="text-xs text-[var(--muted-foreground)]">
                        Pity: {deck.pityTargetRarity || "rare"} после {deck.pityThreshold} неудачных открытий
                        {typeof deck.pityProgress === "number"
                          ? ` · прогресс ${deck.pityProgress}/${deck.pityThreshold}`
                          : ""}
                      </div>
                    ) : null}
                    {deck.description ? (
                      <p className="text-sm text-[var(--muted-foreground)] pt-1">{deck.description}</p>
                    ) : null}
                  </div>
                  {(deck.pityThreshold ?? 0) > 0 ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)] mb-1">
                        <span>Pity прогресс</span>
                        <span>{Math.min(deck.pityProgress ?? 0, deck.pityThreshold ?? 0)}/{deck.pityThreshold}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)] transition-all"
                          style={{
                            width: `${Math.min(100, ((deck.pityProgress ?? 0) / Math.max(1, deck.pityThreshold ?? 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    disabled={!isAuthenticated || isOpeningDeck || deck.quantity === 0}
                    className="games-btn games-btn-primary w-full mt-3"
                    onClick={async () => {
                      try {
                        const result = await openCardDeck(deck.id ?? deck._id ?? "").unwrap();
                        const cards = result?.openedCards ?? [];
                        setLastDeckResult({
                          deckName: result?.deck?.name ?? deck.name,
                          cards: cards.map((entry) => ({
                            isNew: entry.isNew,
                            shardsGained: entry.shardsGained,
                            card: entry.card as {
                              characterName?: string;
                              currentStage?: string;
                              stageImageUrl?: string;
                              titleName?: string;
                            },
                          })),
                          pity: result?.pity,
                        });
                        if (cards.length === 0) {
                          toast.info("Колода открыта, но карточки не вернулись в ответе.");
                        } else {
                          cards.forEach((entry) => {
                            const card = entry.card as { characterName?: string; currentStage?: string; stageImageUrl?: string };
                            const label = card.characterName || "Карточка";
                            toast.success(
                              entry.isNew
                                ? `Из колоды: ${label} [${card.currentStage ?? "F"}]`
                                : `Дубликат ${label}: +${entry.shardsGained ?? 0} осколков`,
                              5000,
                              { icon: card.stageImageUrl },
                            );
                          });
                          if (result?.pity?.triggered) {
                            toast.success(`Pity сработал: гарантирована редкость ${result.pity.targetRarity}`);
                          } else if (result?.pity && result.pity.threshold > 0) {
                            toast.info(
                              result.pity.remaining > 0
                                ? `До pity осталось ${result.pity.remaining} откр.`
                                : "Следующее открытие активирует pity",
                            );
                          }
                        }
                        await loadUserDecorations();
                        await refetchProfile();
                        refetchDecks();
                      } catch (error) {
                        toast.error(getQueryErrorMessage(error));
                      }
                    }}
                  >
                    {!isAuthenticated
                      ? "Войдите, чтобы открыть"
                      : deck.quantity === 0
                        ? "Колода закончилась"
                        : `Открыть за ${deck.price} монет`}
                  </button>
                </div>
              ))}
            </div>
          )}
          {lastDeckResult ? (
            <div className="mt-4 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">
                    Последнее открытие: {lastDeckResult.deckName}
                  </h4>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {lastDeckResult.cards.length > 0
                      ? `Получено карточек: ${lastDeckResult.cards.length}`
                      : "Сервер не вернул карточки в последнем ответе."}
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setLastDeckResult(null)}
                >
                  Скрыть
                </button>
              </div>
              {lastDeckResult.pity ? (
                <div className="text-xs text-[var(--muted-foreground)] mb-3">
                  {lastDeckResult.pity.triggered
                    ? `Pity сработал: гарантирована редкость ${lastDeckResult.pity.targetRarity}.`
                    : `До pity осталось ${lastDeckResult.pity.remaining} открытий.`}
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {lastDeckResult.cards.map((entry, index) => (
                  <div key={`${entry.card.characterName ?? "card"}-${index}`} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[var(--muted)] mb-2">
                      {entry.card.stageImageUrl ? (
                        <img
                          src={getDecorationImageUrls(entry.card.stageImageUrl).primary}
                          alt={entry.card.characterName || "Карточка"}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="text-sm font-medium text-[var(--foreground)] truncate">
                      {entry.card.characterName || "Карточка"}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] truncate">
                      {entry.card.titleName || "Без тайтла"} · ранг {entry.card.currentStage ?? "F"}
                    </div>
                    <div className="mt-2 text-xs">
                      {entry.isNew ? (
                        <span className="games-badge games-badge--primary">Новая</span>
                      ) : (
                        <span className="games-badge">+{entry.shardsGained} осколков</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {filteredDecorations.length === 0 ? (
        <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
          Нет украшений по выбранным фильтрам. Измените качество или цену.
        </div>
      ) : (
        <div
          className={`grid gap-2 sm:gap-3 md:gap-4 min-w-0 ${
            type === "avatar" || type === "frame" || type === "card"
              ? type === "card"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 justify-items-stretch items-stretch"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 justify-items-stretch items-stretch"
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5"
          }`}
        >
          {filteredDecorations.map(decoration => (
            <div
              key={decoration.id}
              className="relative group w-full min-w-0 flex flex-col items-center justify-start overflow-hidden"
            >
              {isAdmin && (
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={e => {
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
                    onClick={e => {
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
                authorDisplay="author"
              />
            </div>
          ))}
        </div>
      )}

      {!isAuthenticated && (
        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          Войдите в аккаунт, чтобы покупать и надевать украшения
        </p>
      )}
      {adminModals}
    </div>
  );
}
