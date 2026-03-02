"use client";

import { useState, useMemo } from "react";
import { ShoppingBag, Check, Sparkles, ImageIcon, Coins, PackageX, X, Gift } from "lucide-react";
import Image from "next/image";
import {
  Decoration,
  DecorationRarity,
  getDecorationImageUrls,
  getEquippedFrameUrl,
  normalizeRarity,
} from "@/api/shop";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { getImageUrls } from "@/lib/asset-url";
import type { EquippedDecorations } from "@/types/user";
import ProfileHeaderPreview from "@/shared/profile/ProfileHeaderPreview";

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
  /** Тип секции (вкладка магазина). Если задан, вид карточки берётся по нему, а не по decoration.type. */
  sectionType?: "avatar" | "frame" | "background" | "card";
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

const DEFAULT_AVATAR = "/logo/ring_logo.png";

interface DecorationPreviewModalProps {
  decoration: Decoration;
  imageSrc: string;
  rarityStyle: typeof RARITY_STYLES[DecorationRarity];
  isOwned: boolean;
  isEquipped: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  soldOut: boolean;
  showStock: boolean;
  hidePurchase: boolean;
  userAvatar: string | null;
  userFrameUrl: string | null;
  username: string;
  userLevel: number;
  onClose: () => void;
  onPurchase: () => void;
  onEquip: () => void;
  onUnequip: () => void;
  displayType: "avatar" | "frame" | "background" | "card";
}

function DecorationPreviewModal({
  decoration,
  imageSrc,
  rarityStyle,
  isOwned,
  isEquipped,
  isLoading,
  isAuthenticated,
  soldOut,
  showStock,
  hidePurchase,
  userAvatar,
  userFrameUrl,
  username,
  userLevel,
  onClose,
  onPurchase,
  onEquip,
  onUnequip,
  displayType,
}: DecorationPreviewModalProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const isGif = imageSrc?.toLowerCase().includes(".gif");
  const discountedPrice = decoration.subscriptionPrice ?? Math.floor(decoration.price * 0.9);
  const hasDiscount = discountedPrice < decoration.price;

  const resolvedUserAvatar = useMemo(() => {
    if (!userAvatar) return DEFAULT_AVATAR;
    const { primary } = getImageUrls(userAvatar);
    return primary || DEFAULT_AVATAR;
  }, [userAvatar]);

  const renderPreviewProfile = () => {
    const showDecorationOnAvatar = displayType === "avatar" || displayType === "frame";

    const Avatar = ({ size }: { size: number }) => (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <div
          className="relative overflow-hidden border-2 border-[var(--background)] shadow-lg rounded-full"
          style={{ width: size, height: size }}
        >
          <Image
            src={showDecorationOnAvatar && displayType === "avatar" ? imageSrc : resolvedUserAvatar}
            alt={username}
            fill
            unoptimized
            className="object-cover rounded-full"
          />
        </div>
        {displayType === "frame" && (
          <img
            src={imageSrc}
            alt=""
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none object-contain z-10"
            style={{
              width: size * 1.8,
              height: size * 1.8,
              maxWidth: "none",
              maxHeight: "none",
            }}
            aria-hidden
          />
        )}
      </div>
    );

    if (displayType === "card") {
      const rows = [
        { rank: 1, name: username, level: Math.max(1, userLevel), isYou: true },
        { rank: 2, name: "Aiko", level: Math.max(1, userLevel + 1), isYou: false },
        { rank: 3, name: "Rin", level: Math.max(1, userLevel - 1), isYou: false },
      ];

      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm text-[var(--foreground)]">Таблица лидеров</div>
            <div className="text-xs text-[var(--muted-foreground)]">Уровень</div>
          </div>

          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.rank}
                className={`relative overflow-hidden rounded-xl border-2 bg-[var(--card)] ${
                  r.isYou ? "border-[var(--primary)]/40" : "border-[var(--border)]"
                }`}
              >
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage: `url(${imageSrc})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/80 to-transparent" />

                <div className="relative z-10 flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)]">
                    #{r.rank}
                  </div>

                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--muted)] shrink-0">
                    <Image src={resolvedUserAvatar} alt={r.name} fill unoptimized className="object-cover rounded-full" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--foreground)] truncate">{r.name}</span>
                      {r.isYou && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/25 font-semibold">
                          Вы
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">Уровень {r.level}</div>
                  </div>

                  <div className="shrink-0 px-3 py-2 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)]">
                    Уровень {r.level}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (displayType === "background") {
      return (
        <div className="flex flex-col gap-3">
          <div className="font-semibold text-sm text-[var(--foreground)]">Профиль пользователя</div>

          <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card)]">
            <ProfileHeaderPreview
              compact
              username={username}
              level={userLevel}
              avatarUrl={showDecorationOnAvatar && displayType === "avatar" ? imageSrc : resolvedUserAvatar}
              frameUrl={userFrameUrl}
              backgroundUrl={imageSrc}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar size={56} />

          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-[var(--foreground)] truncate">{username}</span>
            <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold">
                {userLevel}
              </span>
              <span>Уровень</span>
            </span>
          </div>
        </div>

        <div className="mt-2 p-3 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="relative overflow-hidden border border-[var(--border)] shadow rounded-full shrink-0" style={{ width: 32, height: 32 }}>
              <Image
                src={showDecorationOnAvatar && displayType === "avatar" ? imageSrc : resolvedUserAvatar}
                alt={username}
                fill
                unoptimized
                className="object-cover rounded-full"
              />
            </div>
            {displayType === "frame" && (
              <img
                src={imageSrc}
                alt=""
                className="absolute left-4 top-3 pointer-events-none object-contain z-10"
                style={{
                  width: 32 * 1.8,
                  height: 32 * 1.8,
                  maxWidth: "none",
                  maxHeight: "none",
                  transform: "translate(-50%, -50%) translate(16px, 16px)",
                }}
                aria-hidden
              />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-[var(--foreground)] truncate block">{username}</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">У меня новое украшение!</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl mx-auto bg-[var(--background)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden mt-4 sm:mt-0 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background)]">
          <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)] truncate">
            Купить украшение
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col items-center md:items-start gap-4">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--chart-1)] to-[var(--chart-2)] opacity-75 blur-sm" />
                <div
                  className="relative w-40 h-40 sm:w-48 sm:h-48 overflow-hidden border-4 border-[var(--background)] shadow-xl rounded-full bg-[var(--muted)]"
                >
                  {isImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--muted)]">
                      <span className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                    </div>
                  )}
                  <Image
                    src={imageSrc}
                    alt={decoration.name}
                    fill
                    unoptimized
                    className={`object-cover rounded-full ${isImageLoading ? "opacity-0" : "opacity-100"}`}
                    onLoad={() => setIsImageLoading(false)}
                  />
                </div>
                <span
                  className={`absolute -top-1 -right-1 inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${rarityStyle.badge}`}
                >
                  {rarityStyle.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                {isGif && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)]">
                    GIF-Аватар
                  </span>
                )}
                {decoration.bonus && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 text-xs font-medium text-amber-700 dark:text-amber-300">
                    + <Coins className="w-3 h-3" /> {decoration.bonus}
                  </span>
                )}
              </div>

              <div className="text-center md:text-left mt-2">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{decoration.name}</h3>
                {decoration.description && (
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">{decoration.description}</p>
                )}
              </div>

              {!isOwned && !hidePurchase && (
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-500" />
                    <span className="text-xl font-bold text-[var(--foreground)]">{decoration.price}</span>
                  </div>
                  {hasDiscount && (
                    <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
                      <Coins className="w-3.5 h-3.5 text-amber-500/60" />
                      <span>{discountedPrice} с подпиской.</span>
                      <button
                        type="button"
                        className="text-[var(--primary)] hover:underline text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Подписаться
                      </button>
                    </div>
                  )}
                </div>
              )}

              {showStock && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {decoration.stock! <= 0
                    ? "Нет в наличии"
                    : decoration.stock! <= 3
                      ? "Осталось мало"
                      : `Осталось: ${decoration.stock}`}
                </p>
              )}

              <div className="flex items-center gap-2 mt-4 w-full md:w-auto">
                {!isAuthenticated ? (
                  <p className="text-sm text-[var(--muted-foreground)]">Войдите для покупки</p>
                ) : isOwned ? (
                  isEquipped ? (
                    <button
                      type="button"
                      onClick={onUnequip}
                      disabled={isLoading}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] font-medium text-sm hover:bg-[var(--muted)] disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? (
                        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Снять
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onEquip}
                      disabled={isLoading}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {isLoading ? (
                        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Надеть
                        </>
                      )}
                    </button>
                  )
                ) : soldOut ? (
                  <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)] font-medium text-sm">
                    <PackageX className="w-4 h-4" />
                    Распродано
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onPurchase}
                      disabled={isLoading}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {isLoading ? (
                        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          Купить
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="p-3 rounded-xl bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                      title="Подарить"
                    >
                      <Gift className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="text-sm font-medium text-[var(--muted-foreground)] mb-3">Предпросмотр</div>
              <div className="flex-1 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                {renderPreviewProfile()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DecorationCard({
  decoration,
  isOwned = false,
  isEquipped = false,
  onPurchase,
  onEquip,
  onUnequip,
  isLoading = false,
  hidePurchase = false,
  sectionType,
}: DecorationCardProps) {
  const { isAuthenticated, user } = useAuth();
  const displayType = sectionType ?? decoration.type;
  const { success, error: showError } = useToast();
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [useFallbackImage, setUseFallbackImage] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { primary: imageSrcPrimary, fallback: imageSrcFallback } = useMemo(
    () => getDecorationImageUrls(decoration.imageUrl ?? ""),
    [decoration.imageUrl],
  );
  const imageSrc = useFallbackImage && imageSrcFallback !== imageSrcPrimary ? imageSrcFallback : imageSrcPrimary;
  const hasImage = Boolean(imageSrc);

  const handleImageError = () => {
    if (!useFallbackImage && imageSrcFallback && imageSrcFallback !== imageSrcPrimary) {
      setUseFallbackImage(true);
      setIsImageLoading(true);
    } else {
      setIsImageLoading(false);
    }
  };
  const rarity: DecorationRarity = normalizeRarity(decoration.rarity);
  const rarityStyle = RARITY_STYLES[rarity];
  const soldOut = decoration.isSoldOut ?? (decoration.stock !== undefined && decoration.stock <= 0);
  const showStock = decoration.stock !== undefined;
  const userFrameUrl = getEquippedFrameUrl((user?.equippedDecorations ?? null) as EquippedDecorations | null);

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

  const compactBtn = "inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium";
  const compactBtnMedium = "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium";
  const renderAction = (compact = false, size: "small" | "medium" = "small") => {
    if (hidePurchase && !isOwned) return null;
    if (!isAuthenticated) {
      return (
        <p className="text-xs text-[var(--muted-foreground)] py-2">
          Войдите для покупки
        </p>
      );
    }
    const btnClass = compact ? (size === "medium" ? compactBtnMedium : compactBtn) : "";
    const iconSize = size === "medium" ? "w-4 h-4" : "w-3.5 h-3.5";
    if (!isOwned) {
      if (soldOut) {
        return compact ? (
          <span className={`${btnClass} bg-[var(--muted)] text-[var(--muted-foreground)]`}>
            <PackageX className={iconSize} />
            Распродано
          </span>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)] font-medium text-sm">
            <PackageX className="w-4 h-4 shrink-0" />
            Распродано
          </div>
        );
      }
      return (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handlePurchase(); }}
          disabled={isLoading}
          className={compact ? `${btnClass} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity` : "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-[0.98]"}
        >
          {isLoading ? (
            <span className={`${compact ? (size === "medium" ? "w-4 h-4" : "w-3.5 h-3.5") : "w-5 h-5"} border-2 border-current border-t-transparent rounded-full animate-spin`} />
          ) : (
            <>
              <ShoppingBag className={compact ? iconSize : "w-4 h-4 shrink-0"} />
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
          onClick={(e) => { e.stopPropagation(); handleUnequip(); }}
          disabled={isLoading}
          className={compact ? `${btnClass} bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-50 transition-colors` : "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] font-medium text-sm hover:bg-[var(--muted)] disabled:opacity-50 transition-colors active:scale-[0.98]"}
        >
          {isLoading ? (
            <span className={`${compact ? (size === "medium" ? "w-4 h-4" : "w-3.5 h-3.5") : "w-5 h-5"} border-2 border-current border-t-transparent rounded-full animate-spin`} />
          ) : (
            <>
              <Check className={compact ? iconSize : "w-4 h-4 shrink-0"} />
              Снять
            </>
          )}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handleEquip(); }}
        disabled={isLoading}
        className={compact ? `${btnClass} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity` : "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-[0.98]"}
      >
        {isLoading ? (
          <span className={`${compact ? (size === "medium" ? "w-4 h-4" : "w-3.5 h-3.5") : "w-5 h-5"} border-2 border-current border-t-transparent rounded-full animate-spin`} />
        ) : (
          <>
            <Sparkles className={compact ? iconSize : "w-4 h-4 shrink-0"} />
            Надеть
          </>
        )}
      </button>
    );
  };

  const isAvatar = displayType === "avatar";
  const isFrame = displayType === "frame";

  const handleCardClick = () => {
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };

  const previewModal = isPreviewOpen && imageSrc ? (
    <DecorationPreviewModal
      decoration={decoration}
      imageSrc={imageSrc}
      rarityStyle={rarityStyle}
      isOwned={isOwned}
      isEquipped={isEquipped}
      isLoading={isLoading}
      isAuthenticated={isAuthenticated}
      soldOut={soldOut}
      showStock={showStock}
      hidePurchase={hidePurchase}
      userAvatar={user?.avatar ?? null}
      userFrameUrl={userFrameUrl}
      username={user?.username ?? "Пользователь"}
      userLevel={user?.level ?? 1}
      onClose={handleClosePreview}
      onPurchase={handlePurchase}
      onEquip={handleEquip}
      onUnequip={handleUnequip}
      displayType={displayType}
    />
  ) : null;

  /* Карточка для аватаров и рамок: круг + инфо (увеличенный размер для читаемости) */
  if (isAvatar || isFrame) {
    return (
      <>
        {previewModal}
        <article
          onClick={handleCardClick}
          className={`group/card relative w-full max-w-[200px] sm:max-w-[220px] lg:max-w-[240px] min-w-0 aspect-[3/4] rounded-xl sm:rounded-2xl border-2 bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 card-hover-soft flex flex-col min-w-0 cursor-pointer ${rarityStyle.border}`}
        >
        {/* Картинка сверху */}
        <div className="flex-1 min-h-0 flex items-center justify-center p-2.5 sm:p-3">
          <div className="relative w-full max-w-[80%] sm:max-w-[85%] aspect-square">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--chart-1)] to-[var(--chart-2)] opacity-75 group-hover/card:opacity-100 blur-sm transition-all duration-500" />
            <div
              className="relative w-full h-full overflow-hidden border-2 border-[var(--background)] shadow-lg glow-avatar"
              style={{ borderRadius: "50%" }}
            >
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
                  className={`object-cover rounded-full ${isImageLoading ? "opacity-0" : "opacity-100"}`}
                  style={{ borderRadius: "50%" }}
                  onLoad={() => setIsImageLoading(false)}
                  onError={handleImageError}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)]">
                  <ImageIcon className="w-8 h-8 text-white/80" />
                </div>
              )}
            </div>
            <span
              className={`absolute -top-0.5 -right-0.5 inline-flex px-2 py-1 rounded-md text-[10px] sm:text-xs font-semibold border ${rarityStyle.badge}`}
            >
              {rarityStyle.label}
            </span>
            {isEquipped && (
              <span className="absolute -bottom-0.5 -left-0.5 inline-flex items-center rounded-md bg-emerald-500/90 text-white text-[10px] font-semibold px-1.5 py-0.5">
                <Check className="w-3 h-3" />
              </span>
            )}
            {soldOut && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 inline-flex items-center gap-1 rounded-md bg-rose-500/95 text-white text-[10px] sm:text-xs font-semibold px-2 py-1 whitespace-nowrap">
                <PackageX className="w-3 h-3" />
                Распродано
              </span>
            )}
            {isOwned && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-0.5 inline-flex items-center gap-1 rounded-md bg-emerald-500/95 text-white text-[10px] sm:text-xs font-semibold px-2 py-1 whitespace-nowrap shadow-sm">
                Уже куплено
              </span>
            )}
          </div>
        </div>

        {/* Название и действие снизу */}
        <div className="flex-shrink-0 p-2.5 sm:p-3 pt-0 flex flex-col gap-1.5 sm:gap-2">
          <h3 className="font-semibold text-sm sm:text-base leading-snug line-clamp-2 text-center min-h-[2.25em] text-[var(--foreground)]" title={decoration.name}>
            {decoration.name}
          </h3>
          {showStock && (
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] text-center">
              {decoration.stock! <= 0 ? "Нет в наличии" : decoration.stock! <= 3 ? "Осталось мало" : `Осталось: ${decoration.stock}`}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap min-h-[2.25rem]">
            {!hidePurchase && !isOwned ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-xs sm:text-sm font-medium text-[var(--foreground)]">
                <Coins className="w-4 h-4 text-amber-500" />
                {decoration.price}
              </span>
            ) : !hidePurchase && isOwned ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium invisible" aria-hidden>
                <Coins className="w-4 h-4 text-amber-500" />
                {decoration.price}
              </span>
            ) : null}
            {renderAction(true, "medium")}
          </div>
        </div>
      </article>
      </>
    );
  }

  const renderImageBlock = (aspectClass: string, largeBadges = false) => {
    const badgeCl = largeBadges ? "px-2.5 py-1 rounded-lg text-xs font-semibold" : "px-2 py-0.5 rounded-lg text-[10px] font-semibold";
    const iconCl = largeBadges ? "w-3.5 h-3.5" : "w-3 h-3";
    return (
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
          onError={handleImageError}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-[var(--muted-foreground)]" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
      <div className={`absolute top-2 left-2 right-2 flex flex-wrap items-center ${largeBadges ? "gap-2" : "gap-1.5"}`}>
        <span className={`inline-flex items-center border ${badgeCl} ${rarityStyle.badge}`}>
          {rarityStyle.label}
        </span>
        {isEquipped && (
          <span className={`inline-flex items-center gap-1 ${badgeCl} bg-emerald-500/90 text-white`}>
            <Sparkles className={`${iconCl} fill-current`} />
            Надето
          </span>
        )}
        {soldOut && (
          <span className={`inline-flex items-center gap-1 ${badgeCl} bg-rose-500/90 text-white`}>
            <PackageX className={iconCl} />
            Распродано
          </span>
        )}
        {isOwned && (
          <span className={`inline-flex items-center gap-1 ${badgeCl} bg-emerald-500/95 text-white shadow-sm`}>
            Уже куплено
          </span>
        )}
      </div>
      {showStock && (
        <div className="absolute bottom-2 left-2 right-2 flex justify-start">
          <span className={`inline-flex items-center ${badgeCl} bg-black/50 backdrop-blur-sm text-white border-0`}>
            {decoration.stock! <= 0 ? "Нет в наличии" : decoration.stock! <= 3 ? "Осталось мало" : `Осталось: ${decoration.stock}`}
          </span>
        </div>
      )}
    </div>
  );
  };

  const renderContentBlock = (compactActions = false, contentSize: "normal" | "large" = "normal") => {
    const isLarge = contentSize === "large";
    return (
    <div className={`flex flex-col ${isLarge ? "p-4 sm:p-5 gap-2.5" : "p-2.5 sm:p-3 gap-2"}`}>
      <div className="min-w-0">
        <h3 className={`font-semibold leading-tight ${isLarge ? "text-base sm:text-lg line-clamp-2" : "text-xs sm:text-sm line-clamp-1"} text-[var(--foreground)]`} title={decoration.name}>
          {decoration.name}
        </h3>
        {decoration.description && (
          <p className={`text-[var(--muted-foreground)] ${isLarge ? "text-xs sm:text-sm line-clamp-2" : "text-[11px] sm:text-xs line-clamp-1"}`} title={decoration.description}>
            {decoration.description}
          </p>
        )}
        {showStock && (
          <p className={`${isLarge ? "text-xs" : "text-[11px]"} text-[var(--muted-foreground)]`}>
            {decoration.stock! <= 0 ? "Нет в наличии" : decoration.stock! <= 3 ? "Осталось мало" : `Осталось: ${decoration.stock}`}
          </p>
        )}
      </div>
      {compactActions ? (
        <div className={`flex flex-wrap items-center justify-center ${isLarge ? "gap-2 sm:gap-3 min-h-[2.25rem]" : "gap-1.5 sm:gap-2 min-h-[2rem]"}`}>
          {!hidePurchase && !isOwned ? (
            <span className={`inline-flex items-center gap-1.5 rounded-lg bg-[var(--secondary)] border border-[var(--border)] font-medium text-[var(--foreground)] shrink-0 ${isLarge ? "px-2.5 py-1.5 text-xs sm:text-sm" : "px-2 py-1.5 text-xs"}`}>
              <Coins className={isLarge ? "w-4 h-4 text-amber-500" : "w-3.5 h-3.5 text-amber-500"} />
              {decoration.price}
            </span>
          ) : !hidePurchase && isOwned ? (
            <span className={`inline-flex items-center gap-1.5 rounded-lg font-medium invisible shrink-0 ${isLarge ? "px-2.5 py-1.5 text-xs sm:text-sm" : "px-2 py-1.5 text-xs"}`} aria-hidden>
              <Coins className={isLarge ? "w-4 h-4 text-amber-500" : "w-3.5 h-3.5 text-amber-500"} />
              {decoration.price}
            </span>
          ) : null}
          {renderAction(true, isLarge ? "medium" : "small")}
        </div>
      ) : !hidePurchase && !isOwned && isAuthenticated && soldOut ? (
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
            onClick={(e) => { e.stopPropagation(); handlePurchase(); }}
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
  };

  /* Фон профиля: превью как обложка, горизонтальный прямоугольник */
  if (displayType === "background") {
    return (
      <>
        {previewModal}
        <article 
          onClick={handleCardClick}
          className={`group/card relative w-full self-start overflow-hidden rounded-xl sm:rounded-2xl border-2 bg-[var(--card)] shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${rarityStyle.border}`}
        >
        {/* Область изображения — горизонтальный баннер (ширина > высота) */}
        <div className="relative w-full min-h-0 aspect-[21/9] sm:aspect-video overflow-hidden bg-[var(--muted)] shrink-0">
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
              className={`object-cover object-center transition-transform duration-300 group-hover/card:scale-105 ${
                isImageLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={() => setIsImageLoading(false)}
              onError={handleImageError}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-[var(--muted-foreground)]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/70 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-[10px] font-medium text-white/90">
            Фон профиля
          </span>
          {showStock && (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] font-medium text-white/90">
              {decoration.stock! <= 0 ? "Нет в наличии" : decoration.stock! <= 3 ? "Осталось мало" : `Осталось: ${decoration.stock}`}
            </span>
          )}
          <div className="absolute top-2 left-2 right-2 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${rarityStyle.badge}`}>
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
            {isOwned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/95 text-white text-[10px] font-semibold shadow-sm">
                Уже куплено
              </span>
            )}
          </div>
        </div>
        <div className="p-2.5 sm:p-3 flex flex-col gap-2 bg-[var(--card)]">
          <div className="min-w-0">
            <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-1 text-[var(--foreground)]" title={decoration.name}>
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
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 min-h-[2rem]">
            {!hidePurchase && !isOwned ? (
              <span className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)] shrink-0">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                {decoration.price}
              </span>
            ) : !hidePurchase && isOwned ? (
              <span className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium invisible shrink-0" aria-hidden>
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                {decoration.price}
              </span>
            ) : null}
            {renderAction(true)}
          </div>
        </div>
        </article>
      </>
    );
  }

  /* Декорация профиля (карточка): вертикальный прямоугольник — увеличенный размер */
  if (displayType === "card") {
    return (
      <>
        {previewModal}
        <article 
          onClick={handleCardClick}
          className={`group/card relative w-full max-w-[240px] sm:max-w-[260px] lg:max-w-[280px] min-w-0 rounded-xl sm:rounded-2xl border-2 bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-lg cursor-pointer ${rarityStyle.border}`}
        >
        {renderImageBlock("relative aspect-[3/4]", true)}
        {renderContentBlock(true, "large")}
        </article>
      </>
    );
  }

  /* Прочие декорации: вертикальный формат 9:16 (fallback) */
  return (
    <>
      {previewModal}
      <article 
        onClick={handleCardClick}
        className={`group/card relative w-full max-w-[280px] rounded-2xl border-2 bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-lg cursor-pointer ${rarityStyle.border}`}
      >
        {renderImageBlock("relative aspect-[9/16]")}
        {renderContentBlock()}
      </article>
    </>
  );
}
