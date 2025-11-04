import { UserProfile } from "@/types/user";
import { BookmarksSection, ReadingHistorySection } from "@/widgets";
import { ContinueReadingButton } from "@/shared/continue-reading-button";
import { BookmarkCard } from "@/shared";

interface ProfileContentProps {
  userProfile: UserProfile;
}

export default function ProfileContent({ userProfile }: ProfileContentProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 py-4">
      <div className="flex flex-col gap-6">
        <ContinueReadingButton />
        <ReadingHistorySection readingHistory={userProfile.readingHistory} />
      </div>
      <BookmarksSection
        bookmarks={userProfile.bookmarks}
      />
    </div>
  );
}