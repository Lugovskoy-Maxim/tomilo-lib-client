"use client";

import { Crown, Clock, Star, MessageSquare, Flame, BookOpen, Trophy } from "lucide-react";
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
};

const CATEGORY_SHORT_LABELS: Record<LeaderboardCategory, string> = {
  level: "по уровню",
  readingTime: "по чтению",
  ratings: "по оценкам",
  comments: "по комментам",
  streak: "по страйку",
  chaptersRead: "по главам",
};

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  all: "всё время",
  month: "месяц",
};

interface LeaderTop10BadgeProps {
  userId: string | undefined;
}

interface LeaderTop10BadgeContentProps {
  badge: Top10BadgeInfo;
}

export function LeaderTop10BadgeContent({ badge }: LeaderTop10BadgeContentProps) {
  const Icon = CATEGORY_ICONS[badge.category];
  const shortLabel = CATEGORY_SHORT_LABELS[badge.category];
  const periodLabel = PERIOD_LABELS[badge.period];
  const showPeriod = badge.category === "ratings" || badge.category === "comments";

  return (
    <Link
      href="/leaders"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-all shadow-sm"
      title={`Топ ${badge.position} по категории "${badge.label}"${showPeriod ? ` (${periodLabel})` : ""}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
      <span className="font-bold">#{badge.position}</span>
      <span className="text-[var(--primary)]/70">{shortLabel}</span>
      {showPeriod && (
        <span className="text-[10px] text-[var(--primary)]/50">({periodLabel})</span>
      )}
    </Link>
  );
}

export function LeaderTop10Badge({ userId }: LeaderTop10BadgeProps) {
  const { badges, isLoading } = useTop10Badge(userId);

  if (isLoading || badges.length === 0) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1 flex-wrap">
      {badges.map((badge) => (
        <LeaderTop10BadgeContent key={`${badge.category}-${badge.period}`} badge={badge} />
      ))}
    </div>
  );
}
