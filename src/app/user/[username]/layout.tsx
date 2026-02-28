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
import { LoadingState } from "@/shared";
import ProfileSidebar from "@/shared/profile/ProfileSidebar";
import { getEquippedBackgroundUrl, getDecorationImageUrl } from "@/api/shop";
import { ProfileNav } from "@/shared/profile-tabs/ProfileNav";
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
        className="relative min-h-[50vh] sm:min-h-[55vh] flex flex-1 flex-col bg-[var(--background)] pt-12 sm:pt-36 bg-no-repeat bg-top"
        style={{
          backgroundImage: `url(${getProfileBgUrl()})`,
          backgroundSize: "100% auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top center",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: "linear-gradient(to top, var(--background) 0%, var(--background) 45%, transparent 65%)",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 from-0% via-transparent via-[35%] to-transparent to-[72%] pointer-events-none z-0" aria-hidden />
        <div className="relative z-10 flex flex-1 flex-col min-h-0">
          <div className="w-full mx-auto px-3 min-[360px]:px-4 sm:px-6 py-4 sm:py-6 max-w-7xl min-w-0 overflow-x-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="group flex items-center gap-1.5 sm:gap-2 px-2 py-2 min-[360px]:px-3 sm:px-4 sm:py-2.5 bg-[var(--card)]/90 backdrop-blur-sm text-[var(--foreground)] rounded-xl hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-all duration-300 font-medium border border-[var(--border)] hover:border-[var(--primary)] shadow-sm hover:shadow-md"
                aria-label="Назад"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-0.5" />
                <span className="text-sm">Назад</span>
              </button>
              {currentUser && (
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-medium text-sm text-[var(--muted-foreground)] bg-[var(--secondary)]/60 border border-[var(--border)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
                >
                  <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span className="hidden sm:inline">Мой профиль</span>
                </Link>
              )}
            </div>
            <div className="relative rounded-2xl bg-[var(--background)]/55 backdrop-blur-md border border-[var(--border)]/50 shadow-xl shadow-black/5 min-h-[40vh] overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-16 pointer-events-none z-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, var(--background) 100%)', opacity: 0.55 }} aria-hidden />
              <div className="relative z-10 p-4 sm:p-6 flex flex-col xl:flex-row gap-6 xl:gap-8 items-stretch xl:items-start" role="article" aria-label={`Профиль пользователя ${userProfile.username}`}>
                {/* Левая колонка — карточка профиля */}
                <aside className="xl:w-72 xl:shrink-0 xl:sticky xl:top-4">
                  <ProfileSidebar userProfile={userProfile} isOwnProfile={isOwnProfile} />
                </aside>
                
                {/* Центральная часть — контент */}
                <div className="flex-1 min-w-0">
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
                
                {/* Правая колонка — навигация (только на xl экранах) */}
                <aside className="hidden xl:block xl:w-56 xl:shrink-0 xl:sticky xl:top-4">
                  <ProfileNav hideTabs={["settings", "inventory", "exchanges"]} />
                </aside>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
