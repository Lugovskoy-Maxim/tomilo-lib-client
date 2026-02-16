"use client";

import { useParams } from "next/navigation";
import { useGetProfileByIdQuery, useGetProfileByUsernameQuery } from "@/store/api/authApi";
import { UserProfile } from "@/types/user";
import { User } from "@/types/auth";
import { ReadingHistoryEntry } from "@/types/store";
import { normalizeBookmarks } from "@/lib/bookmarks";
import { isMongoObjectId } from "@/lib/isMongoObjectId";
import ProfileContent from "@/shared/profile/ProfileContent";

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

export default function UserAboutPage() {
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
  const { data, isSuccess } = activeQuery;

  const userProfile =
    isSuccess && data?.success && data?.data
      ? transformUserToProfile(data.data)
      : null;
  const isBookmarksRestricted = Boolean(
    userProfile?.privacy && userProfile.privacy.profileVisibility !== "public",
  );
  const isHistoryRestricted = Boolean(
    userProfile?.privacy && userProfile.privacy.readingHistoryVisibility !== "public",
  );

  if (!userProfile) return null;

  return (
    <div className="w-full animate-fade-in-up">
      <ProfileContent
        userProfile={userProfile}
        allBookmarksHref={`/user/${userParam}/bookmarks`}
        historyHref={`/user/${userParam}/history`}
        hiddenBookmarksMessage={
          isBookmarksRestricted
            ? "Закладки этого пользователя скрыты настройками приватности."
            : undefined
        }
        hiddenHistoryMessage={
          isHistoryRestricted
            ? "История чтения этого пользователя скрыта настройками приватности."
            : undefined
        }
        bookmarksEmptyStateMessage="У пользователя пока нет публичных закладок."
      />
    </div>
  );
}
