"use client";

import { UserProfile } from "@/types/user";
import { ProfileBookmarksLibrary, ReadingHistorySection } from "@/widgets";
import ProfileAchievements from "./ProfileAchievements";
import ContinueReading from "./ContinueReading";
import ProfileQuickActions from "./ProfileQuickActions";
import DailyBonus from "./DailyBonus";
import NextRankProgress from "./NextRankProgress";
import ProfileWelcome from "./ProfileWelcome";
import { Trophy, ChevronRight } from "lucide-react";

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
  return (
    <div className="flex flex-col gap-4 sm:gap-6 items-stretch max-w-4xl min-w-0">
      {/* Welcome - приветствие */}
      <ProfileWelcome userProfile={userProfile} />

      {/* Quick Actions - быстрые действия */}
      <ProfileQuickActions />

      {/* Continue Reading - продолжить чтение */}
      <ContinueReading userProfile={userProfile} />

      {/* Progress & Bonus Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Next Rank Progress - прогресс до следующего ранга */}
        <NextRankProgress userProfile={userProfile} onShowStats={onShowStats} />

        {/* Daily Bonus - ежедневный бонус */}
        <DailyBonus userProfile={userProfile} />
      </div>

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
