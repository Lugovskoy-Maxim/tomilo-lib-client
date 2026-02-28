"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Medal, Award, Clock, Star, TrendingUp, Flame } from "lucide-react";
import { LeaderboardUser, LeaderboardCategory } from "@/store/api/leaderboardApi";
import { getCoverUrls } from "@/lib/asset-url";
import { getRankDisplay } from "@/lib/rank-utils";
import { getDecorationImageUrl } from "@/api/shop";

const DEFAULT_AVATAR = "/logo/ring_logo.png";

interface LeaderCardProps {
  user: LeaderboardUser;
  rank: number;
  category: LeaderboardCategory;
  variant?: "default" | "top3";
}

function normalizeAvatarUrl(avatarUrl: string): string {
  if (!avatarUrl) return "";
  return getCoverUrls(avatarUrl, "").primary;
}

function isValidUrl(value: string): boolean {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");
}

function resolveDecorationUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  
  if (isValidUrl(trimmed)) {
    return getDecorationImageUrl(trimmed) || trimmed;
  }
  
  if (/^[a-f0-9]{24}$/i.test(trimmed)) {
    return null;
  }
  
  const maybeUrl = getDecorationImageUrl(trimmed);
  if (maybeUrl && isValidUrl(maybeUrl)) {
    return maybeUrl;
  }
  
  return null;
}

function getFrameUrl(equipped: LeaderboardUser["equippedDecorations"]): string | null {
  if (!equipped?.frame) return null;
  
  const frameValue = equipped.frame;
  if (typeof frameValue === "string") {
    return resolveDecorationUrl(frameValue);
  }
  
  if (typeof frameValue === "object" && frameValue !== null) {
    const obj = frameValue as Record<string, unknown>;
    const imageUrl = (obj.imageUrl ?? obj.image_url) as string | undefined;
    if (imageUrl) {
      return resolveDecorationUrl(imageUrl);
    }
  }
  
  return null;
}

function getCardUrl(equipped: LeaderboardUser["equippedDecorations"]): string | null {
  if (!equipped?.card) return null;
  
  const cardValue = equipped.card;
  if (typeof cardValue === "string") {
    return resolveDecorationUrl(cardValue);
  }
  
  if (typeof cardValue === "object" && cardValue !== null) {
    const obj = cardValue as Record<string, unknown>;
    const imageUrl = (obj.imageUrl ?? obj.image_url) as string | undefined;
    if (imageUrl) {
      return resolveDecorationUrl(imageUrl);
    }
  }
  
  return null;
}

function getBackgroundUrl(equipped: LeaderboardUser["equippedDecorations"]): string | null {
  if (!equipped?.background) return null;
  
  const bgValue = equipped.background;
  if (typeof bgValue === "string") {
    return resolveDecorationUrl(bgValue);
  }
  
  if (typeof bgValue === "object" && bgValue !== null) {
    const obj = bgValue as Record<string, unknown>;
    const imageUrl = (obj.imageUrl ?? obj.image_url) as string | undefined;
    if (imageUrl) {
      return resolveDecorationUrl(imageUrl);
    }
  }
  
  return null;
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

function Top3Card({ user, rank, category }: Omit<LeaderCardProps, "variant">) {
  const [frameError, setFrameError] = useState(false);
  const [cardError, setCardError] = useState(false);
  
  const RankIcon = getRankIcon(rank)!;
  const CategoryIcon = getCategoryIcon(category);
  const styles = getRankStyles(rank);
  const avatarUrl = user.avatar ? normalizeAvatarUrl(user.avatar) : DEFAULT_AVATAR;
  const level = user.level ?? 0;
  const frameUrl = getFrameUrl(user.equippedDecorations);
  const cardUrl = getCardUrl(user.equippedDecorations);

  const avatarSize = rank === 1 ? "w-24 h-24" : "w-20 h-20";
  const avatarPixels = rank === 1 ? 96 : 80;
  const cardPadding = rank === 1 ? "p-6" : "p-5";
  const iconSize = rank === 1 ? "w-8 h-8" : "w-6 h-6";
  const badgeSize = rank === 1 ? "w-12 h-12" : "w-10 h-10";

  const showCard = cardUrl && !cardError;
  const showFrame = frameUrl && !frameError;

  return (
    <Link
      href={`/user/${user._id}`}
      className={`
        relative flex flex-col items-center text-center rounded-2xl border-2 ${cardPadding}
        transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl
        bg-[var(--card)] ${styles.cardBorder} ${styles.glow}
        overflow-hidden group
      `}
    >
      {showCard ? (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
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
        <div className={`absolute inset-0 bg-gradient-to-b ${styles.gradient} pointer-events-none`} />
      )}

      <div
        className={`
          absolute -top-1 -right-1 ${badgeSize} rounded-xl flex items-center justify-center
          ${styles.bg} ${styles.text} shadow-lg z-20 border-2 border-white/20
        `}
      >
        <RankIcon className={iconSize} />
      </div>

      <div className="relative z-10 mb-4">
        <div className="relative">
          <img
            src={avatarUrl}
            alt={user.username}
            className={`
              ${avatarSize} rounded-full object-cover border-4 ${styles.cardBorder}
              shadow-xl group-hover:shadow-2xl transition-shadow bg-[var(--secondary)]
            `}
          />
          {showFrame && (
            <img
              src={frameUrl}
              alt=""
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none object-contain z-10"
              style={{ 
                width: avatarPixels * 1.8, 
                height: avatarPixels * 1.8,
                maxWidth: "none",
                maxHeight: "none",
              }}
              onError={() => setFrameError(true)}
              aria-hidden
            />
          )}
        </div>
      </div>

      <div className="relative z-10 w-full">
        <div className="flex items-center justify-center gap-2 mb-2">
          <p className="font-bold text-lg text-[var(--foreground)] truncate max-w-[150px]">
            {user.username}
          </p>
          {user.role && user.role !== "user" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] capitalize">
              {user.role}
            </span>
          )}
        </div>

        <div className="flex justify-center mb-3">
          <span className="text-xs px-3 py-1.5 rounded-full font-semibold bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)]">
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
      </div>
    </Link>
  );
}

function DefaultCard({ user, rank, category }: Omit<LeaderCardProps, "variant">) {
  const [isHovered, setIsHovered] = useState(false);
  const [frameError, setFrameError] = useState(false);
  const [cardError, setCardError] = useState(false);
  
  const CategoryIcon = getCategoryIcon(category);
  const avatarUrl = user.avatar ? normalizeAvatarUrl(user.avatar) : DEFAULT_AVATAR;
  const level = user.level ?? 0;
  const frameUrl = getFrameUrl(user.equippedDecorations);
  const cardUrl = getCardUrl(user.equippedDecorations);

  const showFrame = frameUrl && !frameError;
  const showCard = cardUrl && !cardError;

  return (
    <Link
      href={`/user/${user._id}`}
      className="
        relative flex items-center gap-4 rounded-xl border-2 p-4 transition-all duration-200
        hover:shadow-md hover:scale-[1.01]
        bg-[var(--card)] border-[var(--border)] hover:border-[var(--primary)]/50
      "
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="
        flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm
        border-2 bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]
      ">
        #{rank}
      </div>

      <div className="flex-shrink-0 relative">
        <img
          src={avatarUrl}
          alt={user.username}
          className="w-12 h-12 rounded-full object-cover border-2 border-[var(--border)] bg-[var(--secondary)]"
        />
        {showFrame && (
          <img
            src={frameUrl}
            alt=""
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none object-contain z-10"
            style={{ 
              width: 48 * 1.8, 
              height: 48 * 1.8,
              maxWidth: "none",
              maxHeight: "none",
            }}
            onError={() => setFrameError(true)}
            aria-hidden
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[var(--foreground)] truncate">{user.username}</p>
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
        </div>
      </div>

      <div className="flex items-center gap-2 text-right bg-[var(--secondary)] px-3 py-2 rounded-lg">
        <CategoryIcon className="w-4 h-4 text-[var(--foreground)]" />
        <span className="font-bold text-[var(--foreground)] whitespace-nowrap">
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

export default function LeaderCard({ user, rank, category, variant = "default" }: LeaderCardProps) {
  if (variant === "top3" || rank <= 3) {
    return <Top3Card user={user} rank={rank} category={category} />;
  }

  return <DefaultCard user={user} rank={rank} category={category} />;
}
