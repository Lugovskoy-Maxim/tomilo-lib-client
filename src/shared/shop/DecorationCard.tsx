"use client";

import { useState, useMemo } from "react";
import { ShoppingBag, Check, Sparkles, ImageIcon, Coins, PackageX, X, Gift, Crown } from "lucide-react";
import Image from "next/image";
import {
  Decoration,
  DecorationRarity,
  getDecorationImageUrls,
  getEquippedFrameUrl,
  normalizeRarity,
} from "@/api/shop";
import { useAuth } from "@/hooks/useAuth";
import { useResolvedEquippedDecorations } from "@/hooks/useEquippedFrameUrl";
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

const PREVIEW_LABELS: Record<"avatar" | "frame" | "background" | "card", string> = {
  avatar: "Как будет в профиле",
  frame: "Как будет в профиле",
  background: "Шапка профиля",
  card: "В таблице лидеров",
};

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
  /** URL активной декорации аватара (персонаж) — приоритет над userAvatar */
  userAvatarDecorationUrl: string | null;
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
  userAvatarDecorationUrl,
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

  const resolvedUserAvatar = useMemo(() => {
    const effectiveUrl = userAvatarDecorationUrl ?? userAvatar;
    if (!effectiveUrl) return DEFAULT_AVATAR;
    const { primary } = getImageUrls(effectiveUrl);
    return primary || DEFAULT_AVATAR;
  }, [userAvatarDecorationUrl, userAvatar]);

  const frameToShow = userFrameUrl ?? (displayType === "frame" ? imageSrc : null);
  /** В превью аватара показываем ту декорацию, которую смотрят (imageSrc); в остальных — текущий вид пользователя (resolvedUserAvatar). */
  const avatarSrcInPreview = displayType === "avatar" ? imageSrc : resolvedUserAvatar;
  const AvatarWithOptionalFrame = ({ size }: { size: number }) => (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="relative overflow-hidden border-2 border-[var(--background)] shadow-lg rounded-full bg-[var(--muted)]"
        style={{ width: size, height: size }}
      >
        <Image
          src={avatarSrcInPreview}
          alt={username}
          fill
          unoptimized
          className="object-cover rounded-full"
        />
      </div>
      {frameToShow && (
        <img
          src={frameToShow}
          alt=""
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none object-contain z-10 w-[120%] h-[120%] max-w-none max-h-none"
          aria-hidden
        />
      )}
    </div>
  );

  const renderPreviewProfile = () => {
    if (displayType === "card") {
      return (
        <div
          className="relative flex flex-col items-center justify-end rounded-2xl border-2 border-[var(--border)] overflow-hidden bg-[var(--card)]"
          style={{ aspectRatio: "9 / 16", maxWidth: "160px" }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${imageSrc})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />

          <div className="absolute top-2 right-2 w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-950 shadow z-10 border border-white/20">
            <Crown className="w-5 h-5" />
          </div>

          <div className="relative z-10 mb-4 flex flex-col items-center">
            <div className="relative">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--border)] shadow-md bg-[var(--secondary)]">
                <Image src={resolvedUserAvatar} alt={username} fill unoptimized className="object-cover rounded-full" />
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full px-3 py-3 rounded-b-2xl bg-gradient-to-t from-black/75 to-transparent">
            <p className="font-semibold text-white text-sm truncate text-center">{username}</p>
            <p className="text-xs text-white/80 mt-1 text-center">Уровень {Math.max(1, userLevel)}</p>
          </div>
        </div>
      );
    }

    if (displayType === "background") {
      return (
        <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)]">
          <ProfileHeaderPreview
            compact
            username={username}
            level={userLevel}
            avatarUrl={resolvedUserAvatar}
            frameUrl={userFrameUrl}
            backgroundUrl={imageSrc}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <AvatarWithOptionalFrame size={56} />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-[var(--foreground)] truncate">{username}</span>
            <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold">
                {userLevel}
              </span>
              Уровень
            </span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[var(--muted)]/80 border border-[var(--border)]">
          <p className="text-[11px] text-[var(--muted-foreground)] mb-2">Как в комментариях</p>
          <div className="flex items-center gap-2">
            <AvatarWithOptionalFrame size={32} />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-[var(--foreground)] truncate block">{username}</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">Текст комментария...</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMainImage = () => {
    if (displayType === "frame") {
      return (
        <div className="relative flex items-center justify-center">
          <div className="relative w-40 h-40 sm:w-48 sm:h-48">
            <div className="absolute inset-0 overflow-hidden rounded-full border-2 border-[var(--background)] shadow-xl bg-[var(--muted)]">
              <Image
                src={resolvedUserAvatar}
                alt=""
                fill
                unoptimized
                className="object-cover rounded-full"
              />
            </div>
            <img
              src={imageSrc}
              alt=""
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none object-contain z-10 w-[120%] h-[120%] max-w-none max-h-none"
              onLoad={() => setIsImageLoading(false)}
              aria-hidden
            />
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--muted)]/80 rounded-full">
                <span className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
              </div>
            )}
          </div>
          <span className={`absolute top-1 right-1 inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold border whitespace-nowrap ${rarityStyle.badge}`}>
            {rarityStyle.label}
          </span>
        </div>
      );
    }

    if (displayType === "background") {
      return (
        <div className="relative w-full rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)] aspect-[21/9] sm:aspect-video">
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
            className={`object-cover object-center ${isImageLoading ? "opacity-0" : "opacity-100"}`}
            onLoad={() => setIsImageLoading(false)}
          />
          <span className={`absolute top-2 right-2 inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${rarityStyle.badge}`}>
            {rarityStyle.label}
          </span>
        </div>
      );
    }

    if (displayType === "card") {
      return (
        <div className="relative w-full max-w-[200px] mx-auto rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)] aspect-[3/4]">
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
            className={`object-cover object-center ${isImageLoading ? "opacity-0" : "opacity-100"}`}
            onLoad={() => setIsImageLoading(false)}
          />
          <span className={`absolute top-2 right-2 inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${rarityStyle.badge}`}>
            {rarityStyle.label}
          </span>
        </div>
      );
    }

    return (
      <div className="relative w-40 h-40 sm:w-48 sm:h-48 shrink-0">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--chart-1)] to-[var(--chart-2)] opacity-75 blur-sm scale-[1.05]" aria-hidden />
        <div className="relative w-full h-full overflow-hidden border-4 border-[var(--background)] shadow-xl rounded-full bg-[var(--muted)]">
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
        <span className={`absolute top-1 right-1 inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold border whitespace-nowrap ${rarityStyle.badge}`}>
          {rarityStyle.label}
        </span>
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
              <div className="flex justify-center w-full md:block">
                {renderMainImage()}
              </div>

              {(displayType === "avatar" && (isGif || decoration.bonus)) && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
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
              )}

              <div className="text-center md:text-left mt-2">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{decoration.name}</h3>
                {decoration.description && (
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">{decoration.description}</p>
                )}
              </div>

              {!isOwned && !hidePurchase && (
                <div className="flex items-center gap-2 mt-2">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span className="text-xl font-bold text-[var(--foreground)]">{decoration.price}</span>
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

            <div className="flex-1 flex flex-col min-w-0">
              <div className="text-sm font-medium text-[var(--muted-foreground)] mb-3">{PREVIEW_LABELS[displayType]}</div>
              <div className="flex-1 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] min-h-0">
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
  const { avatarDecorationUrl } = useResolvedEquippedDecorations();
  const userFrameUrl = getEquippedFrameUrl((user?.equippedDecorations ?? null) as EquippedDecorations | null);
  /** Буква для превью аватара в карточках рамок: первая буква ника или T для гостя */
  const avatarPreviewLetter =
    (user?.username?.trim()[0]?.toUpperCase()) || "T";
  /** URL аватара для превью в карточках рамок: активная декорация аватара или фото профиля */
  const userAvatarPreviewUrl = useMemo(() => {
    const url = avatarDecorationUrl ?? user?.avatar;
    if (!url || typeof url !== "string") return null;
    const { primary } = getImageUrls(url);
    return primary || null;
  }, [avatarDecorationUrl, user?.avatar]);

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
      userAvatarDecorationUrl={avatarDecorationUrl ?? null}
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

  /* Карточка для аватаров: круг + инфо. Рамки: квадрат без обрезки (прозрачные по краям). */
  if (isAvatar || isFrame) {
    const isCircleCrop = isAvatar;
    return (
      <>
        {previewModal}
        <article
          onClick={handleCardClick}
          className={`group/card relative w-full max-w-full sm:max-w-[180px] md:max-w-[200px] lg:max-w-[200px] xl:max-w-[220px] min-w-0 rounded-xl sm:rounded-2xl border-2 bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 card-hover-soft flex flex-col cursor-pointer ${rarityStyle.border}`}
        >
        {/* Картинка сверху: для аватаров — квадрат, для рамок — соотношение 1:1.2. */}
        <div className={`w-full flex-shrink-0 flex items-center justify-center p-1 sm:p-1.5 ${isCircleCrop ? "aspect-square" : "aspect-[1/1.2]"}`}>
          <div className={`relative w-full max-w-[92%] ${isCircleCrop ? "aspect-square" : "aspect-[1/1.2]"}`}>
            {isCircleCrop && (
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--chart-1)] to-[var(--chart-2)] opacity-75 group-hover/card:opacity-100 blur-sm transition-all duration-500" />
            )}
            <div
              className={`relative w-full h-full border-2 border-[var(--background)] shadow-lg bg-[var(--muted)] ${isCircleCrop ? "overflow-hidden" : ""}`}
              style={isCircleCrop ? { borderRadius: "50%" } : undefined}
            >
              {/* Для рамок: пропорции как в превью — аватар 100%, рамка 120% → круг аватара ~83% области */}
              {!isCircleCrop && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="relative w-[83%] aspect-square rounded-full overflow-hidden border-2 border-[var(--background)] shadow-inner bg-[var(--primary)] flex items-center justify-center text-white font-semibold"
                    aria-hidden
                  >
                    {userAvatarPreviewUrl ? (
                      <Image
                        src={userAvatarPreviewUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-2xl sm:text-3xl select-none">
                        {avatarPreviewLetter}
                      </span>
                    )}
                  </div>
                </div>
              )}
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
                  className={`${isCircleCrop ? "object-cover rounded-full" : "object-contain"} ${isImageLoading ? "opacity-0" : "opacity-100"}`}
                  style={isCircleCrop ? { borderRadius: "50%" } : undefined}
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
              className={`absolute top-2 left-1/2 -translate-x-1/2 z-10 inline-flex px-2 py-1 rounded-md text-[10px] sm:text-xs font-semibold border whitespace-nowrap opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none ${rarityStyle.badge}`}
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
        <div className="flex-shrink-0 px-2 py-1.5 sm:px-2.5 sm:py-2 pt-0 flex flex-col gap-1 sm:gap-1.5">
          <h3 className="font-semibold text-xs sm:text-sm leading-snug line-clamp-2 text-center min-h-[2em] text-[var(--foreground)]" title={decoration.name}>
            {decoration.name}
          </h3>
          {showStock && (
            <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] text-center">
              {decoration.stock! <= 0 ? "Нет в наличии" : decoration.stock! <= 3 ? "Осталось мало" : `Осталось: ${decoration.stock}`}
            </p>
          )}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap min-h-[2rem]">
            {!hidePurchase && !isOwned ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-[10px] sm:text-xs font-medium text-[var(--foreground)]">
                <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                {decoration.price}
              </span>
            ) : !hidePurchase && isOwned ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-medium invisible" aria-hidden>
                <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                {decoration.price}
              </span>
            ) : null}
            {renderAction(true, "small")}
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
      <span
        className={`absolute top-2 left-1/2 -translate-x-1/2 z-10 inline-flex items-center border whitespace-nowrap opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none ${badgeCl} ${rarityStyle.badge}`}
      >
        {rarityStyle.label}
      </span>
      <div className={`absolute top-2 left-2 right-2 flex flex-wrap items-center ${largeBadges ? "gap-2" : "gap-1.5"}`}>
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
          className={`group/card relative w-full max-w-full min-w-0 self-start overflow-hidden rounded-xl sm:rounded-2xl border-2 bg-[var(--card)] shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${rarityStyle.border}`}
        >
        {/* Область изображения — горизонтальный баннер (ширина > высота) */}
        <div className="relative w-full min-h-0 aspect-[21/9] sm:aspect-video overflow-hidden bg-[var(--muted)] shrink-0 min-w-0">
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
          <span
            className={`absolute top-2 left-1/2 -translate-x-1/2 z-10 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold border whitespace-nowrap opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none ${rarityStyle.badge}`}
          >
            {rarityStyle.label}
          </span>
          <div className="absolute top-2 left-2 right-2 flex flex-wrap items-center gap-1.5">
            {isEquipped && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/90 text-white text-[10px] font-semibold whitespace-nowrap">
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
          className={`group/card relative w-full max-w-full sm:max-w-[180px] md:max-w-[200px] lg:max-w-[200px] xl:max-w-[220px] min-w-0 rounded-xl sm:rounded-2xl border-2 bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-lg cursor-pointer ${rarityStyle.border}`}
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
        className={`group/card relative w-full max-w-full sm:max-w-[200px] lg:max-w-[220px] min-w-0 rounded-xl sm:rounded-2xl border-2 bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-lg cursor-pointer ${rarityStyle.border}`}
      >
        {renderImageBlock("relative aspect-[9/16]")}
        {renderContentBlock()}
      </article>
    </>
  );
}
