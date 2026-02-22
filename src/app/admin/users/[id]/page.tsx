"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { AuthGuard } from "@/guard/AuthGuard";
import { useGetUserByIdQuery } from "@/store/api/usersApi";
import { LoadingState } from "@/shared";
import ErrorState from "@/shared/error-state/ErrorState";
import { Footer, Header } from "@/widgets";
import { useSEO } from "@/hooks/useSEO";
import { getEquippedBackgroundUrl } from "@/api/shop";
import ProfileSidebar from "@/shared/profile/ProfileSidebar";
import ProfileTabs from "@/shared/profile-tabs/ProfileTabs";
import { ProfileNav } from "@/shared/profile-tabs/ProfileNav";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ProfileTab } from "@/shared/profile-tabs/profileTabConfig";

export default function AdminUserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: userData, isLoading, error } = useGetUserByIdQuery(userId);
  const userProfile = userData?.data;

  useSEO({
    title: userProfile ? `Профиль: ${userProfile.username}` : "Профиль пользователя",
    description: userProfile
      ? `Профиль пользователя ${userProfile.username} на Tomilo Lib`
      : "Просмотр профиля пользователя",
  });

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

  if (error || !userProfile) {
    return (
      <main className="min-h-screen flex flex-col bg-[var(--background)]">
        <Header />
        <div className="flex flex-1 flex-col min-h-0">
          <ErrorState message="Пользователь не найден" />
        </div>
        <Footer />
      </main>
    );
  }

  const profileBgUrl = getEquippedBackgroundUrl(userProfile.equippedDecorations) || "/user/banner.jpg";
  const basePath = `/admin/users/${userId}`;

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen flex flex-col bg-[var(--background)] min-w-0 overflow-x-hidden">
        <Header />

        {/* Баннер и карточка — как у личного профиля */}
        <div
          className="relative min-h-[50vh] sm:min-h-[55vh] flex flex-1 flex-col bg-[var(--background)] pt-12 sm:pt-36 bg-no-repeat bg-top"
          style={{
            backgroundImage: `url(${profileBgUrl})`,
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
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/10 from-0% via-transparent via-[35%] to-transparent to-[72%] pointer-events-none z-0"
            aria-hidden
          />

          <div className="relative z-10 flex flex-1 flex-col min-h-0">
            <div className="w-full mx-auto px-3 min-[360px]:px-4 sm:px-6 py-4 sm:py-6 max-w-7xl min-w-0 overflow-x-hidden">
              <Breadcrumbs
                items={[
                  { name: "Главная", href: "/" },
                  { name: "Админка", href: "/admin" },
                  { name: "Пользователи", href: "/admin?tab=users" },
                  { name: userProfile.username ?? "Профиль", isCurrent: true },
                ]}
                className="mb-4"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="group flex items-center gap-1.5 sm:gap-2 px-2 py-2 min-[360px]:px-3 sm:px-4 sm:py-2.5 bg-[var(--card)]/90 backdrop-blur-sm text-[var(--foreground)] rounded-xl hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-all duration-300 font-medium border border-[var(--border)] hover:border-[var(--primary)] shadow-sm hover:shadow-md"
                  aria-label="Назад"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-0.5" />
                  <span className="text-sm">Назад</span>
                </button>
                <Link
                  href="/profile"
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Мой профиль
                </Link>
              </div>

              <div className="relative rounded-2xl bg-[var(--background)]/55 backdrop-blur-md border border-[var(--border)]/50 shadow-xl shadow-black/5 min-h-[50vh] overflow-hidden">
                <div
                  className="absolute inset-x-0 top-0 h-16 pointer-events-none z-0"
                  style={{
                    background: "linear-gradient(to bottom, transparent 0%, var(--background) 100%)",
                    opacity: 0.55,
                  }}
                  aria-hidden
                />
                <div className="relative z-10 p-4 sm:p-6 flex flex-col xl:flex-row gap-6 xl:gap-8 items-stretch xl:items-start">
                  <aside className="xl:w-72 xl:shrink-0 xl:flex xl:flex-col xl:gap-6 xl:sticky xl:top-4">
                    <ProfileSidebar
                      userProfile={userProfile}
                      isOwnProfile={false}
                    />
                    <div className="hidden xl:block">
                      <ProfileNav hideTabs={["settings"] as ProfileTab[]} />
                    </div>
                  </aside>
                  <div className="flex-1 min-w-0 w-full">
                    <ProfileTabs
                      userProfile={userProfile}
                      breadcrumbPrefix={[
                        { name: "Главная", href: "/" },
                        { name: "Админка", href: "/admin" },
                        { name: "Пользователи", href: "/admin?tab=users" },
                        { name: userProfile.username ?? "Профиль", href: basePath },
                      ]}
                      hideTabs={["settings"]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </AuthGuard>
  );
}
