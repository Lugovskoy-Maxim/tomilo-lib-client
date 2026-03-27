"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Crown, Medal, Award, Clock, Star, TrendingUp, Flame, Heart, Coins, Sparkles } from "lucide-react";
import { LeaderboardUser, LeaderboardCategory, DecorationRarity } from "@/store/api/leaderboardApi";
import { getCoverUrls } from "@/lib/asset-url";
import { getRankDisplay } from "@/lib/rank-utils";
import {
  getDecorationImageUrl,
  getEquippedFrameUrl,
  getEquippedAvatarDecorationUrl,
} from "@/api/shop";
import { EquippedDecorations } from "@/types/user";
import { formatLikesReceivedRu, formatCharactersAcceptedRu } from "@/lib/utils";
import { isPremiumActive } from "@/lib/premium";
import { PremiumBadge } from "@/shared/premium-badge/PremiumBadge";
import { formatUsernameDisplay } from "@/lib/username-display";

const DEFAULT_AVATAR = "/logo/ring_logo.png";

interface LeaderCardProps {
  user: LeaderboardUser;
  rank: number;
  category: LeaderboardCategory;
  variant?: "default" | "top3";
  isCurrentUser?: boolean;
  showAnimation?: boolean;
  animationDelay?: number;
  /** При клике открыть модалку вместо перехода по ссылке (переход остаётся в модалке по кнопке) */
  onClick?: () => void;
}

function normalizeAvatarUrl(avatarUrl: string): string {
  if (!avatarUrl) return DEFAULT_AVATAR;
  const normalized = getCoverUrls(avatarUrl, "").primary;
  return normalized || DEFAULT_AVATAR;
}

function isValidUrl(value: string): boolean {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");
}

function resolveDecorationValue(raw: string | object | null | undefined): string | null {
  if (raw == null) return null;

  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const imageUrl = (o.imageUrl ?? o.image_url) as string | undefined;
    if (imageUrl) {
      if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
      }
      const resolved = getDecorationImageUrl(imageUrl);
      return resolved || imageUrl;
    }
    return null;
  }

  const str = String(raw).trim();
  if (!str) return null;

  if (str.startsWith("http://") || str.startsWith("https://")) {
    return str;
  }

  if (str.startsWith("/")) {
    const resolved = getDecorationImageUrl(str);
    return resolved || str;
  }

  if (/^[a-f0-9]{24}$/i.test(str)) {
    return null;
  }

  const maybeUrl = getDecorationImageUrl(str);
  if (maybeUrl && isValidUrl(maybeUrl)) {
    return maybeUrl;
  }

  return null;
}

function getFrameUrl(equipped: LeaderboardUser["equippedDecorations"]): string | null {
  if (!equipped) return null;

  const fromHelper = getEquippedFrameUrl(equipped as EquippedDecorations);
  if (fromHelper) return fromHelper;

  return resolveDecorationValue(equipped.frame);
}

function getCardUrl(equipped: LeaderboardUser["equippedDecorations"]): string | null {
  if (!equipped?.card) return null;
  return resolveDecorationValue(equipped.card);
}

function getAvatarDecorationUrl(equipped: LeaderboardUser["equippedDecorations"]): string | null {
  if (!equipped?.avatar) return null;

  const fromHelper = getEquippedAvatarDecorationUrl(equipped as EquippedDecorations);
  if (fromHelper) return fromHelper;

  return resolveDecorationValue(equipped.avatar);
}

function getRarityStyles(rarity: DecorationRarity | null | undefined): {
  borderClass: string;
  glowClass: string;
  gradientClass: string;
  badgeClass: string;
  animationClass: string;
} {
  switch (rarity) {
    case "legendary":
      return {
        borderClass: "border-amber-400",
        glowClass:
          "shadow-[0_0_20px_rgba(251,191,36,0.5)] hover:shadow-[0_0_30px_rgba(251,191,36,0.7)]",
        gradientClass: "from-amber-400/40 via-yellow-500/30 to-orange-400/40",
        badgeClass: "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950",
        animationClass: "animate-pulse",
      };
    case "epic":
      return {
        borderClass: "border-purple-500",
        glowClass:
          "shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]",
        gradientClass: "from-purple-500/30 via-violet-500/20 to-fuchsia-500/30",
        badgeClass: "bg-gradient-to-r from-purple-500 to-violet-500 text-white",
        animationClass: "",
      };
    case "rare":
      return {
        borderClass: "border-blue-500",
        glowClass:
          "shadow-[0_0_12px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]",
        gradientClass: "from-blue-500/25 via-sky-500/15 to-cyan-500/25",
        badgeClass: "bg-gradient-to-r from-blue-500 to-sky-500 text-white",
        animationClass: "",
      };
    default:
      return {
        borderClass: "",
        glowClass: "",
        gradientClass: "",
        badgeClass: "",
        animationClass: "",
      };
  }
}

function formatReadingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`;
  } else if (minutes < 1440) {
    return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
  } else {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return `${days} д ${hours} ч`;
  }
}

function getCategoryValue(user: LeaderboardUser, category: LeaderboardCategory): string {
  switch (category) {
    case "level":
      return `Уровень ${user.level ?? 0}`;
    case "chaptersRead":
      const chapters = user.chaptersRead ?? 0;
      const readingTime = formatReadingTime(
        user.readingTimeMinutes ?? user.readingTime ?? chapters * 2,
      );
      return `${chapters} глав · ${readingTime}`;
    case "readingTime":
      return formatReadingTime(
        user.readingTimeMinutes ?? user.readingTime ?? (user.chaptersRead ?? 0) * 2,
      );
    case "ratings":
      return `${user.ratingsCount ?? 0} оценок`;
    case "comments":
      return `${user.commentsCount ?? 0} комментариев`;
    case "streak":
      const streak = user.currentStreak ?? 0;
      const days = streak === 1 ? "день" : streak < 5 ? "дня" : "дней";
      return `${streak} ${days} 🔥`;
    case "likesReceived":
      return formatLikesReceivedRu(user.likesReceivedCount ?? 0);
    case "developmentHelp":
      return formatCharactersAcceptedRu(user.charactersAcceptedCount ?? 0);
    case "balance":
      return `${(user.balance ?? 0).toLocaleString("ru")} монет`;
    default:
      return "";
  }
}

/** Короткая строка для бейджа категории на мобиле */
function getCategoryValueShort(user: LeaderboardUser, category: LeaderboardCategory): string {
  switch (category) {
    case "level":
      return `Ур. ${user.level ?? 0}`;
    case "chaptersRead":
      return `${user.chaptersRead ?? 0} гл.`;
    case "readingTime": {
      const mins = user.readingTimeMinutes ?? user.readingTime ?? (user.chaptersRead ?? 0) * 2;
      if (mins >= 1440) return `${Math.floor(mins / 1440)}д`;
      if (mins >= 60) return `${Math.floor(mins / 60)}ч`;
      return `${mins} м`;
    }
    case "ratings":
      return `${user.ratingsCount ?? 0} оц.`;
    case "comments":
      return `${user.commentsCount ?? 0} комм.`;
    case "streak":
      return `${user.currentStreak ?? 0} дн.`;
    case "likesReceived":
      return `${user.likesReceivedCount ?? 0} л.`;
    case "developmentHelp":
      return `${user.charactersAcceptedCount ?? 0} перс.`;
    case "balance":
      return `${(user.balance ?? 0).toLocaleString("ru")} мон.`;
    default:
      return "";
  }
}

function getCategoryIcon(category: LeaderboardCategory) {
  switch (category) {
    case "level":
      return TrendingUp;
    case "chaptersRead":
      return TrendingUp;
    case "readingTime":
      return Clock;
    case "ratings":
      return Star;
    case "streak":
      return Flame;
    case "likesReceived":
      return Heart;
    case "developmentHelp":
      return Sparkles;
    case "balance":
      return Coins;
    default:
      return TrendingUp;
  }
}

function getRankIcon(rank: number) {
  if (rank === 1) return Crown;
  if (rank === 2) return Medal;
  if (rank === 3) return Award;
  return null;
}

function getRankStyles(rank: number): {
  bg: string;
  border: string;
  text: string;
  glow: string;
  gradient: string;
  cardBorder: string;
} {
  if (rank === 1) {
    return {
      bg: "bg-gradient-to-br from-yellow-400 to-amber-500",
      border: "border-yellow-500",
      text: "text-yellow-950",
      glow: "shadow-lg shadow-yellow-500/40",
      gradient: "from-yellow-400/30 via-amber-400/20 to-transparent",
      cardBorder: "border-yellow-400",
    };
  }
  if (rank === 2) {
    return {
      bg: "bg-gradient-to-br from-slate-400 to-slate-500",
      border: "border-slate-400",
      text: "text-white",
      glow: "shadow-lg shadow-slate-500/40",
      gradient: "from-slate-400/30 via-slate-300/20 to-transparent",
      cardBorder: "border-slate-400",
    };
  }
  if (rank === 3) {
    return {
      bg: "bg-gradient-to-br from-amber-500 to-orange-600",
      border: "border-amber-500",
      text: "text-white",
      glow: "shadow-lg shadow-amber-500/40",
      gradient: "from-amber-500/30 via-orange-400/20 to-transparent",
      cardBorder: "border-amber-500",
    };
  }
  return {
    bg: "bg-[var(--secondary)]",
    border: "border-[var(--border)]",
    text: "text-[var(--foreground)]",
    glow: "",
    gradient: "",
    cardBorder: "border-[var(--border)]",
  };
}

function getSecondaryValue(user: LeaderboardUser, category: LeaderboardCategory): string | null {
  switch (category) {
    case "level":
      return user.experience ? `${user.experience.toLocaleString()} XP` : null;
    case "readingTime":
      return user.chaptersRead ? `${user.chaptersRead} глав` : null;
    case "ratings":
      return user.titlesReadCount ? `${user.titlesReadCount} тайтлов` : null;
    case "streak":
      return user.longestStreak ? `Рекорд: ${user.longestStreak} дн.` : null;
    case "likesReceived":
      return null;
    case "developmentHelp":
      return null;
    case "balance":
      return user.level != null ? `Ур. ${user.level}` : null;
    default:
      return null;
  }
}

function Top3Card({
  user,
  rank,
  category,
  isCurrentUser,
  showAnimation,
  animationDelay = 0,
}: Omit<LeaderCardProps, "variant">) {
  const [frameError, setFrameError] = useState(false);
  const [cardError, setCardError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarDecorationError, setAvatarDecorationError] = useState(false);
  const [isVisible, setIsVisible] = useState(!showAnimation);

  const RankIcon = getRankIcon(rank)!;
  const CategoryIcon = getCategoryIcon(category);
  const styles = getRankStyles(rank);
  const avatarDecorationUrl = getAvatarDecorationUrl(user.equippedDecorations);
  const baseAvatarUrl = user.avatar ? normalizeAvatarUrl(user.avatar) : DEFAULT_AVATAR;
  const avatarUrl = avatarError
    ? DEFAULT_AVATAR
    : avatarDecorationUrl && !avatarDecorationError
      ? avatarDecorationUrl
      : baseAvatarUrl;
  const level = user.level ?? 0;
  const frameUrl = getFrameUrl(user.equippedDecorations);
  const cardUrl = getCardUrl(user.equippedDecorations);
  const secondaryValue = getSecondaryValue(user, category);

  const cardRarity = user.equippedDecorations?.cardRarity;
  const frameRarity = user.equippedDecorations?.frameRarity;
  const rarityStyles = getRarityStyles(cardRarity || frameRarity);

  const avatarSize = rank === 1 ? "w-12 h-12 md:w-28 md:h-28" : "w-12 h-12 md:w-20 md:h-20";
  const iconSize = rank === 1 ? "w-3 h-3 md:w-8 md:h-8" : "w-2.5 h-2.5 md:w-6 md:h-6";
  const badgeSize = rank === 1 ? "w-5 h-5 md:w-14 md:h-14" : "w-4 h-4 md:w-10 md:h-10";

  const showCard = cardUrl && !cardError;
  const showFrame = frameUrl && !frameError;
  const hasRarityEffect = Boolean(cardRarity && cardRarity !== "common");
  const isPremium = isPremiumActive(user.subscriptionExpiresAt);

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setIsVisible(true), animationDelay);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [showAnimation, animationDelay]);

  return (
    <Link
      href={`/user/${user._id}`}
      className={`
        relative flex flex-col items-center justify-end text-center rounded-2xl border
        transition-all duration-200 hover:shadow-lg
        bg-[var(--card)] ${hasRarityEffect ? rarityStyles.borderClass : styles.cardBorder} 
        ${isPremium ? "border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_28px_rgba(245,158,11,0.22)]" : ""}
        overflow-hidden group
        ${isCurrentUser ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)]" : ""}
        ${showAnimation ? (isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4") : ""}
      `}
      style={{
        aspectRatio: "9 / 16",
        ...(showAnimation ? { transitionDelay: `${animationDelay}ms` } : {}),
      }}
    >
      {hasRarityEffect && (
        <div
          className={`absolute inset-0 pointer-events-none z-0 bg-gradient-to-b opacity-30 ${rarityStyles.gradientClass}`}
        />
      )}

      {showCard ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-50 transition-opacity duration-200"
          style={{ backgroundImage: `url(${cardUrl})` }}
        >
          <img src={cardUrl} alt="" className="hidden" onError={() => setCardError(true)} />
        </div>
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-b ${hasRarityEffect ? rarityStyles.gradientClass : styles.gradient} pointer-events-none opacity-90`}
        />
      )}

      {/* На md+ — бейдж места сверху справа; на мобиле уровень в одном блоке с результатом ниже */}
      <div
        className={`hidden md:flex absolute top-2 right-2 ${badgeSize} rounded-lg items-center justify-center ${styles.bg} ${styles.text} shadow z-20 border border-white/20`}
      >
        <RankIcon className={iconSize} />
      </div>

      {isCurrentUser && (
        <div className="absolute top-0.5 left-0.5 md:top-2 md:left-2 z-20 px-1 py-0.5 md:px-2 md:py-1 rounded bg-[var(--primary)] text-[var(--primary-foreground)] text-[9px] md:text-xs font-medium">
          Вы
        </div>
      )}

      <div
        className={`relative z-10 mt-2 mb-1 md:mt-0 md:mb-4 shrink-0 ${avatarSize} aspect-square`}
      >
        <div className="relative w-full h-full overflow-hidden rounded-full">
          <img
            src={avatarUrl}
            alt={formatUsernameDisplay(user.username)}
            className={`w-full h-full rounded-full object-cover aspect-square min-w-full min-h-full border-2 ${styles.cardBorder} shadow-md bg-[var(--secondary)]`}
            onError={() => {
              if (avatarDecorationUrl && !avatarDecorationError) {
                setAvatarDecorationError(true);
              } else {
                setAvatarError(true);
              }
            }}
          />
        </div>
        {showFrame && (
          <img
            src={frameUrl}
            alt=""
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[105%] h-[105%] md:w-[120%] md:h-[120%] pointer-events-none object-contain z-10"
            style={{ maxWidth: "none", maxHeight: "none" }}
            onError={() => setFrameError(true)}
            aria-hidden
          />
        )}
      </div>

      <div className="relative z-10 w-full px-2 md:px-3 py-2 md:py-3 rounded-b-xl md:rounded-b-2xl bg-gradient-to-t from-black/90 via-black/75 to-black/40 md:from-black/75 md:via-transparent md:to-transparent">
        <p
          className={`font-semibold text-white truncate max-w-[4.5rem] md:max-w-[140px] mx-auto drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${rank === 1 ? "text-xs md:text-lg" : "text-[11px] md:text-base"}`}
        >
          {formatUsernameDisplay(user.username)}
        </p>
        {user.role && user.role !== "user" && (
          <span className="text-[9px] md:text-[10px] px-1 py-0.5 md:px-1.5 md:py-0.5 rounded bg-white/20 text-white/90 capitalize mt-0.5 inline-block">
            {user.role}
          </span>
        )}
        <p className="text-[10px] md:text-xs text-white/90 mt-1 md:mt-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] hidden md:block">
          {getRankDisplay(level).split("  ")[0]}
        </p>
        <div
          className={`flex items-center justify-center gap-1 md:gap-1.5 mt-1.5 md:mt-2.5 px-2 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg ${styles.bg} ${styles.text} shadow-sm`}
        >
          <CategoryIcon className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
          <span className="font-semibold text-[10px] md:text-sm md:inline hidden">
            {getCategoryValue(user, category)}
          </span>
          <span className="font-semibold text-[10px] md:hidden">
            {getCategoryValueShort(user, category)} · Ур. {level}
          </span>
        </div>
        {secondaryValue && (
          <p className="mt-1 md:mt-1.5 text-[9px] md:text-[11px] text-white/80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] hidden md:block">
            {secondaryValue}
          </p>
        )}
      </div>
    </Link>
  );
}

function DefaultCard({
  user,
  rank,
  category,
  isCurrentUser,
  showAnimation,
  animationDelay = 0,
  onClick,
}: Omit<LeaderCardProps, "variant">) {
  const [frameError, setFrameError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarDecorationError, setAvatarDecorationError] = useState(false);
  const [isVisible, setIsVisible] = useState(!showAnimation);

  const CategoryIcon = getCategoryIcon(category);
  const avatarDecorationUrl = getAvatarDecorationUrl(user.equippedDecorations);
  const baseAvatarUrl = user.avatar ? normalizeAvatarUrl(user.avatar) : DEFAULT_AVATAR;
  const avatarUrl = avatarError
    ? DEFAULT_AVATAR
    : avatarDecorationUrl && !avatarDecorationError
      ? avatarDecorationUrl
      : baseAvatarUrl;
  const level = user.level ?? 0;
  const frameUrl = getFrameUrl(user.equippedDecorations);
  const secondaryValue = getSecondaryValue(user, category);

  const cardRarity = user.equippedDecorations?.cardRarity;
  const frameRarity = user.equippedDecorations?.frameRarity;
  const rarityStyles = getRarityStyles(cardRarity || frameRarity);
  const hasRarityEffect = Boolean(
    (cardRarity || frameRarity) && cardRarity !== "common" && frameRarity !== "common",
  );

  const showFrame = frameUrl && !frameError;

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setIsVisible(true), animationDelay);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [showAnimation, animationDelay]);

  const isTopTen = rank <= 10;
  const isPremium = isPremiumActive(user.subscriptionExpiresAt);

  const className = `
    relative flex items-center gap-3 rounded-xl border p-3 sm:p-4 transition-all duration-200
    bg-[var(--card)] hover:bg-[var(--muted)]/50 hover:border-[var(--border)]
    ${hasRarityEffect ? rarityStyles.borderClass : "border-[var(--border)]"}
    ${isPremium ? "border-amber-500/40 shadow-[0_0_18px_rgba(245,158,11,0.12)] hover:shadow-[0_0_22px_rgba(245,158,11,0.18)]" : ""}
    ${isCurrentUser ? "ring-2 ring-[var(--primary)]/50 ring-offset-2 ring-offset-[var(--background)]" : ""}
    ${showAnimation ? (isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2") : ""}
    overflow-hidden
    ${onClick ? "cursor-pointer" : ""}
  `;
  const style = showAnimation ? { transitionDelay: `${animationDelay}ms` } : undefined;

  const content = (
    <>
      {hasRarityEffect && (
        <div
          className={`absolute inset-0 pointer-events-none bg-gradient-to-r ${rarityStyles.gradientClass} opacity-20`}
        />
      )}

      <div
        className={`
          flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold relative z-10
          ${hasRarityEffect ? rarityStyles.badgeClass : isTopTen ? "bg-[var(--primary)]/15 text-[var(--primary)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}
        `}
      >
        {rank}
      </div>

      <div className="flex-shrink-0 relative z-10 w-10 h-10 sm:w-11 sm:h-11 aspect-square">
        <div className="w-full h-full overflow-hidden rounded-full">
          <img
            src={avatarUrl}
            alt={formatUsernameDisplay(user.username)}
            className={`w-full h-full rounded-full object-cover aspect-square min-w-full min-h-full border-2 bg-[var(--secondary)] ${isCurrentUser ? "border-[var(--primary)]" : hasRarityEffect ? rarityStyles.borderClass : "border-[var(--border)]"}`}
            onError={() => {
              if (avatarDecorationUrl && !avatarDecorationError) setAvatarDecorationError(true);
              else setAvatarError(true);
            }}
          />
        </div>
        {showFrame && (
          <img
            src={frameUrl}
            alt=""
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[108%] h-[108%] pointer-events-none object-contain z-10"
            style={{ maxWidth: "none", maxHeight: "none" }}
            onError={() => setFrameError(true)}
            aria-hidden
          />
        )}
        {isCurrentUser && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[9px] font-bold flex items-center justify-center border-2 border-[var(--background)]">
            Я
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 relative z-10">
        <p
          className={`font-medium truncate text-sm flex items-center gap-1 ${isPremiumActive(user.subscriptionExpiresAt) ? "text-amber-500" : isCurrentUser ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}
          title={formatUsernameDisplay(user.username)}
        >
          <span className="truncate">{formatUsernameDisplay(user.username)}</span>
          {isPremiumActive(user.subscriptionExpiresAt) && (
            <PremiumBadge size="xs" ariaLabel="Премиум-подписчик" />
          )}
        </p>
        <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
          {getRankDisplay(level).split("  ")[0]}
          {secondaryValue && <span className="hidden sm:inline"> · {secondaryValue}</span>}
        </p>
      </div>

      <div
        className={`flex items-center gap-1.5 shrink-0 px-2 py-1.5 sm:px-2.5 rounded-lg text-right relative z-10 ${hasRarityEffect ? rarityStyles.badgeClass : "bg-[var(--muted)]"}`}
      >
        <CategoryIcon className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold text-xs sm:text-sm whitespace-nowrap hidden sm:inline">
          {getCategoryValue(user, category)}
        </span>
        <span className="font-semibold text-xs whitespace-nowrap sm:hidden">
          {getCategoryValueShort(user, category)}
        </span>
      </div>
    </>
  );

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={className}
        style={style}
        onClick={onClick}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <Link href={`/user/${user._id}`} className={className} style={style}>
      {content}
    </Link>
  );
}

export default function LeaderCard({
  user,
  rank,
  category,
  variant = "default",
  isCurrentUser = false,
  showAnimation = false,
  animationDelay = 0,
  onClick,
}: LeaderCardProps) {
  if (variant === "top3" || rank <= 3) {
    return (
      <Top3Card
        user={user}
        rank={rank}
        category={category}
        isCurrentUser={isCurrentUser}
        showAnimation={showAnimation}
        animationDelay={animationDelay}
      />
    );
  }

  return (
    <DefaultCard
      user={user}
      rank={rank}
      category={category}
      isCurrentUser={isCurrentUser}
      showAnimation={showAnimation}
      animationDelay={animationDelay}
      onClick={onClick}
    />
  );
}
