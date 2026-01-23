import { UserProfile } from "@/types/user";
import { BookmarksSection, ReadingHistorySection } from "@/widgets";

interface ProfileContentProps {
  userProfile: UserProfile;
}

export default function ProfileContent({ userProfile }: ProfileContentProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 py-2">
      <BookmarksSection bookmarks={userProfile.bookmarks} />
      <div className="flex flex-col gap-6">
        <ReadingHistorySection readingHistory={userProfile.readingHistory} />
      </div>
    </div>
  );
}
