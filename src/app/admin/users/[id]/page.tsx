"use client";

import { useParams } from "next/navigation";
import { AuthGuard } from "@/guard/AuthGuard";
import { useGetUserByIdQuery } from "@/store/api/usersApi";
import {
  LoadingState,
  ProfileBanner,
  ProfileHeader,
} from "@/shared";
import ErrorState from "@/shared/error-state/ErrorState";
import { Footer, Header } from "@/widgets";
import { useSEO } from "@/hooks/useSEO";
import ProfileTabs from "@/shared/profile-tabs/ProfileTabs";

export default function AdminUserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const { data: userData, isLoading, error } = useGetUserByIdQuery(userId);
  const userProfile = userData?.data;

  // SEO для страницы профиля пользователя
  useSEO({
    title: userProfile ? `Профиль: ${userProfile.username}` : "Профиль пользователя",
    description: userProfile
      ? `Профиль пользователя ${userProfile.username} на Tomilo Lib`
      : "Просмотр профиля пользователя",
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (!userProfile) {
    return <ErrorState message="Пользователь не найден" />;
  }

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />

        <div className="max-w-7xl mx-auto px-4 py-4">
          <ProfileHeader />
          <ProfileBanner
            userProfile={userProfile}
            onAvatarUpdate={() => {}}
            onUpdateProfile={() => {}}
          />

          {/* Вкладки профиля */}
          <ProfileTabs userProfile={userProfile} />
        </div>

        <Footer />
      </main>
    </AuthGuard>
  );
}

