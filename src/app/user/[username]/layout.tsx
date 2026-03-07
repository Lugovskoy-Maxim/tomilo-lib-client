"use client";

import { useParams, notFound } from "next/navigation";
import { useGetProfileByIdQuery } from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile } from "@/types/user";
import type { User } from "@/types/auth";
import { ReadingHistoryEntry } from "@/types/store";
import { normalizeBookmarks } from "@/lib/bookmarks";
import { getLinkedProvidersFromUser } from "@/lib/linkedProviders";
import { getEquippedBackgroundUrl, getDecorationImageUrl } from "@/api/shop";
import ProfileShell from "@/shared/profile/ProfileShell";
import { useSEO, seoConfigs } from "@/hooks/useSEO";

function transformUserToProfile(user: User): UserProfile {
  const u = user as User & {
    equippedDecorations?: UserProfile["equippedDecorations"];
    oauthProviders?: Array<{ provider?: string }>;
    ownedDecorations?: UserProfile["ownedDecorations"];
  };
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
    subscriptionExpiresAt: u.subscriptionExpiresAt ?? null,
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
    linkedProviders: getLinkedProvidersFromUser(u),
    ownedDecorations: u.ownedDecorations,
    bio: u.bio,
    favoriteGenre: u.favoriteGenre,
    socialLinks: u.socialLinks,
    showStats: u.showStats,
    showAchievements: u.showAchievements,
    showFavoriteCharacters: u.showFavoriteCharacters,
    showReadingHistory: u.showReadingHistory,
    showBookmarks: u.showBookmarks,
    currentStreak: u.currentStreak,
    longestStreak: u.longestStreak,
    lastStreakDate: u.lastStreakDate,
    titlesReadCount: u.titlesReadCount,
    commentsCount: u.commentsCount,
    likesReceivedCount: u.likesReceivedCount,
    readingTimeMinutes: u.readingTimeMinutes,
    completedTitlesCount: u.completedTitlesCount,
    scheduledDeletionAt: (u as User & { scheduledDeletionAt?: string | null }).scheduledDeletionAt ?? undefined,
    deletedAt: (u as User & { deletedAt?: string | null }).deletedAt ?? undefined,
  };
}

function getProfileBgUrl(profile: UserProfile | null): string {
  if (!profile?.equippedDecorations) return "/user/banner.jpg";
  const bg = profile.equippedDecorations.background;
  if (!bg) return "/user/banner.jpg";
  if (typeof bg === "string") {
    if (bg.startsWith("http")) return bg;
    return getDecorationImageUrl(bg) || "/user/banner.jpg";
  }
  if (typeof bg === "object") {
    const o = bg as Record<string, unknown>;
    const imageUrl = (o.imageUrl ?? o.image_url) as string | undefined;
    if (imageUrl) return getDecorationImageUrl(imageUrl) || imageUrl;
  }
  return getEquippedBackgroundUrl(profile.equippedDecorations) || "/user/banner.jpg";
}

export default function UserProfileLayout() {
  const params = useParams();
  const userId = typeof params.username === "string" ? params.username : "";

  const { data, isLoading, isError, isSuccess } = useGetProfileByIdQuery(userId, {
    skip: !userId,
  });

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
  const isBookmarksRestricted = Boolean(!isOwnProfile && userProfile?.showBookmarks === false);
  const isReadingHistoryRestricted = Boolean(!isOwnProfile && userProfile?.showReadingHistory === false);
  const hasPrivacyNotice = isProfileRestricted || isBookmarksRestricted || isReadingHistoryRestricted;

  useSEO(seoConfigs.profile(userProfile?.username));

  if (!userId) {
    notFound();
  }

  const isPrivateProfile =
    isSuccess && data && (data as { success?: boolean; message?: string; errors?: string[] }).success === false &&
    ((data as { message?: string }).message?.toLowerCase().includes("private") ||
      (data as { errors?: string[] }).errors?.some(e => e?.toLowerCase().includes("private")));

  // Показываем «Профиль не найден» или «Профиль скрыт» внутри лейаута вместо общей 404
  if (isError || (!isLoading && !userProfile)) {
    return (
      <ProfileShell
        variant="other"
        userProfile={null}
        isLoading={false}
        backgroundUrl="/user/banner.jpg"
        isOwnProfile={false}
        isBookmarksRestricted={true}
        isHistoryRestricted={true}
        hasPrivacyNotice={false}
        hideTabs={["settings", "inventory", "exchanges"]}
        breadcrumbPrefix={[
          { name: "Главная", href: "/" },
          { name: "", href: `/user/${userId}` },
        ]}
        showMyProfileLink={!!currentUser}
        emptyStateMessage={isPrivateProfile ? "Профиль скрыт" : undefined}
        emptyStateVariant={isPrivateProfile ? "private" : "not_found"}
      />
    );
  }

  return (
    <ProfileShell
      variant="other"
      userProfile={userProfile}
      isLoading={isLoading}
      backgroundUrl={userProfile ? getProfileBgUrl(userProfile) : "/user/banner.jpg"}
      isOwnProfile={isOwnProfile}
      isBookmarksRestricted={isBookmarksRestricted}
      isHistoryRestricted={isReadingHistoryRestricted}
      hasPrivacyNotice={hasPrivacyNotice}
      hideTabs={["settings", "inventory", "exchanges"]}
        breadcrumbPrefix={[
          { name: "Главная", href: "/" },
          { name: userProfile?.username ?? "", href: `/user/${userId}` },
        ]}
      showMyProfileLink={!!currentUser}
    />
  );
}
