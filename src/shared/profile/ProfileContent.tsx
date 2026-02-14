import { UserProfile } from "@/types/user";
import { ProfileBookmarksLibrary, ReadingHistorySection } from "@/widgets";

interface ProfileContentProps {
  userProfile: UserProfile;
  /** Ссылка «Вся манга» (для публичного профиля — /user/username/bookmarks) */
  allBookmarksHref?: string;
  /** Ссылка «Вся история» (для публичного профиля — /user/username/history) */
  historyHref?: string;
}

export default function ProfileContent({ userProfile, allBookmarksHref, historyHref = "/profile/history" }: ProfileContentProps) {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 items-stretch max-w-4xl">
      <ProfileBookmarksLibrary
        bookmarks={userProfile.bookmarks}
        readingHistory={userProfile.readingHistory}
        allBookmarksHref={allBookmarksHref ?? "/profile/bookmarks"}
        maxItems={10}
      />
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 shadow-sm min-h-[280px] flex flex-col">
        <ReadingHistorySection
          readingHistory={userProfile.readingHistory}
          historyHref={historyHref}
        />
      </div>
    </div>
  );
}
