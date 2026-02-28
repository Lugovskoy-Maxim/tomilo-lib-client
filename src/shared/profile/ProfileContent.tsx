"use client";

import { UserProfile } from "@/types/user";
import { ProfileBookmarksLibrary, ReadingHistorySection } from "@/widgets";
import ProfileAchievements from "./ProfileAchievements";
import { Trophy, ChevronRight, Activity } from "lucide-react";

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
  const totalChaptersRead = userProfile.readingHistory?.reduce(
    (t, item) => t + (item.chaptersCount ?? item.chapters?.length ?? 0), 0
  ) ?? 0;
  const totalBookmarks = userProfile.bookmarks?.length ?? 0;
  const level = userProfile.level ?? 0;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 items-stretch max-w-4xl min-w-0">
      {/* Quick stats overview */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Глав", value: totalChaptersRead.toLocaleString(), color: "from-blue-500 to-cyan-500" },
          { label: "Закладок", value: totalBookmarks.toLocaleString(), color: "from-purple-500 to-pink-500" },
          { label: "Уровень", value: level.toString(), color: "from-amber-500 to-orange-500" },
        ].map((stat) => (
          <div 
            key={stat.label}
            className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-gradient-to-br from-[var(--card)] to-[var(--secondary)]/30 border border-[var(--border)]/60"
          >
            <span className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.value}
            </span>
            <span className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Link to detailed stats */}
      <button
        type="button"
        onClick={onShowStats}
        className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[var(--primary)]/10 to-[var(--chart-1)]/10 border border-[var(--primary)]/30 hover:border-[var(--primary)]/50 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--primary)]/20">
            <Activity className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[var(--foreground)]">Подробная статистика</p>
            <p className="text-xs text-[var(--muted-foreground)]">Графики, прогресс и аналитика</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
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
