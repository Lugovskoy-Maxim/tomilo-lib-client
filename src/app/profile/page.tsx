"use client";

import { AuthGuard } from "@/guard/AuthGuard";
import { useProfile } from "@/hooks/useProfile";
import { ErrorState, LoadingState, ProfileBanner, ProfileHeader } from "@/shared";
import { useUpdateProfileMutation } from "@/store/api/authApi";

import { Footer, Header } from "@/widgets";
import { useSEO, seoConfigs } from "@/hooks/useSEO";
import { UserProfile } from "@/types/user";

// Импортируем компонент вкладок профиля
import ProfileTabs from "@/shared/profile-tabs/ProfileTabs";

export default function ProfilePage() {
  const { userProfile, isLoading, authLoading, handleAvatarUpdate } = useProfile();
  const [updateProfile] = useUpdateProfileMutation();

  // SEO для страницы профиля
  useSEO(seoConfigs.profile(userProfile?.username || userProfile?.email));

  if (authLoading || isLoading) {
    return <LoadingState />;
  }

  if (!userProfile) {
    return <ErrorState />;
  }

  const handleUpdateProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      await updateProfile(updatedProfile).unwrap();
    } catch (error) {
      console.error("Ошибка при обновлении профиля:", error);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)] ">
        <Header />

        <div className="w-full mx-auto px-3 py-3 sm:px-4 sm:py-4 flex flex-col items-center justify-center max-w-7xl">
          <ProfileHeader />
          <ProfileBanner
            userProfile={userProfile}
            onAvatarUpdate={handleAvatarUpdate}
            onUpdateProfile={handleUpdateProfile}
          />

          {/* Вкладки профиля */}
          <ProfileTabs userProfile={userProfile} />
        </div>

        <Footer />
      </main>
    </AuthGuard>
  );
}
