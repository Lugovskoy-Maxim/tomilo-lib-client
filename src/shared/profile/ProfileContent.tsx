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
  /** Публичный просмотр чужого профиля - скрывает приватные компоненты */
  isPublicView?: boolean;
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
  isPublicView = false,
}: ProfileContentProps) {
  return (
    <div className="flex flex-col gap-4 items-stretch max-w-4xl min-w-0">
      {!isPublicView && <ProfileWelcome userProfile={userProfile} />}
      {!isPublicView && <ProfileQuickActions />}
      {!isPublicView && <ContinueReading userProfile={userProfile} />}
      {!isPublicView && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NextRankProgress userProfile={userProfile} onShowStats={onShowStats} />
          <DailyBonus userProfile={userProfile} />
        </div>
      )}

      {showAchievementsPreview && !(isPublicView && userProfile.showAchievements === false) && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Достижения
            </h3>
            <button
              type="button"
              onClick={onShowAchievements}
              className="text-xs text-[var(--primary)] hover:underline flex items-center gap-0.5"
            >
              Все
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <ProfileAchievements userProfile={userProfile} compact isPublicView={isPublicView} />
        </div>
      )}

      {hiddenBookmarksMessage ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-1">Закладки</h2>
          <p className="text-xs text-[var(--muted-foreground)]">{hiddenBookmarksMessage}</p>
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

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 min-h-[200px] flex flex-col">
        {hiddenHistoryMessage ? (
          <div className="flex flex-1 items-center justify-center text-center">
            <p className="text-xs text-[var(--muted-foreground)]">{hiddenHistoryMessage}</p>
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
