"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Crown, Medal, Award, Clock, Star, TrendingUp, Flame } from "lucide-react";
import { LeaderboardUser, LeaderboardCategory, DecorationRarity } from "@/store/api/leaderboardApi";
import { getCoverUrls } from "@/lib/asset-url";
import { getRankDisplay } from "@/lib/rank-utils";
import { getDecorationImageUrl, getEquippedFrameUrl, getEquippedBackgroundUrl, getEquippedAvatarDecorationUrl } from "@/api/shop";
import { EquippedDecorations } from "@/types/user";

const DEFAULT_AVATAR = "/logo/ring_logo.png";

interface LeaderCardProps {
  user: LeaderboardUser;
  rank: number;
  category: LeaderboardCategory;
  variant?: "default" | "top3";
  isCurrentUser?: boolean;
  showAnimation?: boolean;
  animationDelay?: number;
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

function getBackgroundUrl(equipped: LeaderboardUser["equippedDecorations"]): string | null {
  if (!equipped) return null;
  
  const fromHelper = getEquippedBackgroundUrl(equipped as EquippedDecorations);
  if (fromHelper) return fromHelper;
  
  return resolveDecorationValue(equipped.background);
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
        glowClass: "shadow-[0_0_20px_rgba(251,191,36,0.5)] hover:shadow-[0_0_30px_rgba(251,191,36,0.7)]",
        gradientClass: "from-amber-400/40 via-yellow-500/30 to-orange-400/40",
        badgeClass: "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950",
        animationClass: "animate-pulse",
      };
    case "epic":
      return {
        borderClass: "border-purple-500",
        glowClass: "shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]",
        gradientClass: "from-purple-500/30 via-violet-500/20 to-fuchsia-500/30",
        badgeClass: "bg-gradient-to-r from-purple-500 to-violet-500 text-white",
        animationClass: "",
      };
    case "rare":
      return {
        borderClass: "border-blue-500",
        glowClass: "shadow-[0_0_12px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]",
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
      const readingTime = formatReadingTime(user.readingTimeMinutes ?? user.readingTime ?? chapters * 2);
      return `${chapters} глав · ${readingTime}`;
    case "readingTime":
      return formatReadingTime(user.readingTimeMinutes ?? user.readingTime ?? (user.chaptersRead ?? 0) * 2);
    case "ratings":
      return `${user.ratingsCount ?? 0} оценок`;
    case "comments":
      return `${user.commentsCount ?? 0} комментариев`;
    case "streak":
      const streak = user.currentStreak ?? 0;
      const days = streak === 1 ? "день" : streak < 5 ? "дня" : "дней";
      return `${streak} ${days} 🔥`;
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
    default:
      return null;
  }
}

function Top3Card({ user, rank, category, isCurrentUser, showAnimation, animationDelay = 0 }: Omit<LeaderCardProps, "variant">) {
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
    : (avatarDecorationUrl && !avatarDecorationError ? avatarDecorationUrl : baseAvatarUrl);
  const level = user.level ?? 0;
  const frameUrl = getFrameUrl(user.equippedDecorations);
  const cardUrl = getCardUrl(user.equippedDecorations);
  const secondaryValue = getSecondaryValue(user, category);
  
  const cardRarity = user.equippedDecorations?.cardRarity;
  const frameRarity = user.equippedDecorations?.frameRarity;
  const rarityStyles = getRarityStyles(cardRarity || frameRarity);

  const avatarSize = rank === 1 ? "w-28 h-28" : "w-20 h-20";
  const avatarPixels = rank === 1 ? 112 : 80;
  const cardPadding = rank === 1 ? "p-8" : "p-5";
  const iconSize = rank === 1 ? "w-8 h-8" : "w-6 h-6";
  const badgeSize = rank === 1 ? "w-14 h-14" : "w-10 h-10";

  const showCard = cardUrl && !cardError;
  const showFrame = frameUrl && !frameError;
  const hasRarityEffect = Boolean(cardRarity && cardRarity !== "common");
  const rarityAnimationClass = cardRarity === "legendary" ? "rarity-legendary" 
    : cardRarity === "epic" ? "rarity-epic" 
    : cardRarity === "rare" ? "rarity-rare" 
    : "";

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
        relative flex flex-col items-center justify-end text-center rounded-2xl border-2
        transition-all duration-300 hover:scale-[1.03]
        bg-[var(--card)] ${hasRarityEffect ? rarityStyles.borderClass : styles.cardBorder} 
        ${hasRarityEffect ? rarityAnimationClass : styles.glow}
        overflow-hidden group
        ${isCurrentUser ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)]" : ""}
        ${showAnimation ? (isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4") : ""}
      `}
      style={{ 
        aspectRatio: "9 / 16",
        ...(showAnimation ? { transitionDelay: `${animationDelay}ms` } : {})
      }}
    >
      {/* Rarity glow effect overlay */}
      {hasRarityEffect && (
        <div className={`absolute inset-0 pointer-events-none z-0 bg-gradient-to-b ${rarityStyles.gradientClass} ${rarityStyles.animationClass}`} />
      )}
      
      {/* Legendary sparkle effects */}
      {cardRarity === "legendary" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
          <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-amber-300 rounded-full animate-ping" style={{ animationDuration: "1.5s" }} />
          <div className="absolute top-[30%] right-[15%] w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
          <div className="absolute top-[50%] left-[10%] w-1 h-1 bg-orange-300 rounded-full animate-ping" style={{ animationDuration: "1.8s", animationDelay: "1s" }} />
          <div className="absolute top-[70%] right-[25%] w-1 h-1 bg-amber-400 rounded-full animate-ping" style={{ animationDuration: "2.2s", animationDelay: "0.3s" }} />
        </div>
      )}
      
      {/* Epic shimmer effect */}
      {cardRarity === "epic" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent animate-shimmer" 
               style={{ 
                 backgroundSize: "200% 100%",
                 animation: "shimmer 3s ease-in-out infinite"
               }} 
          />
        </div>
      )}
      
      {rank === 1 && !hasRarityEffect && (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden z-30 transition-opacity duration-300 ${showCard ? "group-hover:opacity-0" : ""}`}>
          <div className="absolute top-0 left-1/4 w-1 h-8 bg-yellow-400/40 blur-sm animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="absolute top-2 right-1/3 w-1 h-6 bg-yellow-400/30 blur-sm animate-pulse" style={{ animationDelay: "200ms" }} />
          <div className="absolute top-4 left-1/2 w-1.5 h-10 bg-yellow-400/50 blur-sm animate-pulse" style={{ animationDelay: "400ms" }} />
          <div className="absolute top-1 right-1/4 w-1 h-7 bg-amber-400/40 blur-sm animate-pulse" style={{ animationDelay: "600ms" }} />
        </div>
      )}
      
      {showCard ? (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-100 transition-opacity duration-300"
          style={{ backgroundImage: `url(${cardUrl})` }}
        >
          <img 
            src={cardUrl} 
            alt="" 
            className="hidden" 
            onError={() => setCardError(true)}
          />
        </div>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-b ${hasRarityEffect ? rarityStyles.gradientClass : styles.gradient} pointer-events-none`} />
      )}

      <div
        className={`
          absolute -top-1 -right-1 ${badgeSize} rounded-xl flex items-center justify-center
          ${styles.bg} ${styles.text} shadow-lg z-20 border-2 border-white/20
          transition-opacity duration-300
          ${showCard ? "group-hover:opacity-0" : ""}
          ${rank === 1 ? "animate-bounce" : ""}
        `}
        style={rank === 1 ? { animationDuration: "2s" } : undefined}
      >
        <RankIcon className={iconSize} />
      </div>

      {isCurrentUser && (
        <div className={`absolute top-2 left-2 z-20 px-2 py-1 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium transition-opacity duration-300 ${showCard ? "group-hover:opacity-0" : ""}`}>
          Вы
        </div>
      )}

      <div className={`relative z-10 mb-4 transition-opacity duration-300 ${showCard ? "group-hover:opacity-0" : ""}`}>
        <div className="relative">
          <img
            src={avatarUrl}
            alt={user.username}
            className={`
              ${avatarSize} rounded-full object-cover border-4 ${styles.cardBorder}
              shadow-xl group-hover:shadow-2xl transition-shadow bg-[var(--secondary)]
              ${rank === 1 ? "ring-4 ring-yellow-400/30" : ""}
            `}
            onError={() => {
              if (avatarDecorationUrl && !avatarDecorationError) {
                setAvatarDecorationError(true);
              } else {
                setAvatarError(true);
              }
            }}
          />
          {showFrame && (
            <img
              src={frameUrl}
              alt=""
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none object-contain z-10"
              style={{ 
                width: avatarPixels * 1.2, 
                height: avatarPixels * 1.2,
                maxWidth: "none",
                maxHeight: "none",
              }}
              onError={() => setFrameError(true)}
              aria-hidden
            />
          )}
        </div>
      </div>

      <div className={`relative z-10 w-full px-3 py-3 rounded-b-xl bg-gradient-to-t from-black/70 via-black/50 to-transparent transition-opacity duration-300 ${showCard ? "group-hover:opacity-0" : ""}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <p className={`font-bold text-white truncate max-w-[150px] drop-shadow-md ${rank === 1 ? "text-xl" : "text-lg"}`}>
            {user.username}
          </p>
          {user.role && user.role !== "user" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white capitalize font-medium">
              {user.role}
            </span>
          )}
        </div>

        <div className="flex justify-center mb-3">
          <span className="text-xs px-3 py-1.5 rounded-full font-semibold bg-white/20 text-white border border-white/30">
            {getRankDisplay(level).split("  ")[0]}
          </span>
        </div>

        <div className={`
          flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
          ${styles.bg} ${styles.text}
        `}>
          <CategoryIcon className="w-4 h-4" />
          <span className="font-bold text-sm">
            {getCategoryValue(user, category)}
          </span>
        </div>

        {secondaryValue && (
          <p className="mt-2 text-xs text-white/70">
            {secondaryValue}
          </p>
        )}
      </div>

      {showCard && (
        <div className="absolute bottom-0 left-0 right-0 z-20 px-3 py-3 rounded-b-xl bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className={`font-bold text-white text-center truncate drop-shadow-md ${rank === 1 ? "text-xl" : "text-lg"}`}>
            {user.username}
          </p>
        </div>
      )}
    </Link>
  );
}

function DefaultCard({ user, rank, category, isCurrentUser, showAnimation, animationDelay = 0 }: Omit<LeaderCardProps, "variant">) {
  const [isHovered, setIsHovered] = useState(false);
  const [frameError, setFrameError] = useState(false);
  const [cardError, setCardError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarDecorationError, setAvatarDecorationError] = useState(false);
  const [isVisible, setIsVisible] = useState(!showAnimation);
  
  const CategoryIcon = getCategoryIcon(category);
  const avatarDecorationUrl = getAvatarDecorationUrl(user.equippedDecorations);
  const baseAvatarUrl = user.avatar ? normalizeAvatarUrl(user.avatar) : DEFAULT_AVATAR;
  const avatarUrl = avatarError 
    ? DEFAULT_AVATAR 
    : (avatarDecorationUrl && !avatarDecorationError ? avatarDecorationUrl : baseAvatarUrl);
  const level = user.level ?? 0;
  const frameUrl = getFrameUrl(user.equippedDecorations);
  const cardUrl = getCardUrl(user.equippedDecorations);
  const secondaryValue = getSecondaryValue(user, category);
  
  const cardRarity = user.equippedDecorations?.cardRarity;
  const frameRarity = user.equippedDecorations?.frameRarity;
  const rarityStyles = getRarityStyles(cardRarity || frameRarity);
  const hasRarityEffect = Boolean((cardRarity || frameRarity) && (cardRarity !== "common" && frameRarity !== "common"));
  const rarityAnimationClass = cardRarity === "legendary" || frameRarity === "legendary" ? "rarity-legendary" 
    : cardRarity === "epic" || frameRarity === "epic" ? "rarity-epic" 
    : cardRarity === "rare" || frameRarity === "rare" ? "rarity-rare" 
    : "";

  const showFrame = frameUrl && !frameError;
  const showCard = cardUrl && !cardError;

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setIsVisible(true), animationDelay);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [showAnimation, animationDelay]);

  const isTopTen = rank <= 10;

  return (
    <Link
      href={`/user/${user._id}`}
      className={`
        relative flex items-center gap-4 rounded-xl border-2 p-4 transition-all duration-200
        hover:scale-[1.01]
        bg-[var(--card)] ${hasRarityEffect ? rarityStyles.borderClass : "border-[var(--border)]"} 
        ${hasRarityEffect ? rarityAnimationClass : "hover:shadow-md hover:border-[var(--primary)]/50"}
        ${isCurrentUser ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)] border-[var(--primary)]/30" : ""}
        ${showAnimation ? (isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2") : ""}
        overflow-hidden
      `}
      style={showAnimation ? { transitionDelay: `${animationDelay}ms` } : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Rarity background gradient for DefaultCard */}
      {hasRarityEffect && (
        <div className={`absolute inset-0 pointer-events-none bg-gradient-to-r ${rarityStyles.gradientClass} opacity-30`} />
      )}
      
      <div className={`
        flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm
        border-2 relative z-10
        ${hasRarityEffect 
          ? `${rarityStyles.badgeClass} border-transparent`
          : isTopTen 
            ? "bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]" 
            : "bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]"
        }
      `}>
        #{rank}
      </div>

      <div className="flex-shrink-0 relative z-10">
        <img
          src={avatarUrl}
          alt={user.username}
          className={`
            w-12 h-12 rounded-full object-cover border-2 bg-[var(--secondary)]
            ${isCurrentUser ? "border-[var(--primary)]" : hasRarityEffect ? rarityStyles.borderClass : "border-[var(--border)]"}
          `}
          onError={() => {
            if (avatarDecorationUrl && !avatarDecorationError) {
              setAvatarDecorationError(true);
            } else {
              setAvatarError(true);
            }
          }}
        />
        {showFrame && (
          <img
            src={frameUrl}
            alt=""
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none object-contain z-10"
            style={{ 
              width: 48 * 1.75, 
              height: 48 * 1.75,
              maxWidth: "none",
              maxHeight: "none",
            }}
            onError={() => setFrameError(true)}
            aria-hidden
          />
        )}
        {isCurrentUser && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold flex items-center justify-center border-2 border-[var(--background)]">
            Я
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2">
          <p className={`font-semibold truncate ${isCurrentUser ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
            {user.username}
          </p>
          {user.role && user.role !== "user" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] font-medium capitalize">
              {user.role}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-2 py-1 rounded-full font-medium bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]">
            {getRankDisplay(level).split("  ")[0]}
          </span>
          {secondaryValue && (
            <span className="text-xs text-[var(--muted-foreground)] hidden sm:inline">
              {secondaryValue}
            </span>
          )}
        </div>
      </div>

      <div className={`
        flex items-center gap-2 text-right px-3 py-2 rounded-lg relative z-10
        ${hasRarityEffect
          ? `${rarityStyles.badgeClass}`
          : isTopTen 
            ? "bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/5 border border-[var(--primary)]/20" 
            : "bg-[var(--secondary)]"
        }
      `}>
        <CategoryIcon className={`w-4 h-4 ${hasRarityEffect ? "" : isTopTen ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`} />
        <span className={`font-bold whitespace-nowrap ${hasRarityEffect ? "" : isTopTen ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
          {getCategoryValue(user, category)}
        </span>
      </div>

      {showCard && isHovered && (
        <div 
          className="
            absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+8px)]
            w-32 h-44 rounded-xl overflow-hidden shadow-2xl border-2 border-[var(--border)]
            z-50 animate-fade-in pointer-events-none
            hidden md:block
          "
        >
          <img
            src={cardUrl}
            alt={`Карточка ${user.username}`}
            className="w-full h-full object-cover"
            onError={() => setCardError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium truncate">
            {user.username}
          </div>
        </div>
      )}
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
    />
  );
}
