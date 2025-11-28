"use client";

import { AuthGuard } from "@/guard/auth-guard";
import { useProfile } from "@/hooks/useProfile";
import {
  ErrorState,
  LoadingState,
  ProfileBanner,
  ProfileContent,
  ProfileHeader,
  ProfileStats,
} from "@/shared";

import { Footer, Header } from "@/widgets";
import { useSEO, seoConfigs } from "@/hooks/useSEO";

export default function ProfilePage() {
  const { userProfile, isLoading, authLoading, handleAvatarUpdate } =
    useProfile();

  // SEO для страницы профиля
  useSEO(seoConfigs.profile(userProfile?.username || userProfile?.email));

  if (authLoading || isLoading) {
    return <LoadingState />;
  }

  if (!userProfile) {
    return <ErrorState />;
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />

        <div className="max-w-7xl mx-auto px-4 py-4">
          <ProfileHeader />
          <ProfileBanner
            userProfile={userProfile}
            onAvatarUpdate={handleAvatarUpdate}
          />
          {/* <ProfileStats userProfile={userProfile} /> */}
          <ProfileContent userProfile={userProfile} />
        </div>

        <Footer />
      </main>
    </AuthGuard>
  );
}
