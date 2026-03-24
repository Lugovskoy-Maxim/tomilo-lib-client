"use client";

import Link from "next/link";
import { Trophy, Crown, Clock, Star, MessageSquare, Flame, BookOpen, Heart, Coins, Sparkles } from "lucide-react";
import {
  useUserLeaderboardPositions,
  UserLeaderboardPosition,
} from "@/hooks/useUserLeaderboardPositions";
import type { LeaderboardCategory } from "@/store/api/leaderboardApi";

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

interface ProfileLeaderboardBadgesProps {
  userId: string;
}

export default function ProfileLeaderboardBadges({ userId }: ProfileLeaderboardBadgesProps) {
  const { positions, hasTop10, isLoading } = useUserLeaderboardPositions(userId);

  if (isLoading || !hasTop10) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-400/5 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-amber-500/20">
          <Trophy className="w-4 h-4 text-amber-500" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--foreground)]">В Топ-10</h3>
      </div>

      <Link href="/leaders" className="block">
        <div className="flex flex-wrap gap-1.5">
          {positions.map(({ category, position, label }: UserLeaderboardPosition) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <span
                key={category}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-500/15 to-amber-400/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:from-amber-500/25 hover:to-amber-400/20 transition-colors cursor-pointer"
                title={`${label}: место ${position}`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden />
                <span className="font-bold text-amber-600 dark:text-amber-400">#{position}</span>
                <span className="text-amber-600/80 dark:text-amber-300/80">{label}</span>
              </span>
            );
          })}
        </div>
      </Link>
    </div>
  );
}
