"use client";

import { useParams, notFound } from "next/navigation";
import { useGetProfileByIdQuery, useGetProfileByUsernameQuery } from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/types/user";
import { User } from "@/types/auth";
import { ReadingHistoryEntry } from "@/types/store";
import { normalizeBookmarks } from "@/lib/bookmarks";
import { isMongoObjectId } from "@/lib/isMongoObjectId";
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
  const userParam = typeof params.username === "string" ? params.username : "";
  const loadById = isMongoObjectId(userParam);

  const usernameQuery = useGetProfileByUsernameQuery(userParam, {
    skip: !userParam || loadById,
  });
  const idQuery = useGetProfileByIdQuery(userParam, {
    skip: !userParam || !loadById,
  });

  const activeQuery = loadById ? idQuery : usernameQuery;
  const { data, isLoading, isError, isSuccess } = activeQuery;

  const { user: currentUser } = useAuth();
  const userProfile =
    isSuccess && data?.success && data?.data
      ? transformUserToProfile(data.data)
      : null;
  const isOwnProfile = Boolean(
    currentUser && userProfile && (currentUser.username === userProfile.username || currentUser._id === userProfile._id),
  );
  const privacy = userProfile?.privacy;
  const isProfileRestricted = Boolean(privacy && privacy.profileVisibility !== "public");
  const isReadingHistoryRestricted = Boolean(
    privacy && privacy.readingHistoryVisibility !== "public",
  );
  const hasPrivacyNotice = isProfileRestricted || isReadingHistoryRestricted;

  useSEO(seoConfigs.profile(userProfile?.username));

  if (!userParam) {
    notFound();
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col bg-[var(--background)] min-w-0 overflow-x-hidden">
        <Header />
        <div className="flex flex-1 flex-col min-h-0">
          <LoadingState />
        </div>
        <Footer />
      </main>
    );
  }

  if (isError || !userProfile) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col bg-[var(--background)] min-w-0 overflow-x-hidden">
      <Header />
      <PublicProfileCover userProfile={userProfile} />
      <div className="flex flex-1 flex-col min-h-0">
        <div className="w-full mx-auto px-2 min-[360px]:px-3 py-3 sm:px-4 sm:py-6 max-w-6xl min-w-0 overflow-x-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 sm:gap-6 lg:gap-8 items-start">
            <ProfileSidebar userProfile={userProfile} isOwnProfile={isOwnProfile} />
            <div className="min-w-0">
              <ProfileNav basePath={`/user/${userParam}`} showSettings={false} />
              {hasPrivacyNotice && (
                <div className="mb-4 sm:mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-[var(--foreground)]">
                  <p className="font-medium">Часть данных пользователя скрыта настройками приватности.</p>
                  <p className="text-[var(--muted-foreground)] mt-1">
                    Некоторые разделы могут быть недоступны.
                  </p>
                </div>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
