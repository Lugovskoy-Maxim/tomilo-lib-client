"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Package, ImageIcon, User, Layers, Sparkles, Crown, ShoppingBag } from "lucide-react";
import Link from "next/link";
import {
  useGetUserProfileDecorationsQuery,
  useGetDecorationsQuery,
  useEquipDecorationMutation,
  useUnequipDecorationMutation,
} from "@/store/api/shopApi";
import { useGetProfileQuery } from "@/store/api/authApi";
import { useGetProfileCardsQuery, useUpdateProfileCardsShowcaseMutation } from "@/store/api/gamesApi";
import { DecorationCard } from "@/shared/shop/DecorationCard";
import { getDecorationImageUrl, normalizeRarity, type Decoration } from "@/api/shop";
import type { UserProfile } from "@/types/user";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { getDecorationImageUrls } from "@/api/shop";

/** Как в магазине: достаёт id из значения API (строка, объект с id/_id). URL не возвращаются. */
function getEquippedId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") {
    const s = value.trim();
    if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return "";
    return s;
  }
  if (typeof value === "object" && value !== null) {
    const o = value as Record<string, unknown>;
    const id = o.id ?? o._id;
    return typeof id === "string" ? id.trim() : "";
  }
  return "";
}

function toPathKey(url: string): string {
  const s = url.trim().replace(/\/+$/, "");
  try {
    if (s.startsWith("http://") || s.startsWith("https://")) {
      const u = new URL(s);
      return u.pathname || s;
    }
  } catch {
    // ignore
  }
  return s.startsWith("/") ? s : `/${s}`;
}

/** Если профиль вернул URL/путь — находим id декорации по списку (как в useEquippedFrameUrl). */
function resolveEquippedToId(value: unknown, list: Decoration[]): string {
  const id = getEquippedId(value);
  if (id) return id;
  if (value == null || list.length === 0) return "";
  let urlToMatch: string | null = null;
  if (typeof value === "string" && value.trim()) {
    urlToMatch = value.startsWith("http") ? value : getDecorationImageUrl(value.trim());
  } else if (typeof value === "object" && value !== null) {
    const o = value as Record<string, unknown>;
    const imageUrl = (o.imageUrl ?? o.image_url) as string | undefined;
    if (imageUrl) urlToMatch = getDecorationImageUrl(imageUrl);
  }
  if (!urlToMatch) return "";
  const pathKey = toPathKey(urlToMatch);
  const found = list.find(d => {
    const decUrl = getDecorationImageUrl(d.imageUrl);
    if (!decUrl) return false;
    const decPath = toPathKey(decUrl);
    return decPath === pathKey || decPath.endsWith(pathKey) || pathKey.endsWith(decPath);
  });
  return found ? String(found.id) : "";
}

const TYPE_CONFIG: Record<
  "avatar" | "frame" | "background" | "card",
  { label: string; icon: React.ElementType }
> = {
  avatar: { label: "Аватар", icon: User },
  frame: { label: "Рамка", icon: Layers },
  background: { label: "Фон профиля", icon: ImageIcon },
  card: { label: "Карточка", icon: Layers },
};

export default function ProfileInventory() {
  const toast = useToast();
  const { user } = useAuth();
  const {
    data: userDecorations = [],
    isLoading: isLoadingUserDecorations,
    isError,
    refetch: refetchDecorations,
  } = useGetUserProfileDecorationsQuery();
  const { data: profileData, refetch: refetchProfile } = useGetProfileQuery();
  const ownedFromProfile = useMemo(
    () =>
      (profileData?.success && profileData.data
        ? (profileData.data as UserProfile).ownedDecorations
        : []) ?? [],
    [profileData],
  );
  const needCatalogFallback = userDecorations.length === 0 && ownedFromProfile.length > 0;
  /** Каталог нужен и для fallback-списка, и для подстановки редкости в userDecorations (в профиле API может не отдавать rarity). */
  const needCatalog = needCatalogFallback || userDecorations.length > 0;
  const {
    data: catalogDecorations = [],
    isLoading: isLoadingCatalog,
    refetch: refetchCatalog,
  } = useGetDecorationsQuery(undefined, {
    skip: !needCatalog,
    refetchOnMountOrArgChange: 60,
  });
  const isLoading = isLoadingUserDecorations || (needCatalogFallback && isLoadingCatalog);
  const profile = profileData?.success ? profileData.data : null;
  const profileWithDecorations = profile as (typeof profile & UserProfile) | null;
  /** Надетые декорации: из ответа профиля (camelCase/snake_case) или из Auth (уже нормализовано). */
  const equippedRaw = (profileWithDecorations?.equippedDecorations ??
    (profileWithDecorations as unknown as Record<string, unknown>)?.equipped_decorations ??
    user?.equippedDecorations) as UserProfile["equippedDecorations"] | undefined;
  const [equipDecoration] = useEquipDecorationMutation();
  const [unequipDecoration] = useUnequipDecorationMutation();
  const { data: cardsResponse, refetch: refetchCards } = useGetProfileCardsQuery();
  const [updateProfileCardsShowcase, { isLoading: isSavingCardsShowcase }] = useUpdateProfileCardsShowcaseMutation();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"avatar" | "frame" | "background" | "card" | "all">(
    "all",
  );

  /** Список для сопоставления URL→id (профиль может вернуть URL вместо id). */
  const resolutionList = useMemo(
    () => (userDecorations.length > 0 ? userDecorations : catalogDecorations),
    [userDecorations, catalogDecorations],
  );

  /**
   * Та же логика, что и в магазине (ShopSection):
   * effectiveOwned — id купленных, effectiveEquipped — id надетых.
   * Сначала из API магазина (userDecorations), при пустоте — fallback из профиля.
   */
  const { effectiveOwned, effectiveEquipped } = useMemo(() => {
    let owned: string[] = userDecorations.map((d: Decoration) => String(d.id));
    let equipped: string[] = userDecorations
      .filter((d: Decoration) => d.isEquipped)
      .map((d: Decoration) => String(d.id));

    if (owned.length === 0 && (profileWithDecorations?.ownedDecorations?.length ?? 0) > 0) {
      owned = (profileWithDecorations!.ownedDecorations ?? []).map(e => e.decorationId);
    }
    if (equipped.length === 0 && equippedRaw) {
      const raw = equippedRaw as Record<string, unknown>;
      const types = ["avatar", "frame", "background", "card"] as const;
      equipped = types
        .map(type => {
          const val = raw[type] ?? raw[`${type}_id`];
          return resolveEquippedToId(val, resolutionList) || getEquippedId(val);
        })
        .filter(Boolean);
    }
    return { effectiveOwned: owned, effectiveEquipped: equipped };
  }, [userDecorations, profileWithDecorations, equippedRaw, resolutionList]);

  /** Список приобретённых. Редкость всегда берём из каталога (как в магазине) — API профиля может не отдавать rarity. */
  const displayList = useMemo((): Decoration[] => {
    const catalogById = new Map(catalogDecorations.map(d => [d.id, d]));
    if (userDecorations.length > 0) {
      return userDecorations.map((d: Decoration) => {
        const fromCatalog = catalogById.get(d.id);
        if (!fromCatalog) return { ...d, rarity: normalizeRarity(d.rarity) };
        const merged = { ...fromCatalog, ...d };
        merged.rarity = normalizeRarity(merged.rarity ?? fromCatalog.rarity);
        return merged;
      });
    }
    if (ownedFromProfile.length === 0) return [];
    return ownedFromProfile.flatMap(entry => {
      const dec = catalogById.get(entry.decorationId);
      const type = entry.decorationType as Decoration["type"];
      if (dec) {
        return [{ ...dec, type, rarity: normalizeRarity(dec.rarity) }];
      }
      return [
        {
          id: entry.decorationId,
          name: "",
          description: "",
          price: 0,
          imageUrl: "",
          type,
          rarity: "common",
        },
      ];
    });
  }, [userDecorations, ownedFromProfile, catalogDecorations]);

  /** Если в профиле есть купленные декорации, которых нет в каталоге (например, только что добавленные), подтягиваем каталог. */
  const hasRefetchedForMissing = useRef(false);
  useEffect(() => {
    if (
      !needCatalog ||
      catalogDecorations.length === 0 ||
      ownedFromProfile.length === 0 ||
      hasRefetchedForMissing.current
    )
      return;
    const catalogIds = new Set(catalogDecorations.map(d => d.id));
    const missing = ownedFromProfile.some(e => !catalogIds.has(e.decorationId));
    if (missing) {
      hasRefetchedForMissing.current = true;
      refetchCatalog();
    }
    // catalogDecorations целиком не в deps — используем только length для проверки
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needCatalog, catalogDecorations.length, ownedFromProfile, refetchCatalog]);

  /** В инвентаре показываем только приобретённые декорации. */
  const filteredDecorations = useMemo(() => {
    if (typeFilter === "all") return displayList;
    return displayList.filter((d: Decoration) => d.type === typeFilter);
  }, [displayList, typeFilter]);

  const inventoryStats = useMemo(() => {
    const total = displayList.length;
    const equipped = effectiveEquipped.length;
    const byType = {
      avatar: displayList.filter((d: Decoration) => d.type === "avatar").length,
      frame: displayList.filter((d: Decoration) => d.type === "frame").length,
      background: displayList.filter((d: Decoration) => d.type === "background").length,
      card: displayList.filter((d: Decoration) => d.type === "card").length,
    };
    const byRarity = {
      common: displayList.filter((d: Decoration) => d.rarity === "common").length,
      rare: displayList.filter((d: Decoration) => d.rarity === "rare").length,
      epic: displayList.filter((d: Decoration) => d.rarity === "epic").length,
      legendary: displayList.filter((d: Decoration) => d.rarity === "legendary").length,
    };
    return { total, equipped, byType, byRarity };
  }, [displayList, effectiveEquipped]);
  const profileCards = cardsResponse?.data?.cards ?? [];
  const profileCardsShowcase = cardsResponse?.data?.showcase ?? [];
  const showcaseSort = cardsResponse?.data?.showcaseSort ?? "manual";
  const showcaseIds = new Set(profileCardsShowcase.map(card => card.id));
  const sortedProfileCards = useMemo(() => {
    const rarityRank: Record<string, number> = {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5,
    };
    const stageRank: Record<string, number> = {
      F: 1,
      E: 2,
      D: 3,
      C: 4,
      B: 5,
      A: 6,
      S: 7,
      SS: 8,
      SSS: 9,
    };
    return [...profileCards].sort((a, b) => {
      if (showcaseSort === "rarity") {
        return (
          (rarityRank[b.rarity] ?? 0) - (rarityRank[a.rarity] ?? 0) ||
          (stageRank[b.currentStage] ?? 0) - (stageRank[a.currentStage] ?? 0)
        );
      }
      if (showcaseSort === "favorites") {
        return (
          Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)) ||
          (rarityRank[b.rarity] ?? 0) - (rarityRank[a.rarity] ?? 0)
        );
      }
      if (showcaseSort === "last_upgraded") {
        return (
          new Date(b.lastUpgradedAt ?? 0).getTime() -
            new Date(a.lastUpgradedAt ?? 0).getTime() ||
          (rarityRank[b.rarity] ?? 0) - (rarityRank[a.rarity] ?? 0)
        );
      }
      return 0;
    });
  }, [profileCards, showcaseSort]);

  const handleEquip = async (
    type: "avatar" | "frame" | "background" | "card",
    decorationId: string,
  ) => {
    setActionLoading(decorationId);
    try {
      await equipDecoration({ type, decorationId }).unwrap();
      toast.success("Предмет надет");
      await Promise.all([refetchProfile(), refetchDecorations()]);
    } catch {
      toast.error("Не удалось надеть предмет");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnequip = async (type: "avatar" | "frame" | "background" | "card") => {
    setActionLoading(`unequip-${type}`);
    try {
      await unequipDecoration({ type }).unwrap();
      toast.success("Предмет снят");
      await Promise.all([refetchProfile(), refetchDecorations()]);
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : undefined;
      if (status === 404) {
        toast.success("Предмет снят");
        await Promise.all([refetchProfile(), refetchDecorations()]);
      } else {
        toast.error("Не удалось снять предмет");
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 min-h-[300px] flex items-center justify-center shadow-sm">
        <div className="w-10 h-10 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in-up">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 pb-4 border-b border-[var(--border)]/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--chart-2)]/15 text-[var(--chart-2)]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Инвентарь</h2>
              <p className="text-[var(--muted-foreground)] text-sm">
                {inventoryStats.total}{" "}
                {inventoryStats.total === 1
                  ? "предмет"
                  : inventoryStats.total < 5
                    ? "предмета"
                    : "предметов"}{" "}
                • {inventoryStats.equipped} надето
              </p>
            </div>
          </div>
          <Link
            href="/tomilo-shop"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--chart-1)] text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-md shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />В магазин
          </Link>
        </div>

        {inventoryStats.total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {inventoryStats.byRarity.legendary > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-500">
                  {inventoryStats.byRarity.legendary} легенд.
                </span>
              </div>
            )}
            {inventoryStats.byRarity.epic > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium text-purple-500">
                  {inventoryStats.byRarity.epic} эпич.
                </span>
              </div>
            )}
            {inventoryStats.byRarity.rare > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Package className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-500">
                  {inventoryStats.byRarity.rare} редких
                </span>
              </div>
            )}
            {inventoryStats.byRarity.common > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--secondary)]/50 border border-[var(--border)]/60">
                <Package className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  {inventoryStats.byRarity.common} обычных
                </span>
              </div>
            )}
          </div>
        )}

        {profileCards.length > 0 && (
          <div className="mb-6 rounded-xl border border-[var(--border)]/60 bg-[var(--background)] p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Витрина карточек</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Выберите до 6 карточек для публичного профиля. Сейчас в коллекции {profileCards.length}.
                </p>
              </div>
              <select
                value={showcaseSort}
                onChange={async (e) => {
                  try {
                    await updateProfileCardsShowcase({
                      cardIds: profileCardsShowcase.map((entry) => entry.id),
                      sortMode: e.target.value as "manual" | "rarity" | "favorites" | "last_upgraded",
                    }).unwrap();
                    await refetchCards();
                    toast.success("Сортировка витрины обновлена");
                  } catch {
                    toast.error("Не удалось обновить сортировку витрины");
                  }
                }}
                className="admin-input max-w-[220px]"
                disabled={isSavingCardsShowcase}
              >
                <option value="manual">Сортировка: вручную</option>
                <option value="rarity">Сортировка: по редкости</option>
                <option value="favorites">Сортировка: по любимым</option>
                <option value="last_upgraded">Сортировка: по последнему апгрейду</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2 mb-3 text-xs text-[var(--muted-foreground)]">
              <span className="px-2 py-1 rounded-full bg-[var(--card)] border border-[var(--border)]">
                На витрине: {profileCardsShowcase.length}/6
              </span>
              <span className="px-2 py-1 rounded-full bg-[var(--card)] border border-[var(--border)]">
                Свободно слотов: {Math.max(0, 6 - profileCardsShowcase.length)}
              </span>
              {showcaseSort !== "manual" ? (
                <span className="px-2 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--foreground)]">
                  Порядок на публичной витрине управляется сортировкой
                </span>
              ) : null}
            </div>
            {profileCardsShowcase.length > 0 ? (
              <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-2">
                  Текущая витрина
                </div>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
                  {profileCardsShowcase.map((card) => (
                    <div key={card.id} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2">
                      <div className="aspect-[3/4] rounded-md overflow-hidden bg-[var(--muted)] mb-2">
                        {card.stageImageUrl ? (
                          <img
                            src={getDecorationImageUrls(card.stageImageUrl).primary}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="text-xs font-medium truncate">{card.characterName || card.name}</div>
                      <div className="text-[11px] text-[var(--muted-foreground)] truncate">
                        {card.currentStage} · {card.titleName || "Без тайтла"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sortedProfileCards.map((card) => {
                const isSelected = showcaseIds.has(card.id);
                return (
                  <button
                    key={card.id}
                    type="button"
                    className={`text-left rounded-xl border p-3 transition-colors ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)]/5"
                        : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40"
                    }`}
                    onClick={async () => {
                      const nextIds = isSelected
                        ? profileCardsShowcase.filter((entry) => entry.id !== card.id).map((entry) => entry.id)
                        : [...profileCardsShowcase.map((entry) => entry.id), card.id].slice(0, 6);
                      try {
                        await updateProfileCardsShowcase({
                          cardIds: nextIds,
                          sortMode: showcaseSort,
                        }).unwrap();
                        await refetchCards();
                        toast.success(isSelected ? "Карточка убрана из витрины" : "Карточка добавлена в витрину");
                      } catch {
                        toast.error("Не удалось обновить витрину");
                      }
                    }}
                    disabled={isSavingCardsShowcase}
                  >
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[var(--muted)] mb-2">
                      {card.stageImageUrl ? (
                        <img
                          src={getDecorationImageUrls(card.stageImageUrl).primary}
                          alt={card.name}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="font-medium text-sm">{card.characterName || card.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {card.titleName || "Без тайтла"} · ранг {card.currentStage}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1 flex flex-wrap gap-2">
                      {card.isFavorite ? <span>Любимый персонаж</span> : null}
                      {card.lastUpgradedAt ? (
                        <span>Апгрейд: {new Date(card.lastUpgradedAt).toLocaleDateString()}</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">
                      {isSelected ? "На витрине" : "Нажмите, чтобы показать"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "avatar", "frame", "background", "card"] as const).map(t => {
            const config = t === "all" ? null : TYPE_CONFIG[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === t
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--secondary)]/60 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                }`}
              >
                {t === "all"
                  ? "Все"
                  : config && (
                      <span className="flex items-center gap-2">
                        <config.icon className="w-4 h-4" />
                        {config.label}
                      </span>
                    )}
              </button>
            );
          })}
        </div>

        {filteredDecorations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl bg-gradient-to-b from-[var(--secondary)]/30 to-transparent border border-[var(--border)]/50">
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/10">
                <Package className="h-10 w-10 text-purple-500" />
              </div>
              {displayList.length === 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--chart-2)] flex items-center justify-center shadow-md">
                  <ShoppingBag className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">
              {isError
                ? "Ошибка загрузки"
                : displayList.length === 0
                  ? "Инвентарь пуст"
                  : "Категория пуста"}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] max-w-sm mb-5">
              {isError
                ? "Не удалось загрузить инвентарь. Проверьте подключение и попробуйте снова."
                : displayList.length === 0
                  ? "Украсьте свой профиль уникальными рамками, аватарами и фонами из магазина!"
                  : "В этой категории пока ничего нет. Посетите магазин за новыми предметами."}
            </p>
            {isError ? (
              <button
                type="button"
                onClick={() => refetchDecorations()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-md"
              >
                Повторить попытку
              </button>
            ) : (
              <Link
                href="/tomilo-shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                Открыть магазин
              </Link>
            )}
            {displayList.length === 0 && !isError && (
              <div className="mt-6 flex items-center gap-3 opacity-40">
                <div className="w-12 h-12 rounded-lg bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center">
                  <User className="w-5 h-5 text-[var(--muted-foreground)]" />
                </div>
                <div className="w-12 h-12 rounded-lg bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center">
                  <Layers className="w-5 h-5 text-[var(--muted-foreground)]" />
                </div>
                <div className="w-20 h-12 rounded-lg bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-[var(--muted-foreground)]" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDecorations.map((decoration: Decoration) => (
              <div
                key={decoration.id}
                className={decoration.type === "background" ? "sm:col-span-2" : undefined}
              >
                <DecorationCard
                  decoration={decoration}
                  isOwned={effectiveOwned.includes(decoration.id)}
                  isEquipped={effectiveEquipped.includes(decoration.id)}
                  onEquip={() => handleEquip(decoration.type, decoration.id)}
                  onUnequip={
                    effectiveEquipped.includes(decoration.id)
                      ? () => handleUnequip(decoration.type)
                      : undefined
                  }
                  isLoading={
                    actionLoading === decoration.id ||
                    actionLoading === `unequip-${decoration.type}`
                  }
                  hidePurchase
                  showActionToast={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
