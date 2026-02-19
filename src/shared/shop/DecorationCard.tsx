"use client";

import { useState, useMemo } from "react";
import { ShoppingBag, Check, Sparkles, ImageIcon, Coins, PackageX } from "lucide-react";
import Image from "next/image";
import {
  Decoration,
  DecorationRarity,
  getDecorationImageUrl,
} from "@/api/shop";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export interface DecorationCardProps {
  decoration: Decoration;
  isOwned?: boolean;
  isEquipped?: boolean;
  onPurchase?: (id: string) => void;
  onEquip?: (id: string) => void;
  onUnequip?: () => void;
  isLoading?: boolean;
  /** В инвентаре: не показывать цену и кнопку «Купить». */
  hidePurchase?: boolean;
}

const RARITY_STYLES: Record<
  DecorationRarity,
  {
    border: string;
    badge: string;
    label: string;
  }
> = {
  common: {
    border: "border-slate-400/40 shadow-[0_0_0_1px_rgba(100,116,139,0.2)]",
    badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/80 dark:text-slate-200 dark:border-slate-600",
    label: "Обычная",
  },
  rare: {
    border: "border-blue-400/50 shadow-[0_0_0_1px_rgba(59,130,246,0.25),0_0_12px_rgba(59,130,246,0.15)]",
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-700",
    label: "Редкая",
  },
  epic: {
    border: "border-violet-400/50 shadow-[0_0_0_1px_rgba(139,92,246,0.3),0_0_16px_rgba(139,92,246,0.2)]",
    badge: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/60 dark:text-violet-200 dark:border-violet-700",
    label: "Эпическая",
  },
  legendary: {
    border: "border-amber-400/60 shadow-[0_0_0_1px_rgba(245,158,11,0.35),0_0_20px_rgba(245,158,11,0.25)]",
    badge: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-600",
    label: "Легендарная",
  },
};

export function DecorationCard({
  decoration,
  isOwned = false,
  isEquipped = false,
  onPurchase,
  onEquip,
  onUnequip,
  isLoading = false,
  hidePurchase = false,
}: DecorationCardProps) {
  const { isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const [isImageLoading, setIsImageLoading] = useState(true);
  const imageSrc = useMemo(
    () => getDecorationImageUrl(decoration.imageUrl ?? ""),
    [decoration.imageUrl],
  );
  const hasImage = Boolean(imageSrc);
  const rarity: DecorationRarity = decoration.rarity ?? "common";
  const rarityStyle = RARITY_STYLES[rarity];
  const soldOut = decoration.isSoldOut ?? (decoration.stock !== undefined && decoration.stock <= 0);
  const showStock = decoration.stock !== undefined;

  const handlePurchase = async () => {
    if (soldOut) {
      showError("Распродано");
      return;
    }
    if (!isAuthenticated) {
      showError("Войдите в аккаунт для покупки");
      return;
    }
    try {
      await onPurchase?.(decoration.id);
      success(`"${decoration.name}" куплено!`);
    } catch {
      showError("Ошибка при покупке");
    }
  };

  const handleEquip = async () => {
    if (!isAuthenticated) {
      showError("Войдите в аккаунт для экипировки");
      return;
    }
    try {
      await onEquip?.(decoration.id);
      success(`"${decoration.name}" надето!`);
    } catch {
      showError("Ошибка при экипировке");
    }
  };

  const handleUnequip = async () => {
    if (!isAuthenticated) return;
    try {
      await onUnequip?.();
      success(`"${decoration.name}" снято!`);
    } catch {
      showError("Ошибка при снятии");
    }
  };

  const renderAction = () => {
    if (hidePurchase && !isOwned) return null;
    if (!isAuthenticated) {
      return (
        <p className="text-xs text-[var(--muted-foreground)] py-2">
          Войдите для покупки
        </p>
      );
    }
    if (!isOwned) {
      if (soldOut) {
        return (
          <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)] font-medium text-sm">
            <PackageX className="w-4 h-4 shrink-0" />
            Распродано
          </div>
        );
      }
      return (
        <button
          type="button"
          onClick={handlePurchase}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 shrink-0" />
              Купить
            </>
          )}
        </button>
      );
    }
    if (isEquipped) {
      return (
        <button
          type="button"
          onClick={handleUnequip}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] font-medium text-sm hover:bg-[var(--muted)] disabled:opacity-50 transition-colors active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4 shrink-0" />
              Снять
            </>
          )}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={handleEquip}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Sparkles className="w-4 h-4 shrink-0" />
            Надеть
          </>
        )}
      </button>
    );
  };

  const isAvatar = decoration.type === "avatar";

  /* Компактная карточка только для аватаров: круг + бейдж как есть, остальное — новая вёрстка */
  if (isAvatar) {
    return (
      <article
        className={`group/card relative w-full max-w-[200px] aspect-square rounded-xl border bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 card-hover-soft flex flex-col min-w-0 ${rarityStyle.border}`}
      >
        {/* Картинка сверху */}
        <div className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-3">
          <div className="relative w-full max-w-[68%] sm:max-w-[72%] aspect-square">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--chart-1)] to-[var(--chart-2)] opacity-75 group-hover/card:opacity-100 blur-sm transition-all duration-500" />
            <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-[var(--background)] shadow-lg glow-avatar">
              {isImageLoading && hasImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--muted)]">
                  <span className="w-5 h-5 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                </div>
              )}
              {hasImage ? (
                <Image
                  src={imageSrc}
                  alt={decoration.name}
                  fill
                  unoptimized
                  className={`object-cover ${isImageLoading ? "opacity-0" : "opacity-100"}`}
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)]">
                  <ImageIcon className="w-8 h-8 text-white/80" />
                </div>
              )}
            </div>
            <span
              className={`absolute -top-0.5 -right-0.5 inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold border ${rarityStyle.badge}`}
            >
              {rarityStyle.label}
            </span>
            {isEquipped && (
              <span className="absolute -bottom-0.5 -left-0.5 inline-flex items-center rounded bg-emerald-500/90 text-white text-[9px] font-semibold px-1 py-0.5">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
            {soldOut && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 inline-flex items-center gap-0.5 rounded bg-rose-500/95 text-white text-[9px] font-semibold px-1.5 py-0.5 whitespace-nowrap">
                <PackageX className="w-2.5 h-2.5" />
                Распродано
              </span>
            )}
          </div>
        </div>

        {/* Название и действие снизу */}
        <div className="flex-shrink-0 p-2 sm:p-2.5 pt-0 flex flex-col gap-1 sm:gap-1.5">
          <h3 className="font-semibold text-[var(--foreground)] text-xs sm:text-sm leading-tight truncate text-center" title={decoration.name}>
            {decoration.name}
          </h3>
          {showStock && (
            <p className="text-[10px] sm:text-[11px] text-[var(--muted-foreground)] text-center">
              {decoration.stock! <= 0 ? "Нет в наличии" : decoration.stock! <= 3 ? "Осталось мало" : `Осталось: ${decoration.stock}`}
            </p>
          )}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            {!hidePurchase && !isOwned && (
              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 rounded-md bg-[var(--secondary)] border border-[var(--border)] text-[10px] sm:text-xs font-medium text-[var(--foreground)]">
                <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500" />
                {decoration.price}
              </span>
            )}
            {hidePurchase && !isOwned ? null : !isAuthenticated ? (
              <span className="text-[10px] sm:text-[11px] text-[var(--muted-foreground)]">Войдите для покупки</span>
            ) : !isOwned && soldOut ? (
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] text-[10px] sm:text-xs font-medium">
                <PackageX className="w-3.5 h-3.5" />
                Распродано
              </span>
            ) : !isOwned ? (
              <button
                type="button"
                onClick={handlePurchase}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] sm:text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Купить
                  </>
                )}
              </button>
            ) : isEquipped ? (
              <button
                type="button"
                onClick={handleUnequip}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] text-[10px] sm:text-xs font-medium hover:bg-[var(--muted)] disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Снять
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEquip}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] sm:text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Надеть
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  const renderImageBlock = (aspectClass: string) => (
    <div
      className={`relative overflow-hidden border-b border-[var(--border)] ${rarityStyle.border} bg-[var(--muted)] ${aspectClass}`}
    >
      {isImageLoading && hasImage && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--muted)]">
          <span className="w-8 h-8 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      )}
      {hasImage ? (
        <Image
          src={imageSrc}
          alt={decoration.name}
          fill
          unoptimized
          className={`object-cover transition-transform duration-300 group-hover/card:scale-105 ${
            isImageLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsImageLoading(false)}
          onError={() => setIsImageLoading(false)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-[var(--muted-foreground)]" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-2 left-2 right-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${rarityStyle.badge}`}
        >
          {rarityStyle.label}
        </span>
        {isEquipped && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/90 text-white text-[10px] font-semibold">
            <Sparkles className="w-3 h-3 fill-current" />
            Надето
          </span>
        )}
        {soldOut && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/90 text-white text-[10px] font-semibold">
            <PackageX className="w-3 h-3" />
            Распродано
          </span>
        )}
      </div>
    </div>
  );

  const renderContentBlock = () => (
    <div className="p-2.5 sm:p-3 flex flex-col gap-2">
      <div className="min-w-0">
        <h3 className="font-semibold text-[var(--foreground)] text-xs sm:text-sm leading-tight line-clamp-1" title={decoration.name}>
          {decoration.name}
        </h3>
        {decoration.description && (
          <p className="text-[11px] sm:text-xs text-[var(--muted-foreground)] line-clamp-1" title={decoration.description}>
            {decoration.description}
          </p>
        )}
        {showStock && (
          <p className="text-[11px] text-[var(--muted-foreground)]">
            {decoration.stock! <= 0 ? "Нет в наличии" : decoration.stock! <= 3 ? "Осталось мало" : `Осталось: ${decoration.stock}`}
          </p>
        )}
      </div>
      {!hidePurchase && !isOwned && isAuthenticated && soldOut ? (
        <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)] font-medium text-sm">
          <PackageX className="w-4 h-4 shrink-0" />
          Распродано
        </div>
      ) : !hidePurchase && !isOwned && isAuthenticated ? (
        <div className="flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)] shrink-0">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            {decoration.price}
          </span>
          <button
            type="button"
            onClick={handlePurchase}
            disabled={isLoading}
            className="flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 shrink-0" />
                Купить
              </>
            )}
          </button>
        </div>
      ) : !hidePurchase && !isOwned && !isAuthenticated ? (
        <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Войдите для покупки</p>
      ) : (
        renderAction()
      )}
    </div>
  );

  /* Карточка для фонов: широкий формат 16:9 */
  if (decoration.type === "background") {
    return (
      <article className="group/card relative w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--primary)]/20 transition-all duration-300 card-hover-soft">
        {renderImageBlock("relative aspect-video")}
        {renderContentBlock()}
      </article>
    );
  }

  /* Карточка для декора «карточка»: вертикальный формат 9:16 */
  return (
    <article className="group/card relative w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--primary)]/20 transition-all duration-300 card-hover-soft">
      {renderImageBlock("relative aspect-[9/16]")}
      {renderContentBlock()}
    </article>
  );
}
