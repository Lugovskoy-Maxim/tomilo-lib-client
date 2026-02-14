"use client";

import { useState, useMemo } from "react";
import { Package, ImageIcon, User, Layers } from "lucide-react";
import Link from "next/link";
import {
  useGetUserProfileDecorationsQuery,
  useEquipDecorationMutation,
  useUnequipDecorationMutation,
} from "@/store/api/shopApi";
import { useGetProfileQuery } from "@/store/api/authApi";
import { DecorationCard } from "@/shared/shop/DecorationCard";
import type { Decoration } from "@/api/shop";
import { useToast } from "@/hooks/useToast";

const TYPE_CONFIG: Record<
  "avatar" | "background" | "card",
  { label: string; icon: React.ElementType }
> = {
  avatar: { label: "Аватар", icon: User },
  background: { label: "Фон профиля", icon: ImageIcon },
  card: { label: "Карточка", icon: Layers },
};

export default function ProfileInventory() {
  const toast = useToast();
  const { data: userDecorations = [], isLoading } = useGetUserProfileDecorationsQuery();
  const { refetch: refetchProfile } = useGetProfileQuery();
  const [equipDecoration] = useEquipDecorationMutation();
  const [unequipDecoration] = useUnequipDecorationMutation();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"avatar" | "background" | "card" | "all">("all");

  const equippedByType = useMemo(() => {
    const equipped: Record<string, string> = { avatar: "", background: "", card: "" };
    userDecorations.forEach((d: Decoration) => {
      if (d.isEquipped) equipped[d.type] = d.id;
    });
    return equipped;
  }, [userDecorations]);

  const filteredDecorations = useMemo(() => {
    if (typeFilter === "all") return userDecorations;
    return userDecorations.filter((d: Decoration) => d.type === typeFilter);
  }, [userDecorations, typeFilter]);

  const handleEquip = async (type: "avatar" | "background" | "card", decorationId: string) => {
    setActionLoading(decorationId);
    try {
      await equipDecoration({ type, decorationId }).unwrap();
      toast.success("Предмет надет");
      refetchProfile();
    } catch {
      toast.error("Не удалось надеть предмет");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnequip = async (type: "avatar" | "background" | "card") => {
    setActionLoading(`unequip-${type}`);
    try {
      await unequipDecoration({ type }).unwrap();
      toast.success("Предмет снят");
      refetchProfile();
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
            href="/shop"
            className="text-sm font-medium text-[var(--primary)] hover:underline shrink-0"
          >
            Магазин →
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "avatar", "background", "card"] as const).map((t) => {
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
            <p className="font-medium">Пока ничего нет</p>
            <p className="text-sm mt-1">Купите декорации в магазине</p>
            <Link
              href="/shop"
              className="inline-block mt-4 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
            >
              В магазин
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDecorations.map((decoration: Decoration) => (
              <DecorationCard
                key={decoration.id}
                decoration={decoration}
                isOwned={true}
                isEquipped={decoration.isEquipped ?? equippedByType[decoration.type] === decoration.id}
                onEquip={() => handleEquip(decoration.type, decoration.id)}
                onUnequip={
                  equippedByType[decoration.type] === decoration.id
                    ? () => handleUnequip(decoration.type)
                    : undefined
                }
                isLoading={actionLoading === decoration.id || actionLoading === `unequip-${decoration.type}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
