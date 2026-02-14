"use client";

import { useParams, notFound } from "next/navigation";
import { useGetProfileByUsernameQuery } from "@/store/api/authApi";
import { UserProfile } from "@/types/user";
import { User } from "@/types/auth";
import { ReadingHistoryEntry } from "@/types/store";
import { normalizeBookmarks } from "@/lib/bookmarks";
import { Footer, Header } from "@/widgets";
import { LoadingState } from "@/shared";
import PublicProfileCover from "@/shared/profile/PublicProfileCover";
import ProfileSidebar from "@/shared/profile/ProfileSidebar";
import ProfileNav from "@/shared/profile/ProfileNav";
import { useSEO, seoConfigs } from "@/hooks/useSEO";

function transformUserToProfile(user: User): UserProfile {
  const u = user as User & { equippedDecorations?: UserProfile["equippedDecorations"] };
  return {
    _id: u._id || u.id,
    username: u.username,
    email: u.email ?? "",
    emailVerified: u.emailVerified,
    avatar: u.avatar || "",
    role: u.role,
    level: u.level,
    experience: u.experience,
    balance: u.balance,
    bookmarks: normalizeBookmarks(u.bookmarks),
    readingHistory: Array.isArray(u.readingHistory)
      ? (u.readingHistory as ReadingHistoryEntry[]).map(item => ({
          ...item,
          titleId: item.titleId,
          chapters: Array.isArray(item.chapters)
            ? item.chapters.map(chap => ({
                ...chap,
                chapterId:
                  typeof chap.chapterId === "object" && chap.chapterId !== null
                    ? (chap.chapterId as { _id: string })._id
                    : String(chap.chapterId),
              }))
            : [],
        }))
      : [],
    birthDate: u.birthDate,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    privacy: u.privacy,
    displaySettings: u.displaySettings,
    equippedDecorations: u.equippedDecorations,
  };
}

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const username = typeof params.username === "string" ? params.username : "";

  const { data, isLoading, isError, isSuccess } = useGetProfileByUsernameQuery(username, {
    skip: !username,
  });

  const userProfile =
    isSuccess && data?.success && data?.data
      ? transformUserToProfile(data.data)
      : null;

  useSEO(seoConfigs.profile(userProfile?.username));

  if (!username) {
    notFound();
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <Header />
        <LoadingState />
        <Footer />
      </main>
    );
  }

  if (isError || !userProfile) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Header />
      <PublicProfileCover userProfile={userProfile} />
      <div className="w-full mx-auto px-3 py-4 sm:px-4 sm:py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 items-start">
          <ProfileSidebar userProfile={userProfile} />
          <div className="min-w-0">
            <ProfileNav basePath={`/user/${username}`} showSettings={false} />
            {children}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
