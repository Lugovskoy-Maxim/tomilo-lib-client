import { UserProfile } from "@/types/user";
import { BookmarksSection, ReadingHistorySection } from "@/widgets";

interface ProfileContentProps {
  userProfile: UserProfile;
}

export default function ProfileContent({ userProfile }: ProfileContentProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 py-2">
      <div className="glass rounded-2xl border border-[var(--border)] p-4 sm:p-6 shadow-sm min-h-[320px] flex flex-col">
        <BookmarksSection bookmarks={userProfile.bookmarks} />
      </div>
      <div className="glass rounded-2xl border border-[var(--border)] p-4 sm:p-6 shadow-sm min-h-[320px] flex flex-col">
        <ReadingHistorySection readingHistory={userProfile.readingHistory} />
      </div>
    </div>
  );
}
