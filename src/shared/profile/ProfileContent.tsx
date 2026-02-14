import { UserProfile } from "@/types/user";
import { BookmarksSection, ReadingHistorySection } from "@/widgets";

interface ProfileContentProps {
  userProfile: UserProfile;
}

export default function ProfileContent({ userProfile }: ProfileContentProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 shadow-sm min-h-[280px] flex flex-col">
        <BookmarksSection bookmarks={userProfile.bookmarks} readingHistory={userProfile.readingHistory} />
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 shadow-sm min-h-[280px] flex flex-col">
        <ReadingHistorySection readingHistory={userProfile.readingHistory} />
      </div>
    </div>
  );
}
