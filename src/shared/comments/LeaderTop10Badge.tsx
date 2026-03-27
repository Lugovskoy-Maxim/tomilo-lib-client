"use client";

import { Crown, Clock, Star, MessageSquare, Flame, BookOpen, Trophy, Heart, Coins, Sparkles } from "lucide-react";
import Link from "next/link";
import type { LeaderboardCategory, LeaderboardPeriod } from "@/store/api/leaderboardApi";
import { useTop10Badge, Top10BadgeInfo } from "@/hooks/useTop10Badge";

const CATEGORY_ICONS: Record<LeaderboardCategory, typeof Trophy> = {
  level: Crown,
  readingTime: Clock,
  ratings: Star,
  comments: MessageSquare,
  streak: Flame,
  chaptersRead: BookOpen,
  likesReceived: Heart,
  developmentHelp: Sparkles,
  balance: Coins,
};

const CATEGORY_SHORT_LABELS: Record<LeaderboardCategory, string> = {
  level: "по уровню",
  readingTime: "по чтению",
  ratings: "по оценкам",
  comments: "по комментам",
  streak: "по страйку",
  chaptersRead: "по главам",
  likesReceived: "по лайкам",
  developmentHelp: "по помощи в развитии",
  balance: "по монетам",
};

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  all: "всё время",
  month: "месяц",
  week: "неделя",
};

interface LeaderTop10BadgeProps {
  userId: string | undefined;
}

interface LeaderTop10BadgeContentProps {
  badge: Top10BadgeInfo;
}

export function LeaderTop10BadgeContent({ badge }: LeaderTop10BadgeContentProps) {
  const Icon = CATEGORY_ICONS[badge.category] ?? Trophy;
  const shortLabel = CATEGORY_SHORT_LABELS[badge.category] ?? badge.label;
  const periodLabel = PERIOD_LABELS[badge.period] ?? "всё время";
  const showPeriod = badge.category === "ratings" || badge.category === "comments";

  return (
    <Link
      href="/leaders"
      className="inline-flex items-center gap-0.5 sm:gap-1.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-all shadow-sm"
      title={`Топ ${badge.position} по категории "${badge.label}"${showPeriod ? ` (${periodLabel})` : ""}`}
    >
      <Icon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden />
      <span className="font-bold">#{badge.position}</span>
      <span className="text-[var(--primary)]/70 hidden sm:inline">{shortLabel}</span>
      {showPeriod && (
        <span className="text-[9px] sm:text-[10px] text-[var(--primary)]/50 hidden sm:inline">
          ({periodLabel})
        </span>
      )}
    </Link>
  );
}

export function LeaderTop10Badge({ userId }: LeaderTop10BadgeProps) {
  const { badges, isLoading } = useTop10Badge(userId);

  if (isLoading || badges.length === 0) {
    return null;
  }

  const primaryBadge = badges[0];
  const hiddenBadgesCount = Math.max(0, badges.length - 1);

  return (
    <div className="inline-flex items-center gap-0.5 sm:gap-1 flex-wrap min-w-0 max-w-full">
      <LeaderTop10BadgeContent badge={primaryBadge} />
      {hiddenBadgesCount > 0 && (
        <Link
          href="/leaders"
          className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold bg-[var(--secondary)] text-[var(--muted-foreground)] border border-[var(--border)]/60 hover:bg-[var(--secondary)]/80 transition-colors"
          title={`Ещё ${hiddenBadgesCount} позиций в топ-10`}
        >
          +{hiddenBadgesCount}
        </Link>
      )}
    </div>
  );
}
