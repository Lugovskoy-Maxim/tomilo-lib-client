import { UserProfile } from "@/types/user";
import { ProfileBookmarksLibrary, ReadingHistorySection } from "@/widgets";

interface ProfileContentProps {
  userProfile: UserProfile;
  /** Ссылка «Вся манга» (для публичного профиля — /user/username/bookmarks) */
  allBookmarksHref?: string;
  /** Ссылка «Вся история» (для публичного профиля — /user/username/history) */
  historyHref?: string;
  /** При клике «Все тайтлы» переключить на вкладку закладок (без смены URL) */
  onShowBookmarks?: () => void;
  /** При клике «Вся история» переключить на вкладку истории (без смены URL) */
  onShowHistory?: () => void;
}

export default function ProfileContent({
  userProfile,
  allBookmarksHref,
  historyHref = "/profile",
  onShowBookmarks,
  onShowHistory,
}: ProfileContentProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-6 items-stretch max-w-4xl min-w-0">
      <ProfileBookmarksLibrary
        bookmarks={userProfile.bookmarks}
        readingHistory={userProfile.readingHistory}
        allBookmarksHref={onShowBookmarks ? undefined : (allBookmarksHref ?? "/profile/bookmarks")}
        onShowAllBookmarks={onShowBookmarks}
        maxItems={10}
      />
      <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-6 shadow-sm min-h-[240px] sm:min-h-[280px] flex flex-col">
        <ReadingHistorySection
          readingHistory={userProfile.readingHistory}
          historyHref={onShowHistory ? undefined : historyHref}
          onShowAllHistory={onShowHistory}
        />
      </div>
    </div>
  );
}
