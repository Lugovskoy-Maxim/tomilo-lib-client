"use client";

import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useGetProfileByIdQuery, useGetProfileByUsernameQuery } from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/types/user";
import { User } from "@/types/auth";
import { ReadingHistoryEntry } from "@/types/store";
import { normalizeBookmarks } from "@/lib/bookmarks";
import { getLinkedProvidersFromUser } from "@/lib/linkedProviders";
import { isMongoObjectId } from "@/lib/isMongoObjectId";
import { Footer, Header } from "@/widgets";
import LoadingState from "@/shared/profile/ProfileLoading";
import ProfileSidebar from "@/shared/profile/ProfileSidebar";
import { getEquippedBackgroundUrl, getDecorationImageUrl } from "@/api/shop";
import ProfileTabs from "@/shared/profile-tabs/ProfileTabs";
import { useSEO, seoConfigs } from "@/hooks/useSEO";
import { ArrowLeft, User as UserIcon } from "lucide-react";

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
    // Кастомизация профиля
    bio: u.bio,
    favoriteGenre: u.favoriteGenre,
    socialLinks: u.socialLinks,
    showStats: u.showStats,
    showAchievements: u.showAchievements,
    showFavoriteCharacters: u.showFavoriteCharacters,
    showReadingHistory: u.showReadingHistory,
    showBookmarks: u.showBookmarks,
    // Статистика
    currentStreak: u.currentStreak,
    longestStreak: u.longestStreak,
    lastStreakDate: u.lastStreakDate,
    titlesReadCount: u.titlesReadCount,
    commentsCount: u.commentsCount,
    likesReceivedCount: u.likesReceivedCount,
    readingTimeMinutes: u.readingTimeMinutes,
    completedTitlesCount: u.completedTitlesCount,
  };
}

export default function UserProfileLayout() {
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
  const isBookmarksRestricted = Boolean(!isOwnProfile && userProfile?.showBookmarks === false);
  const isReadingHistoryRestricted = Boolean(!isOwnProfile && userProfile?.showReadingHistory === false);
  const hasPrivacyNotice = isProfileRestricted || isBookmarksRestricted || isReadingHistoryRestricted;

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

  const getProfileBgUrl = () => {
    if (!userProfile?.equippedDecorations) return "/user/banner.jpg";
    const bg = userProfile.equippedDecorations.background;
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
    return getEquippedBackgroundUrl(userProfile.equippedDecorations) || "/user/banner.jpg";
  };

  return (
    <main className="min-h-screen flex flex-col bg-[var(--background)] min-w-0 overflow-x-hidden">
      <Header />
      <div
        className="relative min-h-[45vh] sm:min-h-[50vh] flex flex-1 flex-col bg-[var(--background)] pt-28 sm:pt-52 bg-no-repeat bg-top"
        style={{
          backgroundImage: `url(${getProfileBgUrl()})`,
          backgroundSize: "100% auto",
          backgroundPosition: "top center",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{ background: "linear-gradient(to bottom, transparent 0%, var(--background) 70%)" }}
          aria-hidden
        />
        <div className="relative z-10 flex flex-1 flex-col min-h-0">
          <div className="w-full mx-auto px-3 min-[360px]:px-4 sm:px-6 max-w-7xl min-w-0 overflow-x-hidden">
            <div className="pt-2 pb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm text-[var(--foreground)] bg-[var(--card)]/90 hover:bg-[var(--accent)] border border-[var(--border)] transition-colors"
                aria-label="Назад"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </button>
              {currentUser && (
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[var(--foreground)] bg-[var(--card)]/90 hover:bg-[var(--accent)] border border-[var(--border)] transition-colors"
                >
                  <UserIcon className="w-4 h-4 shrink-0" />
                  Мой профиль
                </Link>
              )}
            </div>
            <div className="pb-6 sm:pb-8 -mt-2">
              <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm min-h-[40vh] overflow-hidden">
                <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch lg:items-start" role="article" aria-label={`Профиль пользователя ${userProfile.username}`}>
                  <aside className="lg:w-64 lg:shrink-0 lg:sticky lg:top-4">
                    <ProfileSidebar userProfile={userProfile} isOwnProfile={isOwnProfile} isPublicView={!isOwnProfile} />
                  </aside>
                  <div className="flex-1 min-w-0">
                    {hasPrivacyNotice && (
                      <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-[var(--foreground)]">
                        <p className="font-medium">Часть данных скрыта настройками приватности.</p>
                      </div>
                    )}
                    <ProfileTabs
                      userProfile={userProfile}
                      hideTabs={["settings", "inventory", "exchanges"]}
                      isPublicView
                      isBookmarksRestricted={isBookmarksRestricted}
                      isHistoryRestricted={isReadingHistoryRestricted}
                      breadcrumbPrefix={[
                        { name: "Главная", href: "/" },
                        { name: userProfile.username, href: `/user/${userParam}` },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
