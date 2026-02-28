"use client";

import { UserProfile } from "@/types/user";
import { ProfileBookmarksLibrary, ReadingHistorySection } from "@/widgets";
import ProfileAchievements from "./ProfileAchievements";
import { Trophy, ChevronRight, Activity, Flame, Zap, TrendingUp } from "lucide-react";
import { getLevelProgress, getRankDisplay, getRankColor, levelToRank } from "@/lib/rank-utils";

interface ProfileContentProps {
  userProfile: UserProfile;
  allBookmarksHref?: string;
  historyHref?: string;
  onShowBookmarks?: () => void;
  onShowHistory?: () => void;
  onShowAchievements?: () => void;
  onShowStats?: () => void;
  hiddenBookmarksMessage?: string;
  hiddenHistoryMessage?: string;
  bookmarksEmptyStateMessage?: string;
  showAchievementsPreview?: boolean;
}

export default function ProfileContent({
  userProfile,
  allBookmarksHref,
  historyHref = "/profile",
  onShowBookmarks,
  onShowHistory,
  onShowAchievements,
  onShowStats,
  hiddenBookmarksMessage,
  hiddenHistoryMessage,
  bookmarksEmptyStateMessage,
  showAchievementsPreview = true,
}: ProfileContentProps) {
  const level = userProfile.level ?? 0;
  const experience = userProfile.experience ?? 0;
  const currentStreak = userProfile.currentStreak ?? 0;
  const { progressPercent, nextLevelExp } = getLevelProgress(level, experience);
  const rankInfo = levelToRank(level);
  const rankColor = getRankColor(rankInfo.rank);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 items-stretch max-w-4xl min-w-0">
      {/* Level & Streak compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Level progress compact */}
        <div className="rounded-xl p-4 bg-gradient-to-br from-[var(--secondary)]/50 to-[var(--secondary)]/30 border border-[var(--border)]/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--primary)]/20">
                <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Уровень {level}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]" style={{ color: rankColor }}>{getRankDisplay(level)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-500">
              <Zap className="w-3.5 h-3.5" />
              <span className="font-bold">{experience.toLocaleString()}</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, var(--primary) 0%, var(--chart-1) 100%)`
              }}
            />
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 text-right">
            {(nextLevelExp - experience).toLocaleString()} XP до уровня {level + 1}
          </p>
        </div>

        {/* Streak compact */}
        <div className="rounded-xl p-4 bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/20">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Серия активности</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">Читайте каждый день</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-500">{currentStreak}</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                {currentStreak === 1 ? "день" : currentStreak < 5 ? "дня" : "дней"}
              </p>
            </div>
          </div>
          {currentStreak > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (currentStreak / 30) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-[var(--muted-foreground)]">30</span>
            </div>
          )}
        </div>
      </div>

      {/* Link to detailed stats */}
      <button
        type="button"
        onClick={onShowStats}
        className="group flex items-center justify-between p-3 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]/60 hover:border-[var(--primary)]/30 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--primary)]/10">
            <Activity className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <span className="text-sm text-[var(--foreground)]">Подробная статистика</span>
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
      </button>

      {/* Achievements preview */}
      {showAchievementsPreview && (
        <div className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-[var(--card)]/90 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Достижения</h3>
            </div>
            <button
              type="button"
              onClick={onShowAchievements}
              className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              Все достижения
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <ProfileAchievements userProfile={userProfile} compact />
        </div>
      )}

      {/* Bookmarks */}
      {hiddenBookmarksMessage ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[var(--foreground)] mb-2">Закладки</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{hiddenBookmarksMessage}</p>
        </div>
      ) : (
        <ProfileBookmarksLibrary
          bookmarks={userProfile.bookmarks}
          readingHistory={userProfile.readingHistory}
          allBookmarksHref={onShowBookmarks ? undefined : (allBookmarksHref ?? "/profile/bookmarks")}
          onShowAllBookmarks={onShowBookmarks}
          maxItems={10}
          emptyStateMessage={bookmarksEmptyStateMessage}
        />
      )}

      {/* Reading history */}
      <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-6 shadow-sm min-h-[240px] sm:min-h-[280px] flex flex-col">
        {hiddenHistoryMessage ? (
          <div className="flex flex-1 items-center justify-center text-center px-2">
            <p className="text-sm text-[var(--muted-foreground)]">{hiddenHistoryMessage}</p>
          </div>
        ) : (
          <ReadingHistorySection
            readingHistory={userProfile.readingHistory}
            historyHref={onShowHistory ? undefined : historyHref}
            onShowAllHistory={onShowHistory}
          />
        )}
      </div>
    </div>
  );
}
