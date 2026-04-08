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
  const profileCards = useMemo(
    () => cardsResponse?.data?.cards ?? [],
    [cardsResponse?.data?.cards],
  );
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
      <div className="profile-glass-card rounded-xl p-8 min-h-[200px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in-up">
      <div className="profile-glass-card rounded-xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-[var(--border)]/50">
          <div className="flex items-center gap-2 min-w-0">
            <Package className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" aria-hidden />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[var(--foreground)] truncate">Инвентарь</h2>
              <p className="text-[var(--muted-foreground)] text-xs truncate">
                {inventoryStats.total}{" "}
                {inventoryStats.total === 1
                  ? "предмет"
                  : inventoryStats.total < 5
                    ? "предмета"
                    : "предметов"}{" "}
                · {inventoryStats.equipped} надето
              </p>
            </div>
          </div>
          <Link
            href="/tomilo-shop"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border)]/80 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            В магазин
          </Link>
        </div>

        {inventoryStats.total > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {inventoryStats.byRarity.legendary > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-medium text-amber-500">
                <Crown className="w-3 h-3" />
                {inventoryStats.byRarity.legendary}
              </span>
            )}
            {inventoryStats.byRarity.epic > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-medium text-purple-500">
                <Sparkles className="w-3 h-3" />
                {inventoryStats.byRarity.epic}
              </span>
            )}
            {inventoryStats.byRarity.rare > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-medium text-blue-500">
                <Package className="w-3 h-3" />
                {inventoryStats.byRarity.rare}
              </span>
            )}
            {inventoryStats.byRarity.common > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--secondary)]/50 border border-[var(--border)]/60 text-[10px] font-medium text-[var(--muted-foreground)]">
                <Package className="w-3 h-3" />
                {inventoryStats.byRarity.common}
              </span>
            )}
          </div>
        )}

        {profileCards.length > 0 && (
          <div className="mb-4 rounded-lg border border-[var(--border)]/60 bg-[var(--background)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-[var(--foreground)]">Витрина карточек</h3>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  До 6 карточек · в коллекции {profileCards.length}
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
                    toast.success("Сортировка обновлена");
                  } catch {
                    toast.error("Не удалось обновить сортировку");
                  }
                }}
                className="admin-input text-xs py-1.5 max-w-[160px]"
                disabled={isSavingCardsShowcase}
              >
                <option value="manual">Вручную</option>
                <option value="rarity">По редкости</option>
                <option value="favorites">По любимым</option>
                <option value="last_upgraded">По апгрейду</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2 text-[10px] text-[var(--muted-foreground)]">
              <span className="px-1.5 py-0.5 rounded bg-[var(--card)] border border-[var(--border)]">
                Витрина: {profileCardsShowcase.length}/6
              </span>
              {showcaseSort !== "manual" && (
                <span className="px-1.5 py-0.5 rounded bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--foreground)]">
                  Порядок по сортировке
                </span>
              )}
            </div>
            {profileCardsShowcase.length > 0 ? (
              <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-1.5">
                  На витрине
                </div>
                <div className="grid gap-1.5 grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
                  {profileCardsShowcase.map((card) => (
                    <div key={card.id} className="rounded-md border border-[var(--border)] bg-[var(--background)] p-1.5">
                      <div className="aspect-[3/4] rounded overflow-hidden bg-[var(--muted)] mb-1">
                        {card.stageImageUrl ? (
                          <img
                            src={getDecorationImageUrls(card.stageImageUrl).primary}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="text-[10px] font-medium truncate">{card.characterName || card.name}</div>
                      <div className="text-[9px] text-[var(--muted-foreground)] truncate">
                        {card.currentStage} · {card.titleName || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {sortedProfileCards.map((card) => {
                const isSelected = showcaseIds.has(card.id);
                return (
                  <button
                    key={card.id}
                    type="button"
                    className={`text-left rounded-lg border p-2 transition-colors ${
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
                        toast.success(isSelected ? "Убрано с витрины" : "Добавлено на витрину");
                      } catch {
                        toast.error("Не удалось обновить витрину");
                      }
                    }}
                    disabled={isSavingCardsShowcase}
                  >
                    <div className="aspect-[3/4] rounded overflow-hidden bg-[var(--muted)] mb-1.5">
                      {card.stageImageUrl ? (
                        <img
                          src={getDecorationImageUrls(card.stageImageUrl).primary}
                          alt={card.name}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="font-medium text-xs truncate">{card.characterName || card.name}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)] truncate">
                      {card.titleName || "—"} · {card.currentStage}
                    </div>
                    <div className="text-[9px] text-[var(--muted-foreground)] mt-0.5">
                      {isSelected ? "На витрине" : "Добавить"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-4">
          {(["all", "avatar", "frame", "background", "card"] as const).map(t => {
            const config = t === "all" ? null : TYPE_CONFIG[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  typeFilter === t
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--secondary)]/60 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                }`}
              >
                {t === "all"
                  ? "Все"
                  : config && (
                      <span className="flex items-center gap-1.5">
                        <config.icon className="w-3.5 h-3.5" />
                        {config.label}
                      </span>
                    )}
              </button>
            );
          })}
        </div>

        {filteredDecorations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-3 text-center rounded-lg bg-gradient-to-b from-[var(--secondary)]/30 to-transparent border border-[var(--border)]/50">
            <div className="relative mb-3">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30 shadow-md">
                <Package className="h-7 w-7 text-purple-500" />
              </div>
              {displayList.length === 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--chart-2)] flex items-center justify-center shadow">
                  <ShoppingBag className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1.5">
              {isError
                ? "Ошибка загрузки"
                : displayList.length === 0
                  ? "Инвентарь пуст"
                  : "Категория пуста"}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-xs mb-3">
              {isError
                ? "Не удалось загрузить. Проверьте подключение."
                : displayList.length === 0
                  ? "Рамки, аватары и фоны — в магазине."
                  : "В этой категории пусто. Загляните в магазин."}
            </p>
            {isError ? (
              <button
                type="button"
                onClick={() => refetchDecorations()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:opacity-90 transition-opacity shadow-sm"
              >
                Повторить
              </button>
            ) : (
              <Link
                href="/tomilo-shop"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium hover:opacity-90 transition-opacity shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                В магазин
              </Link>
            )}
            {displayList.length === 0 && !isError && (
              <div className="mt-4 flex items-center gap-2 opacity-40">
                <div className="w-9 h-9 rounded-md bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center">
                  <User className="w-4 h-4 text-[var(--muted-foreground)]" />
                </div>
                <div className="w-9 h-9 rounded-md bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center">
                  <Layers className="w-4 h-4 text-[var(--muted-foreground)]" />
                </div>
                <div className="w-14 h-9 rounded-md bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
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
                  compactGrid
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
