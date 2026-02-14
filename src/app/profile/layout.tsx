"use client";

import { useState } from "react";
import { AuthGuard } from "@/guard/AuthGuard";
import { useProfile } from "@/hooks/useProfile";
import { ErrorState, LoadingState, ProfileHeader } from "@/shared";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { Footer, Header } from "@/widgets";
import { useSEO, seoConfigs } from "@/hooks/useSEO";
import { UserProfile } from "@/types/user";
import ProfileNav from "@/shared/profile/ProfileNav";
import ProfileCover from "@/shared/profile/ProfileCover";
import ProfileSidebar from "@/shared/profile/ProfileSidebar";
import ProfileEditForm from "@/shared/profile/ProfileEditForm";
import Modal from "@/shared/modal/modal";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile, isLoading, authLoading, handleAvatarUpdate } = useProfile();
  const [updateProfile] = useUpdateProfileMutation();
  const [isEditing, setIsEditing] = useState(false);

  useSEO(seoConfigs.profile(userProfile?.username || userProfile?.email));

  if (authLoading || isLoading) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-[var(--background)]">
          <Header />
          <LoadingState />
          <Footer />
        </main>
      </AuthGuard>
    );
  }

  if (!userProfile) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-[var(--background)]">
          <Header />
          <ErrorState />
          <Footer />
        </main>
      </AuthGuard>
    );
  }

  const handleUpdateProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      await updateProfile(updatedProfile).unwrap();
      setIsEditing(false);
    } catch (error) {
      console.error("Ошибка при обновлении профиля:", error);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[var(--background)]">
        <Header />
        {/* Полноширинная обложка в стиле Senkuro */}
        <ProfileCover userProfile={userProfile} />
        <div className="w-full mx-auto px-3 py-4 sm:px-4 sm:py-6 max-w-6xl">
          <ProfileHeader />
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 items-start">
            <ProfileSidebar
              userProfile={userProfile}
              onEdit={() => setIsEditing(true)}
              onAvatarUpdate={handleAvatarUpdate}
            />
            <div className="min-w-0">
              <ProfileNav basePath="/profile" showSettings />
              {children}
            </div>
          </div>
        </div>
        <Footer />
      </main>
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Данные профиля">
        <ProfileEditForm
          userProfile={userProfile}
          onSave={handleUpdateProfile}
          onCancel={() => setIsEditing(false)}
        />
      </Modal>
    </AuthGuard>
  );
}
