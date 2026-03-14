"use client";

import { useEffect, useRef } from "react";
import { UserProfile } from "@/types/user";
import { ProfileBookmarksLibrary, ReadingHistorySection } from "@/widgets";
import ProfileAchievements from "./ProfileAchievements";
import ContinueReading from "./ContinueReading";
import ReadingProgressBlock from "./ReadingProgressBlock";
import ProfileQuickActions from "./ProfileQuickActions";
import DailyBonus from "./DailyBonus";
import NextRankProgress from "./NextRankProgress";
import ProfileDailyQuests from "./ProfileDailyQuests";
import ProfileWelcome from "./ProfileWelcome";
import ProfileCardsShowcase from "./ProfileCardsShowcase";
import { useClaimDailyBonusMutation } from "@/store/api/authApi";
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
  /** Компактный обзор: меньше блоков, меньше элементов в списках */
  compactOverview?: boolean;
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
  compactOverview = false,
}: ProfileContentProps) {
  const [claimDailyBonus] = useClaimDailyBonusMutation();
  const dailyBonusSyncedRef = useRef(false);

  // Синхронизация квеста «Ежедневный вход» при загрузке профиля (если бонус уже получен при логине)
  useEffect(() => {
    if (isPublicView || dailyBonusSyncedRef.current) return;
    dailyBonusSyncedRef.current = true;
    claimDailyBonus()
      .unwrap()
      .catch(() => {})
      .finally(() => {});
  }, [isPublicView, claimDailyBonus]);

  const gap = compactOverview ? "gap-3" : "gap-4";
  const maxBookmarks = compactOverview ? 5 : 10;

  return (
    <div className={`flex flex-col ${gap} items-stretch w-full min-w-0`}>
      {!isPublicView && !compactOverview && <ProfileWelcome userProfile={userProfile} />}
      {!isPublicView && !compactOverview && <ProfileQuickActions />}
      {!isPublicView && <ContinueReading userProfile={userProfile} />}
      {!isPublicView && !compactOverview && <ReadingProgressBlock />}
      <ProfileCardsShowcase userProfile={userProfile} readOnly={isPublicView} />
      {!isPublicView && (
        <div className={compactOverview ? "space-y-3" : "space-y-4"}>
          <div
            className={
              compactOverview
                ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
                : "grid grid-cols-1 lg:grid-cols-2 gap-4"
            }
          >
            <NextRankProgress userProfile={userProfile} onShowStats={onShowStats} />
            <DailyBonus userProfile={userProfile} />
          </div>
          <ProfileDailyQuests maxVisible={compactOverview ? 6 : undefined} />
        </div>
      )}

      {showAchievementsPreview && !(isPublicView && userProfile.showAchievements === false) && (
        <div className={`rounded-xl border border-[var(--border)] bg-[var(--card)] ${compactOverview ? "p-3" : "p-4"}`}>
          <div className={`flex items-center justify-between ${compactOverview ? "mb-2" : "mb-3"}`}>
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
        <div className={`rounded-xl border border-[var(--border)] bg-[var(--card)] ${compactOverview ? "p-3" : "p-4 sm:p-5"}`}>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-1">Закладки</h2>
          <p className="text-xs text-[var(--muted-foreground)]">{hiddenBookmarksMessage}</p>
        </div>
      ) : (
        <ProfileBookmarksLibrary
          bookmarks={userProfile.bookmarks}
          readingHistory={userProfile.readingHistory}
          allBookmarksHref={
            onShowBookmarks ? undefined : (allBookmarksHref ?? "/profile/bookmarks")
          }
          onShowAllBookmarks={onShowBookmarks}
          maxItems={maxBookmarks}
          emptyStateMessage={bookmarksEmptyStateMessage}
        />
      )}

      <div
        className={`rounded-xl border border-[var(--border)] bg-[var(--card)] flex flex-col ${compactOverview ? "p-3" : "p-4 sm:p-5"}`}
      >
        {hiddenHistoryMessage ? (
          <div className="flex flex-1 items-center justify-center text-center py-6">
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
