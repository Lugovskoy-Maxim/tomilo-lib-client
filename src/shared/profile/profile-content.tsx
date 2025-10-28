import { UserProfile } from "@/types/user";
import { BookmarksSection, ReadingHistorySection } from "@/widgets";

interface ProfileContentProps {
  userProfile: UserProfile;
}

export default function ProfileContent({ userProfile }: ProfileContentProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <ReadingHistorySection readingHistory={userProfile.readingHistory} />
      <BookmarksSection 
        bookmarks={userProfile.bookmarks}
        initialBookmarks={userProfile.bookmarks}
      />
    </div>
  );
}