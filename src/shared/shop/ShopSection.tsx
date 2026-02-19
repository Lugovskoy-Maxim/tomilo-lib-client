"use client";

import { useState, useEffect, useCallback } from "react";
import { Decoration } from "@/api/shop";
import {
  getDecorationsByType,
  getUserDecorations,
  purchaseDecoration,
  equipDecoration,
  unequipDecoration,
} from "@/api/shop";
import { DecorationCard } from "./DecorationCard";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, PackageOpen } from "lucide-react";

interface ShopSectionProps {
  type: "avatar" | "background" | "card";
}

interface UserDecorations {
  owned: string[];
  equipped: string[];
}

function ShopSectionSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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

export function ShopSection({ type }: ShopSectionProps) {
  const { isAuthenticated } = useAuth();
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [userDecorations, setUserDecorations] = useState<UserDecorations>({
    owned: [],
    equipped: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDecorations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDecorationsByType(type);
      if (response.success && response.data) {
        setDecorations(response.data);
      } else {
        setError(response.message || "Ошибка при загрузке товаров");
      }
    } catch {
      setError("Ошибка при загрузке товаров");
    } finally {
      setLoading(false);
    }
  }, [type]);

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
    loadDecorations();
  }, [loadDecorations]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserDecorations();
    } else {
      setUserDecorations({ owned: [], equipped: [] });
    }
  }, [isAuthenticated, loadUserDecorations]);

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
    background: "Фоны",
    card: "Карточки",
  };
  const typeDescriptions: Record<typeof type, string> = {
    avatar: "Украсьте профиль стильными аватарами",
    background: "Выберите фон для своего профиля",
    card: "Собирайте карточки для своей колоды",
  };

  if (loading) {
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-6 h-6 text-[var(--destructive)]" />
          </div>
          <p className="text-[var(--foreground)] font-medium mb-2">{error}</p>
          <button
            onClick={loadDecorations}
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
        </div>
      </div>
    );
  }

  return (
    <div id="shop-section" role="tabpanel" aria-labelledby={`shop-tab-${type}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-1">
          {typeTitles[type]}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">{typeDescriptions[type]}</p>
      </div>

      <div
        className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 ${
          type === "avatar" || type === "card" ? "justify-items-center" : ""
        }`}
      >
        {decorations.map(decoration => (
          <DecorationCard
            key={decoration.id}
            decoration={decoration}
            isOwned={userDecorations.owned.includes(decoration.id)}
            isEquipped={userDecorations.equipped.includes(decoration.id)}
            onPurchase={handlePurchase}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
            isLoading={actionLoading === decoration.id}
            sectionType={type}
          />
        ))}
      </div>

      {!isAuthenticated && (
        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/50 p-4 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Войдите в аккаунт, чтобы покупать и использовать украшения
          </p>
        </div>
      )}
    </div>
  );
}
