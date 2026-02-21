"use client";

import { useState, useMemo } from "react";
import { Package, ImageIcon, User, Layers } from "lucide-react";
import Link from "next/link";
import {
  useGetUserProfileDecorationsQuery,
  useGetDecorationsQuery,
  useEquipDecorationMutation,
  useUnequipDecorationMutation,
} from "@/store/api/shopApi";
import { useGetProfileQuery } from "@/store/api/authApi";
import { DecorationCard } from "@/shared/shop/DecorationCard";
import { getDecorationImageUrl, type Decoration } from "@/api/shop";
import type { UserProfile } from "@/types/user";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

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
  const found = list.find((d) => {
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
  const { data: userDecorations = [], isLoading: isLoadingUserDecorations, isError, refetch: refetchDecorations } = useGetUserProfileDecorationsQuery();
  const { data: profileData, refetch: refetchProfile } = useGetProfileQuery();
  const ownedFromProfile = (profileData?.success && profileData.data
    ? (profileData.data as UserProfile).ownedDecorations
    : []) ?? [];
  const needCatalogFallback = userDecorations.length === 0 && ownedFromProfile.length > 0;
  const { data: catalogDecorations = [], isLoading: isLoadingCatalog } = useGetDecorationsQuery(undefined, { skip: !needCatalogFallback });
  const isLoading = isLoadingUserDecorations || (needCatalogFallback && isLoadingCatalog);
  const profile = profileData?.success ? profileData.data : null;
  const profileWithDecorations = profile as (typeof profile) & UserProfile | null;
  /** Надетые декорации: из ответа профиля (camelCase/snake_case) или из Auth (уже нормализовано). */
  const equippedRaw = (profileWithDecorations?.equippedDecorations ??
    (profileWithDecorations as Record<string, unknown>)?.equipped_decorations ??
    user?.equippedDecorations) as UserProfile["equippedDecorations"] | undefined;
  const [equipDecoration] = useEquipDecorationMutation();
  const [unequipDecoration] = useUnequipDecorationMutation();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"avatar" | "frame" | "background" | "card" | "all">("all");

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
    let equipped: string[] = userDecorations.filter((d: Decoration) => d.isEquipped).map((d: Decoration) => String(d.id));

    if (owned.length === 0 && (profileWithDecorations?.ownedDecorations?.length ?? 0) > 0) {
      owned = (profileWithDecorations!.ownedDecorations ?? []).map((e) => e.decorationId);
    }
    if (equipped.length === 0 && equippedRaw) {
      const raw = equippedRaw as Record<string, unknown>;
      const types = ["avatar", "frame", "background", "card"] as const;
      equipped = types
        .map((type) => {
          const val = raw[type] ?? raw[`${type}_id`];
          return resolveEquippedToId(val, resolutionList) || getEquippedId(val);
        })
        .filter(Boolean);
    }
    return { effectiveOwned: owned, effectiveEquipped: equipped };
  }, [userDecorations, profileWithDecorations, equippedRaw, resolutionList]);

  /** Список приобретённых: из GET /shop/profile/decorations или fallback из profile.ownedDecorations + каталог. */
  const displayList = useMemo((): Decoration[] => {
    if (userDecorations.length > 0) return userDecorations;
    if (ownedFromProfile.length === 0 || catalogDecorations.length === 0) return [];
    const catalogById = new Map(catalogDecorations.map(d => [d.id, d]));
    return ownedFromProfile
      .map(entry => {
        const dec = catalogById.get(entry.decorationId);
        if (!dec) return null;
        const type = entry.decorationType as Decoration["type"];
        return { ...dec, type };
      })
      .filter((d): d is Decoration => d != null);
  }, [userDecorations, ownedFromProfile, catalogDecorations]);

  /** В инвентаре показываем только приобретённые декорации. */
  const filteredDecorations = useMemo(() => {
    if (typeFilter === "all") return displayList;
    return displayList.filter((d: Decoration) => d.type === typeFilter);
  }, [displayList, typeFilter]);

  const handleEquip = async (type: "avatar" | "frame" | "background" | "card", decorationId: string) => {
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
    } catch {
      toast.error("Не удалось снять предмет");
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
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Инвентарь
              </h2>
              <p className="text-[var(--muted-foreground)] text-sm">
                Декорации профиля
              </p>
            </div>
          </div>
          <Link
            href="/tomilo-shop"
            className="text-sm font-medium text-[var(--primary)] hover:underline shrink-0"
          >
            Магазин →
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "avatar", "frame", "background", "card"] as const).map((t) => {
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
                {t === "all" ? "Все" : config && <span className="flex items-center gap-2"><config.icon className="w-4 h-4" />{config.label}</span>}
              </button>
            );
          })}
        </div>

        {filteredDecorations.length === 0 ? (
          <div className="text-center py-14 text-[var(--muted-foreground)] rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]/50">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">
              {isError ? "Не удалось загрузить инвентарь" : displayList.length === 0 ? "Пока ничего нет" : "В этой категории пока ничего нет"}
            </p>
            <p className="text-sm mt-1">
              {isError ? "Проверьте подключение и попробуйте снова" : displayList.length === 0 ? "Купите декорации в магазине" : "Выберите другую категорию или купите декорации в магазине"}
            </p>
            {isError && (
              <button
                type="button"
                onClick={() => refetchDecorations()}
                className="mt-4 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Повторить
              </button>
            )}
            {!isError && (
              <Link
                href="/tomilo-shop"
                className="inline-block mt-4 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
              >
                В магазин
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDecorations.map((decoration: Decoration) => (
              <DecorationCard
                key={decoration.id}
                decoration={decoration}
                isOwned={effectiveOwned.includes(decoration.id)}
                isEquipped={effectiveEquipped.includes(decoration.id)}
                onEquip={() => handleEquip(decoration.type, decoration.id)}
                onUnequip={
                  effectiveEquipped.includes(decoration.id) ? () => handleUnequip(decoration.type) : undefined
                }
                isLoading={actionLoading === decoration.id || actionLoading === `unequip-${decoration.type}`}
                hidePurchase
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
