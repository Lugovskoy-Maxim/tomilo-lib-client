"use client";

import { useState, useMemo, useRef } from "react";
import { ShoppingBag, Check, Sparkles, ImageIcon, Coins, PackageX, X, Crown } from "lucide-react";
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
import { useGetProfileByIdQuery } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";
import { getImageUrls } from "@/lib/asset-url";
import { getRankDisplay } from "@/lib/rank-utils";
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
  /** Не показывать тост при экипировке/снятии/покупке (тост показывает родитель, напр. ProfileInventory). */
  showActionToast?: boolean;
  /** Только превью: рендерить только модалку (для предложений), открытую по умолчанию. */
  previewOnly?: boolean;
  /** Вызывается при закрытии превью в режиме previewOnly. */
  onPreviewClose?: () => void;
  /** Для принятой декорации — показывать автора и уровень (по API или по id). Для предложения — культиватор и ранг по уровню. */
  authorDisplay?: "author" | "cultivator";
  /** Уровень культиватора для отображения ранга (только при authorDisplay === "cultivator"). */
  cultivatorLevel?: number;
}

const RARITY_STYLES: Record<
  DecorationRarity,
  {
    border: string;
    badge: string;
    label: string;
    /** Градиент свечения сверху для области картинки (рамка/аватар). */
    glowTop: string;
    /** Класс вращающегося градиента на фоне карточки (decoration-card-glow-*) */
    glowSpin: string;
  }
> = {
  common: {
    border: "border-slate-400/40 shadow-[0_0_0_1px_rgba(100,116,139,0.2)]",
    badge:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/80 dark:text-slate-200 dark:border-slate-600",
    label: "Обычная",
    glowTop: "from-slate-400/15 via-transparent to-transparent",
    glowSpin: "decoration-card-glow-common",
  },
  rare: {
    border:
      "border-blue-400/50 shadow-[0_0_0_1px_rgba(59,130,246,0.25),0_0_12px_rgba(59,130,246,0.15)]",
    badge:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-700",
    label: "Редкая",
    glowTop: "from-blue-400/25 via-transparent to-transparent",
    glowSpin: "decoration-card-glow-rare",
  },
  epic: {
    border:
      "border-violet-400/50 shadow-[0_0_0_1px_rgba(139,92,246,0.3),0_0_16px_rgba(139,92,246,0.2)]",
    badge:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/60 dark:text-violet-200 dark:border-violet-700",
    label: "Эпическая",
    glowTop: "from-violet-400/25 via-transparent to-transparent",
    glowSpin: "decoration-card-glow-epic",
  },
  legendary: {
    border:
      "border-amber-400/60 shadow-[0_0_0_1px_rgba(245,158,11,0.35),0_0_20px_rgba(245,158,11,0.25)]",
    badge:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-600",
    label: "Легендарная",
    glowTop: "from-amber-400/30 via-transparent to-transparent",
    glowSpin: "decoration-card-glow-legendary",
  },
};

/** Стили бейджа редкости для карточек аватара/рамки (новый дизайн) */
const RARITY_CARD_BADGE: Record<DecorationRarity, string> = {
  common: "bg-slate-500/90 text-white border border-slate-400/50 shadow",
  rare: "bg-blue-500/90 text-white border border-blue-400/50 shadow",
  epic: "bg-violet-500/90 text-white border border-violet-400/50 shadow",
  legendary: "bg-amber-500/90 text-amber-50 border border-amber-400/50 shadow",
};

const DEFAULT_AVATAR = "/logo/ring_logo.png";

/** Форматирует цену: 0 → «Бесплатно», иначе с пробелами (1 800). */
function formatPrice(n: number): string {
  if (n === 0) return "Бесплатно";
  return n.toLocaleString("ru-RU");
}

const PREVIEW_LABELS: Record<"avatar" | "frame" | "background" | "card", string> = {
  avatar: "Как будет в профиле",
  frame: "Как будет в профиле",
  background: "Шапка профиля",
  card: "В таблице лидеров",
};

const TYPE_META: Record<
  "avatar" | "frame" | "background" | "card",
  { shortLabel: string; previewHint: string }
> = {
  avatar: {
    shortLabel: "Аватар",
    previewHint: "Круглая иконка профиля и комментариев",
  },
  frame: {
    shortLabel: "Рамка",
    previewHint: "Обрамление аватара в профиле и комментариях",
  },
  background: {
    shortLabel: "Фон",
    previewHint: "Баннер шапки профиля",
  },
  card: {
    shortLabel: "Карточка",
    previewHint: "Плашка профиля и лидерборда",
  },
};

interface DecorationPreviewModalProps {
  decoration: Decoration;
  imageSrc: string;
  rarityStyle: (typeof RARITY_STYLES)[DecorationRarity];
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
  /** Позиция карточки при открытии (окно открывается на уровне карточки) */
  anchorRect?: { top: number; left: number; width: number; height: number } | null;
  /** Запасной URL при ошибке загрузки (например, сервер вместо S3) */
  fallbackSrc?: string;
  authorDisplay?: "author" | "cultivator";
  cultivatorLevel?: number;
  displayAuthorName?: string | null;
  displayAuthorLevel?: number;
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
  anchorRect,
  fallbackSrc,
  authorDisplay,
  cultivatorLevel,
  displayAuthorName,
  displayAuthorLevel,
}: DecorationPreviewModalProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const effectiveImageSrc =
    useFallback && fallbackSrc && fallbackSrc !== imageSrc ? fallbackSrc : imageSrc;
  const handleImageError = () => {
    if (fallbackSrc && fallbackSrc !== imageSrc && !useFallback) {
      setUseFallback(true);
      setIsImageLoading(true);
    } else {
      setIsImageLoading(false);
    }
  };
  const GAP = 12;
  const anchorStyle = anchorRect
    ? {
        position: "fixed" as const,
        top: anchorRect.top + GAP,
        left: "50%",
        transform: "translateX(-50%)",
        maxHeight: "calc(100vh - 24px)",
      }
    : undefined;
  const isGif = effectiveImageSrc?.toLowerCase().includes(".gif");

  const resolvedUserAvatar = useMemo(() => {
    const effectiveUrl = userAvatarDecorationUrl ?? userAvatar;
    if (!effectiveUrl) return DEFAULT_AVATAR;
    const { primary } = getImageUrls(effectiveUrl);
    return primary || DEFAULT_AVATAR;
  }, [userAvatarDecorationUrl, userAvatar]);

  /** В превью рамки показываем ту рамку, которую смотрят; в остальных — текущую надетую рамку пользователя. */
  const frameToShow = displayType === "frame" ? effectiveImageSrc : userFrameUrl;
  /** В превью аватара показываем ту декорацию, которую смотрят; в остальных — текущий вид пользователя (resolvedUserAvatar). */
  const avatarSrcInPreview = displayType === "avatar" ? effectiveImageSrc : resolvedUserAvatar;
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

  const renderAuthorSummary = (size: "compact" | "regular" = "regular") => {
    const name = displayAuthorName ?? decoration.authorUsername ?? null;
    const textClass =
      size === "compact"
        ? "text-[10px] sm:text-xs text-[var(--muted-foreground)]"
        : "text-sm text-[var(--muted-foreground)]";

    if (authorDisplay === "cultivator") {
      return (
        <div className="space-y-0.5">
          {name ? <p className={textClass}>Автор: {name}</p> : null}
          <p className={textClass}>Культиватор: {getRankDisplay(cultivatorLevel ?? 0)}</p>
          {(displayAuthorLevel ?? cultivatorLevel) ? (
            <p className={textClass}>Уровень: {displayAuthorLevel ?? cultivatorLevel}</p>
          ) : null}
        </div>
      );
    }

    if (!name && displayAuthorLevel == null) return null;

    return (
      <div className="space-y-0.5">
        {name ? <p className={textClass}>Автор: {name}</p> : null}
        {displayAuthorLevel != null ? <p className={textClass}>Уровень {displayAuthorLevel}</p> : null}
      </div>
    );
  };

  const renderPreviewProfile = () => {
    if (displayType === "card") {
      return (
        <div
          className="relative flex flex-col items-center justify-end rounded-2xl border-2 border-[var(--border)] overflow-hidden bg-[var(--card)] w-[160px] aspect-[3/5]"
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${effectiveImageSrc})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />

          <div className="absolute top-2 right-2 w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-950 shadow z-10 border border-white/20">
            <Crown className="w-5 h-5" />
          </div>

          <div className="relative z-10 mb-4 flex flex-col items-center">
            <div className="relative">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--border)] shadow-md bg-[var(--secondary)]">
                <Image
                  src={resolvedUserAvatar}
                  alt={username}
                  fill
                  unoptimized
                  className="object-cover rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full px-3 py-3 rounded-b-2xl bg-gradient-to-t from-black/75 to-transparent">
            <p className="font-semibold text-white text-sm truncate text-center">{username}</p>
            <p className="text-xs text-white/80 mt-1 text-center">
              Уровень {Math.max(1, userLevel)}
            </p>
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
            backgroundUrl={effectiveImageSrc}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <AvatarWithOptionalFrame size={56} />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-[var(--foreground)] truncate">
              {username}
            </span>
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
              <span className="text-xs font-medium text-[var(--foreground)] truncate block">
                {username}
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                Текст комментария...
              </span>
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
              src={effectiveImageSrc}
              alt=""
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none object-contain z-10 w-[120%] h-[120%] max-w-none max-h-none"
              onLoad={() => setIsImageLoading(false)}
              onError={handleImageError}
              aria-hidden
            />
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--muted)]/80 rounded-full">
                <span className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
              </div>
            )}
          </div>
          <span
            className={`absolute top-1 right-1 inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold border whitespace-nowrap ${rarityStyle.badge}`}
          >
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
            src={effectiveImageSrc}
            alt={decoration.name}
            fill
            unoptimized
            className={`object-cover object-center ${isImageLoading ? "opacity-0" : "opacity-100"}`}
            onLoad={() => setIsImageLoading(false)}
            onError={handleImageError}
          />
          <span
            className={`absolute top-2 right-2 inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${rarityStyle.badge}`}
          >
            {rarityStyle.label}
          </span>
        </div>
      );
    }

    if (displayType === "card") {
      return (
        <div className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)] aspect-[3/5]">
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--muted)]">
              <span className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
            </div>
          )}
          <Image
            src={effectiveImageSrc}
            alt={decoration.name}
            fill
            unoptimized
            className={`object-cover object-center ${isImageLoading ? "opacity-0" : "opacity-100"}`}
            onLoad={() => setIsImageLoading(false)}
            onError={handleImageError}
          />
          <span
            className={`absolute top-2 right-2 inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${rarityStyle.badge}`}
          >
            {rarityStyle.label}
          </span>
        </div>
      );
    }

    return (
      <div className="relative w-40 h-40 sm:w-48 sm:h-48 shrink-0">
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--chart-1)] to-[var(--chart-2)] opacity-75 blur-sm scale-[1.05]"
          aria-hidden
        />
        <div className="relative w-full h-full overflow-hidden border-4 border-[var(--background)] shadow-xl rounded-full bg-[var(--muted)]">
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--muted)]">
              <span className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
            </div>
          )}
          <Image
            src={effectiveImageSrc}
            alt={decoration.name}
            fill
            unoptimized
            className={`object-cover rounded-full ${isImageLoading ? "opacity-0" : "opacity-100"}`}
            onLoad={() => setIsImageLoading(false)}
            onError={handleImageError}
          />
        </div>
        <span
          className={`absolute top-1 right-1 inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold border whitespace-nowrap ${rarityStyle.badge}`}
        >
          {rarityStyle.label}
        </span>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl mx-auto my-4 bg-[var(--background)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden animate-in zoom-in-95 duration-200 ${anchorRect ? "overflow-y-auto" : ""}`}
        style={anchorStyle}
        onClick={e => e.stopPropagation()}
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
              <div className="flex justify-center w-full md:block">{renderMainImage()}</div>

              {displayType === "avatar" && (isGif || decoration.bonus) && (
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
                <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
                  {decoration.name}
                </h3>
                {decoration.description && (
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {decoration.description}
                  </p>
                )}
                {authorDisplay === "cultivator" && (
                  <>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Культиватор</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {getRankDisplay(cultivatorLevel ?? 0)}
                    </p>
                  </>
                )}
                {authorDisplay !== "cultivator" && (displayAuthorName ?? decoration.authorUsername) && (
                  <>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      Автор: {displayAuthorName ?? decoration.authorUsername}
                    </p>
                    {displayAuthorLevel != null && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        Уровень {displayAuthorLevel}
                      </p>
                    )}
                  </>
                )}
              </div>

              {!isOwned && !hidePurchase && (
                <div className="flex flex-col gap-1 mt-2">
                  {decoration.onlyWithSubscription && decoration.subscriptionPrice != null ? (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Coins className="w-5 h-5 text-amber-500 shrink-0" />
                        <span className="text-xl font-bold text-[var(--foreground)]">
                          {formatPrice(decoration.subscriptionPrice)}
                        </span>
                        {decoration.price > decoration.subscriptionPrice && (
                          <span className="text-sm text-[var(--muted-foreground)] line-through">
                            {formatPrice(decoration.price)}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium">
                        <Crown className="w-4 h-4 shrink-0" />
                        Только с подпиской
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-amber-500" />
                        <span className="text-xl font-bold text-[var(--foreground)]">
                          {formatPrice(decoration.price)}
                        </span>
                      </div>
                      {decoration.subscriptionPrice != null &&
                        decoration.subscriptionPrice < decoration.price && (
                          <span className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
                            <Crown className="w-4 h-4 shrink-0 text-blue-500" />
                            {formatPrice(decoration.subscriptionPrice)} с подпиской
                          </span>
                        )}
                    </>
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
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <div className="text-sm font-medium text-[var(--muted-foreground)] mb-3">
                {PREVIEW_LABELS[displayType]}
              </div>
              <div className="flex-1 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] min-h-0 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--foreground)]">
                    {TYPE_META[displayType].shortLabel}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {TYPE_META[displayType].previewHint}
                  </span>
                </div>
                {renderPreviewProfile()}
                {renderAuthorSummary()}
                {/* Кнопка действия внутри блока предпросмотра */}
                {!hidePurchase && (
                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-[var(--border)]">
                    {!isAuthenticated ? (
                      <p className="text-sm text-[var(--muted-foreground)]">Войдите для покупки</p>
                    ) : isOwned ? (
                      isEquipped ? (
                        <button
                          type="button"
                          onClick={onUnequip}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] font-medium text-sm hover:bg-[var(--muted)] disabled:opacity-50 transition-colors"
                        >
                          {isLoading ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" /> Снять
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onEquip}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                          {isLoading ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" /> Надеть
                            </>
                          )}
                        </button>
                      )
                    ) : soldOut ? (
                      <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)] font-medium text-sm">
                        <PackageX className="w-4 h-4" /> Распродано
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={onPurchase}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {isLoading ? (
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" /> Купить
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
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
  showActionToast = true,
  previewOnly = false,
  onPreviewClose,
  authorDisplay,
  cultivatorLevel,
}: DecorationCardProps) {
  const { isAuthenticated, user } = useAuth();
  const shouldFetchAuthor =
    Boolean(decoration.authorId) &&
    (authorDisplay === "author"
      ? !decoration.authorUsername
      : authorDisplay === "cultivator");
  const { data: authorProfile } = useGetProfileByIdQuery(decoration.authorId ?? "", {
    skip: !shouldFetchAuthor,
  });
  const fetchedLevel =
    authorProfile?.success && authorProfile?.data
      ? (authorProfile.data as { level?: number }).level
      : undefined;
  const displayAuthorName =
    decoration.authorUsername ??
    (authorProfile?.success && authorProfile?.data
      ? (authorProfile.data as { username?: string }).username ?? null
      : null);
  const displayAuthorLevel =
    decoration.authorLevel ?? (authorDisplay === "author" ? fetchedLevel : undefined);
  /** Уровень культиватора: из пропса или из запроса по authorId (для ранга). */
  const effectiveCultivatorLevel =
    authorDisplay === "cultivator"
      ? (cultivatorLevel ?? fetchedLevel ?? 0)
      : cultivatorLevel ?? 0;
  const renderAuthorSummary = (size: "compact" | "regular" = "regular") => {
    const name = displayAuthorName ?? decoration.authorUsername ?? null;
    const textClass =
      size === "compact"
        ? "text-[10px] sm:text-xs text-[var(--muted-foreground)]"
        : "text-sm text-[var(--muted-foreground)]";

    if (authorDisplay === "cultivator") {
      return (
        <div className="space-y-0.5">
          {name ? <p className={textClass}>Автор: {name}</p> : null}
          <p className={textClass}>Культиватор: {getRankDisplay(effectiveCultivatorLevel)}</p>
          {(displayAuthorLevel ?? effectiveCultivatorLevel) ? (
            <p className={textClass}>Уровень: {displayAuthorLevel ?? effectiveCultivatorLevel}</p>
          ) : null}
        </div>
      );
    }

    if (!name && displayAuthorLevel == null) return null;

    return (
      <div className="space-y-0.5">
        {name ? <p className={textClass}>Автор: {name}</p> : null}
        {displayAuthorLevel != null ? <p className={textClass}>Уровень {displayAuthorLevel}</p> : null}
      </div>
    );
  };
  const displayType = sectionType ?? decoration.type;
  const { success, error: showError } = useToast();
  const actionInProgressRef = useRef(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [useFallbackImage, setUseFallbackImage] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(!!previewOnly);
  const [anchorRect, setAnchorRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const cardRef = useRef<HTMLElement>(null);
  const { primary: imageSrcPrimary, fallback: imageSrcFallback } = useMemo(
    () => getDecorationImageUrls(decoration.imageUrl ?? ""),
    [decoration.imageUrl],
  );
  const imageSrc =
    useFallbackImage && imageSrcFallback !== imageSrcPrimary ? imageSrcFallback : imageSrcPrimary;
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
  const subscriptionPrice = decoration.subscriptionPrice;
  const onlyWithSubscription = decoration.onlyWithSubscription === true;
  const discountPercent =
    subscriptionPrice != null && decoration.price > 0 && subscriptionPrice < decoration.price
      ? Math.round((1 - subscriptionPrice / decoration.price) * 100)
      : 0;
  const { avatarDecorationUrl, frameUrl: resolvedFrameUrl } = useResolvedEquippedDecorations();
  /** URL надетой рамки: из хука (разрешён по id через профиль/декорации) или fallback из user */
  const userFrameUrl =
    resolvedFrameUrl ??
    getEquippedFrameUrl((user?.equippedDecorations ?? null) as EquippedDecorations | null);
  /** Буква для превью аватара в карточках рамок: первая буква ника или T для гостя */
  const avatarPreviewLetter = user?.username?.trim()[0]?.toUpperCase() || "T";
  /** URL аватара для превью в карточках рамок: активная декорация аватара или фото профиля */
  const userAvatarPreviewUrl = useMemo(() => {
    const url = avatarDecorationUrl ?? user?.avatar;
    if (!url || typeof url !== "string") return null;
    const { primary } = getImageUrls(url);
    return primary || null;
  }, [avatarDecorationUrl, user?.avatar]);

  const handlePurchase = async () => {
    if (soldOut) {
      if (showActionToast) showError("Распродано");
      return;
    }
    if (!isAuthenticated) {
      if (showActionToast) showError("Войдите в аккаунт для покупки");
      return;
    }
    if (actionInProgressRef.current) return;
    actionInProgressRef.current = true;
    try {
      await onPurchase?.(decoration.id);
      if (showActionToast) success(`"${decoration.name}" куплено!`);
    } catch {
      if (showActionToast) showError("Ошибка при покупке");
    } finally {
      actionInProgressRef.current = false;
    }
  };

  const handleEquip = async () => {
    if (!isAuthenticated) {
      if (showActionToast) showError("Войдите в аккаунт для экипировки");
      return;
    }
    if (actionInProgressRef.current) return;
    actionInProgressRef.current = true;
    try {
      await onEquip?.(decoration.id);
      if (showActionToast) success(`"${decoration.name}" надето!`);
    } catch {
      if (showActionToast) showError("Ошибка при экипировке");
    } finally {
      actionInProgressRef.current = false;
    }
  };

  const handleUnequip = async () => {
    if (!isAuthenticated) return;
    if (actionInProgressRef.current) return;
    actionInProgressRef.current = true;
    try {
      await onUnequip?.();
      if (showActionToast) success(`"${decoration.name}" снято!`);
    } catch {
      if (showActionToast) showError("Ошибка при снятии");
    } finally {
      actionInProgressRef.current = false;
    }
  };

  const compactBtn =
    "inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium";
  const compactBtnMedium =
    "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium";
  /** cardView: на карточке показываем только «Распродано» (если soldOut), Купить/Надеть/Снять — только в предпросмотре */
  const renderAction = (compact = false, size: "small" | "medium" = "small", cardView = false) => {
    if (hidePurchase && !isOwned) return null;
    if (cardView) {
      if (soldOut) {
        const btnClass = compact ? (size === "medium" ? compactBtnMedium : compactBtn) : "";
        const iconSize = size === "medium" ? "w-4 h-4" : "w-3.5 h-3.5";
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
      return null;
    }
    if (!isAuthenticated) {
      return <p className="text-xs text-[var(--muted-foreground)] py-2">Войдите для покупки</p>;
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
          onClick={e => {
            e.stopPropagation();
            handlePurchase();
          }}
          disabled={isLoading}
          className={
            compact
              ? `${btnClass} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity`
              : "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-[0.98]"
          }
        >
          {isLoading ? (
            <span
              className={`${compact ? (size === "medium" ? "w-4 h-4" : "w-3.5 h-3.5") : "w-5 h-5"} border-2 border-current border-t-transparent rounded-full animate-spin`}
            />
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
          onClick={e => {
            e.stopPropagation();
            handleUnequip();
          }}
          disabled={isLoading}
          className={
            compact
              ? `${btnClass} bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-50 transition-colors`
              : "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] font-medium text-sm hover:bg-[var(--muted)] disabled:opacity-50 transition-colors active:scale-[0.98]"
          }
        >
          {isLoading ? (
            <span
              className={`${compact ? (size === "medium" ? "w-4 h-4" : "w-3.5 h-3.5") : "w-5 h-5"} border-2 border-current border-t-transparent rounded-full animate-spin`}
            />
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
        onClick={e => {
          e.stopPropagation();
          handleEquip();
        }}
        disabled={isLoading}
        className={
          compact
            ? `${btnClass} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity`
            : "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-[0.98]"
        }
      >
        {isLoading ? (
          <span
            className={`${compact ? (size === "medium" ? "w-4 h-4" : "w-3.5 h-3.5") : "w-5 h-5"} border-2 border-current border-t-transparent rounded-full animate-spin`}
          />
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
    const rect = cardRef.current?.getBoundingClientRect();
    setAnchorRect(rect ?? null);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setAnchorRect(null);
    if (previewOnly) onPreviewClose?.();
  };

  const previewModal =
    isPreviewOpen && imageSrc ? (
      <DecorationPreviewModal
        decoration={decoration}
        imageSrc={imageSrcPrimary}
        fallbackSrc={imageSrcFallback && imageSrcFallback !== imageSrcPrimary ? imageSrcFallback : undefined}
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
        anchorRect={anchorRect}
        authorDisplay={authorDisplay}
        cultivatorLevel={effectiveCultivatorLevel}
        displayAuthorName={displayAuthorName}
        displayAuthorLevel={displayAuthorLevel}
      />
    ) : null;

  if (previewOnly) {
    return <>{previewModal}</>;
  }

  /* Карточка для аватаров и рамок: квадратная карточка, контент по центру, название и цена — полоска внизу. Аватар — строго 1:1 (круг). */
  if (isAvatar || isFrame) {
    const isCircleCrop = isAvatar;
    return (
      <>
        {previewModal}
        <article
          ref={cardRef}
          onClick={handleCardClick}
          className={`group/card relative w-full min-w-0 self-start rounded-lg sm:rounded-xl md:rounded-2xl border-2 bg-[var(--card)] overflow-hidden cursor-pointer ${rarityStyle.border}`}
        >
          <div
            className={`absolute inset-0 rounded-lg sm:rounded-xl md:rounded-2xl pointer-events-none z-0 opacity-60 ${rarityStyle.glowSpin}`}
            aria-hidden
          />
          <div
            className={`absolute inset-0 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-b ${rarityStyle.glowTop} pointer-events-none z-0`}
            aria-hidden
          />

          <div className="relative flex h-full flex-col">
            <div className="relative flex aspect-square items-center justify-center px-3 py-4 sm:px-4 sm:py-5">
              {/* Аватар: вложенный квадрат (внешний вписан, внутренний 100% — строго 1:1); рамка: 1:1.2 */}
              {isCircleCrop ? (
                <div className="relative aspect-square h-full w-full max-h-[72%] max-w-[72%] shrink-0">
                  <div className="relative h-0 w-full pb-[100%] flex-shrink-0">
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ borderRadius: "50%" }}
                    >
                      <div
                        className="absolute -inset-0.5 bg-gradient-to-r from-[var(--primary)] via-[var(--chart-1)] to-[var(--chart-2)] opacity-75 group-hover/card:opacity-100 blur-sm transition-all duration-500"
                        style={{ borderRadius: "50%" }}
                      />
                      <div
                        className="absolute inset-0 overflow-hidden"
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
                            className={`object-cover ${isImageLoading ? "opacity-0" : "opacity-100"}`}
                            style={{ borderRadius: "50%", objectFit: "cover" }}
                            onLoad={() => setIsImageLoading(false)}
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)]">
                            <ImageIcon className="w-8 h-8 text-white/80" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`absolute top-0 left-1/2 -translate-x-1/2 z-10 inline-flex px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${RARITY_CARD_BADGE[rarity]}`}
                  >
                    {rarityStyle.label}
                  </span>
                  {isEquipped && (
                    <span className="absolute -bottom-0.5 -left-0.5 inline-flex items-center rounded bg-emerald-500/90 text-white text-[8px] sm:text-[10px] font-semibold px-1 py-0.5">
                      <Check className="w-2 h-2 sm:w-3 sm:h-3" />
                    </span>
                  )}
                  {onlyWithSubscription && discountPercent > 0 && (
                    <span className="absolute top-0.5 left-0.5 sm:top-1.5 sm:left-1.5 inline-flex items-center rounded bg-blue-500 text-white text-[8px] sm:text-[10px] font-semibold px-1 py-0.5 sm:px-2 shadow-sm">
                      −{discountPercent}%
                    </span>
                  )}
                  {soldOut && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 inline-flex items-center gap-0.5 rounded bg-rose-500/95 text-white text-[8px] sm:text-xs font-semibold px-1 py-0.5 sm:px-2 whitespace-nowrap">
                      <PackageX className="w-2 h-2 sm:w-3 sm:h-3" />
                      Распродано
                    </span>
                  )}
                  {isOwned && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 rounded bg-emerald-500/95 text-white text-[8px] sm:text-xs font-semibold px-1.5 py-0.5 whitespace-nowrap shadow-sm z-[2]">
                      Уже куплено
                    </span>
                  )}
                </div>
              ) : (
                <div className="relative h-full w-full max-h-[82%] max-w-[82%] shrink-0">
                  <div className="relative h-0 w-full pb-[120%]">
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        className="relative w-[83%] aspect-square rounded-full overflow-hidden bg-[var(--primary)] flex items-center justify-center text-white font-semibold"
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
                          <span className="text-lg sm:text-2xl md:text-3xl select-none">
                            {avatarPreviewLetter}
                          </span>
                        )}
                      </div>
                    </div>
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
                        className={`object-contain ${isImageLoading ? "opacity-0" : "opacity-100"}`}
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
                    className={`absolute top-0 left-1/2 -translate-x-1/2 z-10 inline-flex px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${RARITY_CARD_BADGE[rarity]}`}
                  >
                    {rarityStyle.label}
                  </span>
                  {isEquipped && (
                    <span className="absolute -bottom-0.5 -left-0.5 inline-flex items-center rounded bg-emerald-500/90 text-white text-[8px] sm:text-[10px] font-semibold px-1 py-0.5">
                      <Check className="w-2 h-2 sm:w-3 sm:h-3" />
                    </span>
                  )}
                  {onlyWithSubscription && discountPercent > 0 && (
                    <span className="absolute top-0.5 left-0.5 sm:top-1.5 sm:left-1.5 inline-flex items-center rounded bg-blue-500 text-white text-[8px] sm:text-[10px] font-semibold px-1 py-0.5 sm:px-2 shadow-sm">
                      −{discountPercent}%
                    </span>
                  )}
                  {soldOut && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 inline-flex items-center gap-0.5 rounded bg-rose-500/95 text-white text-[8px] sm:text-xs font-semibold px-1 py-0.5 sm:px-2 whitespace-nowrap">
                      <PackageX className="w-2 h-2 sm:w-3 sm:h-3" />
                      Распродано
                    </span>
                  )}
                  {isOwned && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 rounded bg-emerald-500/95 text-white text-[8px] sm:text-xs font-semibold px-1.5 py-0.5 whitespace-nowrap shadow-sm z-[2]">
                      Уже куплено
                    </span>
                  )}
                </div>
                </div>
              )}
            </div>

            <div className="w-full border-t border-[var(--border)] bg-[var(--card)]/90 px-2 py-2 sm:px-2.5 sm:py-2.5 flex flex-col gap-0.5 rounded-b-lg sm:rounded-b-xl md:rounded-b-2xl">
              <h3
                className="font-semibold text-[10px] sm:text-xs leading-tight line-clamp-1 text-center text-[var(--foreground)]"
                title={decoration.name}
              >
                {decoration.name}
              </h3>
              <div className="text-center">
                {renderAuthorSummary("compact")}
              </div>
              {showStock && (
                <p className="text-[9px] sm:text-[10px] text-[var(--muted-foreground)] text-center">
                  {decoration.stock! <= 0
                    ? "Нет в наличии"
                    : decoration.stock! <= 3
                      ? "Осталось мало"
                      : `Осталось: ${decoration.stock}`}
                </p>
              )}
              {!hidePurchase && (
                <div className="flex flex-col items-center gap-0.5 text-center">
                  {onlyWithSubscription && subscriptionPrice != null ? (
                    <>
                      <span className="inline-flex items-center gap-0.5 text-[var(--foreground)] font-semibold text-[10px] sm:text-xs">
                        <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                        {formatPrice(subscriptionPrice)}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        <Crown className="w-2.5 h-2.5 shrink-0" />
                        Только с подпиской
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-0.5 text-[var(--foreground)] font-semibold text-[10px] sm:text-xs">
                        <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                        {formatPrice(decoration.price)}
                      </span>
                      {subscriptionPrice != null && subscriptionPrice < decoration.price && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-[var(--muted-foreground)]">
                          <Crown className="w-2.5 h-2.5 shrink-0" />
                          {formatPrice(subscriptionPrice)} с подпиской
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </article>
      </>
    );
  }

  const renderImageBlock = (aspectClass: string, largeBadges = false) => {
    const badgeCl = largeBadges
      ? "px-2.5 py-1 rounded-lg text-xs font-semibold"
      : "px-2 py-0.5 rounded-lg text-[10px] font-semibold";
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
            className={`${displayType === "card" ? "object-contain" : "object-cover"} object-center transition-transform duration-300 group-hover/card:scale-105 ${
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent pointer-events-none" />
        <span
          className={`absolute top-2 left-1/2 -translate-x-1/2 z-10 inline-flex items-center border whitespace-nowrap opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none ${badgeCl} ${rarityStyle.badge}`}
        >
          {rarityStyle.label}
        </span>
        <div
          className={`absolute top-2 left-2 right-2 flex flex-wrap items-center ${largeBadges ? "gap-2" : "gap-1.5"}`}
        >
          {isEquipped && (
            <span
              className={`inline-flex items-center gap-1 ${badgeCl} bg-emerald-500/90 text-white`}
            >
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
            <span
              className={`inline-flex items-center gap-1 ${badgeCl} bg-emerald-500/95 text-white shadow-sm`}
            >
              Уже куплено
            </span>
          )}
        </div>
        {showStock && (
          <div className="absolute bottom-2 left-2 right-2 flex justify-start">
            <span
              className={`inline-flex items-center ${badgeCl} bg-black/50 backdrop-blur-sm text-white border-0`}
            >
              {decoration.stock! <= 0
                ? "Нет в наличии"
                : decoration.stock! <= 3
                  ? "Осталось мало"
                  : `Осталось: ${decoration.stock}`}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderContentBlock = (
    compactActions = false,
    contentSize: "normal" | "large" = "normal",
  ) => {
    const isLarge = contentSize === "large";
    return (
      <div className={`flex flex-col ${isLarge ? "p-4 sm:p-5 gap-2.5" : "p-2.5 sm:p-3 gap-2"}`}>
        <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--foreground)]">
                {TYPE_META[displayType].shortLabel}
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {TYPE_META[displayType].previewHint}
              </span>
            </div>
          <h3
            className={`font-semibold leading-tight ${isLarge ? "text-base sm:text-lg line-clamp-2" : "text-xs sm:text-sm line-clamp-1"} text-[var(--foreground)]`}
            title={decoration.name}
          >
            {decoration.name}
          </h3>
{decoration.description && (
                <p
                  className={`text-[var(--muted-foreground)] ${isLarge ? "text-xs sm:text-sm line-clamp-2" : "text-[11px] sm:text-xs line-clamp-1"}`}
                  title={decoration.description}
                >
                  {decoration.description}
                </p>
              )}
              {renderAuthorSummary("compact")}
          {showStock && (
            <p className={`${isLarge ? "text-xs" : "text-[11px]"} text-[var(--muted-foreground)]`}>
              {decoration.stock! <= 0
                ? "Нет в наличии"
                : decoration.stock! <= 3
                  ? "Осталось мало"
                  : `Осталось: ${decoration.stock}`}
            </p>
          )}
        </div>
        {compactActions ? (
          <div
            className={`flex flex-wrap items-center justify-center ${isLarge ? "gap-2 sm:gap-3 min-h-[2.25rem]" : "gap-1.5 sm:gap-2 min-h-[2rem]"}`}
          >
            {!hidePurchase && !isOwned ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg bg-[var(--secondary)] border border-[var(--border)] font-medium text-[var(--foreground)] shrink-0 ${isLarge ? "px-2.5 py-1.5 text-xs sm:text-sm" : "px-2 py-1.5 text-xs"}`}
              >
                <Coins
                  className={isLarge ? "w-4 h-4 text-amber-500" : "w-3.5 h-3.5 text-amber-500"}
                />
                {formatPrice(decoration.price)}
              </span>
            ) : !hidePurchase && isOwned ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg font-medium invisible shrink-0 ${isLarge ? "px-2.5 py-1.5 text-xs sm:text-sm" : "px-2 py-1.5 text-xs"}`}
                aria-hidden
              >
                <Coins
                  className={isLarge ? "w-4 h-4 text-amber-500" : "w-3.5 h-3.5 text-amber-500"}
                />
                {formatPrice(decoration.price)}
              </span>
            ) : null}
            {renderAction(true, isLarge ? "medium" : "small", true)}
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
              {formatPrice(decoration.price)}
            </span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handlePurchase();
              }}
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
          renderAction(false, "small", true)
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
          ref={cardRef}
          onClick={handleCardClick}
          className={`group/card relative w-full max-w-full min-w-[140px] sm:min-w-[160px] self-start overflow-hidden rounded-xl sm:rounded-2xl border-2 bg-[var(--card)] shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${rarityStyle.border}`}
        >
          <div
            className={`absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none z-0 opacity-60 ${rarityStyle.glowSpin}`}
            aria-hidden
          />
          <div
            className={`absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-b ${rarityStyle.glowTop} pointer-events-none z-0`}
            aria-hidden
          />
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
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/70 via-transparent to-transparent pointer-events-none" />
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-[10px] font-medium text-white/90">
              Фон профиля
            </span>
            {showStock && (
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] font-medium text-white/90">
                {decoration.stock! <= 0
                  ? "Нет в наличии"
                  : decoration.stock! <= 3
                    ? "Осталось мало"
                    : `Осталось: ${decoration.stock}`}
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
              <h3
                className="font-semibold text-xs sm:text-sm leading-tight line-clamp-1 text-[var(--foreground)]"
                title={decoration.name}
              >
                {decoration.name}
              </h3>
              {decoration.description && (
                <p
                  className="text-[11px] sm:text-xs text-[var(--muted-foreground)] line-clamp-1"
                  title={decoration.description}
                >
                  {decoration.description}
                </p>
              )}
              {renderAuthorSummary("compact")}
              {showStock && (
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  {decoration.stock! <= 0
                    ? "Нет в наличии"
                    : decoration.stock! <= 3
                      ? "Осталось мало"
                      : `Осталось: ${decoration.stock}`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 min-h-[2rem]">
              {!hidePurchase && !isOwned ? (
                <span className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)] shrink-0">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  {formatPrice(decoration.price)}
                </span>
              ) : !hidePurchase && isOwned ? (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium invisible shrink-0"
                  aria-hidden
                >
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  {formatPrice(decoration.price)}
                </span>
              ) : null}
              {renderAction(true, "small", true)}
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
          ref={cardRef}
          onClick={handleCardClick}
          className={`group/card relative w-full max-w-full sm:max-w-[180px] md:max-w-[200px] lg:max-w-[200px] xl:max-w-[220px] min-w-[140px] sm:min-w-[160px] rounded-xl sm:rounded-2xl border-2 bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-lg cursor-pointer ${rarityStyle.border}`}
        >
          <div
            className={`absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none z-0 opacity-60 ${rarityStyle.glowSpin}`}
            aria-hidden
          />
          <div
            className={`absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-b ${rarityStyle.glowTop} pointer-events-none z-0`}
            aria-hidden
          />
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
        ref={cardRef}
        onClick={handleCardClick}
        className={`group/card relative w-full max-w-full sm:max-w-[200px] lg:max-w-[220px] min-w-[140px] sm:min-w-[160px] rounded-xl sm:rounded-2xl border-2 bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-lg cursor-pointer ${rarityStyle.border}`}
      >
        <div
          className={`absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none z-0 opacity-60 ${rarityStyle.glowSpin}`}
          aria-hidden
        />
        <div
          className={`absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-b ${rarityStyle.glowTop} pointer-events-none z-0`}
          aria-hidden
        />
        {renderImageBlock("relative aspect-[9/16]")}
        {renderContentBlock()}
      </article>
    </>
  );
}
