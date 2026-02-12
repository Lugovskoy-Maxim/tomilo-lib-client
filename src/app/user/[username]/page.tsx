"use client";

import { useParams, notFound } from "next/navigation";
import { useGetProfileByUsernameQuery } from "@/store/api/authApi";
import { UserProfile } from "@/types/user";
import { User } from "@/types/auth";
import { ReadingHistoryEntry } from "@/types/store";
import { Footer, Header } from "@/widgets";
import { LoadingState } from "@/shared";
import PublicProfileBanner from "@/shared/profile/PublicProfileBanner";
import ProfileContent from "@/shared/profile/ProfileContent";
import { useSEO, seoConfigs } from "@/hooks/useSEO";

function transformUserToProfile(user: User): UserProfile {
  return {
    _id: user._id || user.id,
    username: user.username,
    email: user.email ?? "",
    emailVerified: user.emailVerified,
    avatar: user.avatar || "",
    role: user.role,
    level: user.level,
    experience: user.experience,
    balance: user.balance,
    bookmarks: user.bookmarks || [],
    readingHistory: Array.isArray(user.readingHistory)
      ? (user.readingHistory as ReadingHistoryEntry[]).map(item => ({
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
    birthDate: user.birthDate,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    privacy: user.privacy,
    displaySettings: user.displaySettings,
  };
}

export default function UserProfilePage() {
  const params = useParams();
  const username = typeof params.username === "string" ? params.username : "";

  const { data, isLoading, isError, isSuccess } = useGetProfileByUsernameQuery(username, {
    skip: !username,
  });

  const userProfile = isSuccess && data?.success && data?.data ? transformUserToProfile(data.data) : null;

  useSEO(seoConfigs.profile(userProfile?.username));

  if (!username) {
    notFound();
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
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
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      <div className="w-full mx-auto px-3 py-3 sm:px-4 sm:py-4 flex flex-col items-center justify-center max-w-7xl">
        <PublicProfileBanner userProfile={userProfile} />
        <div className="space-y-4 sm:space-y-6 w-full">
          <ProfileContent userProfile={userProfile} />
        </div>
      </div>
      <Footer />
    </main>
  );
}
