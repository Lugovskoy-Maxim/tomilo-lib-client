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
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" aria-hidden />
        <h3 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
          Топ лидербордов
        </h3>
      </div>

      <Link href="/leaders" className="block">
        <div className="flex flex-wrap gap-1.5">
          {positions.map(({ category, position, label }: UserLeaderboardPosition) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <span
                key={category}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border border-[var(--border)]/70 bg-[var(--muted)]/5 text-[var(--foreground)] hover:bg-[var(--muted)]/10 transition-colors cursor-pointer"
                title={`${label}: место ${position}`}
              >
                <Icon className="w-3.5 h-3.5 text-[var(--muted-foreground)]" aria-hidden />
                <span className="tabular-nums font-semibold">#{position}</span>
                <span className="text-[var(--muted-foreground)]">{label}</span>
              </span>
            );
          })}
        </div>
      </Link>
    </div>
  );
}
