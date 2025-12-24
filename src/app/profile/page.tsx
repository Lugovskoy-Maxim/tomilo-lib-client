"use client";

import { AuthGuard } from "@/guard/auth-guard";
import { useProfile } from "@/hooks/useProfile";
import {
  ErrorState,
  LoadingState,
  ProfileBanner,
  ProfileContent,
  ProfileHeader,
} from "@/shared";
import { useUpdateProfileMutation } from "@/store/api/authApi";

import { Footer, Header } from "@/widgets";
import { useSEO, seoConfigs } from "@/hooks/useSEO";
import { UserProfile } from "@/types/user";

export default function ProfilePage() {
  const { userProfile, isLoading, authLoading, handleAvatarUpdate } =
    useProfile();
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
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />

        <div className="max-w-7xl mx-auto px-4 py-4">
          <ProfileHeader />
          <ProfileBanner
            userProfile={userProfile}
            onAvatarUpdate={handleAvatarUpdate}
            onUpdateProfile={handleUpdateProfile}
          />
          <ProfileContent userProfile={userProfile} />
        </div>

        <Footer />
      </main>
    </AuthGuard>
  );
}
