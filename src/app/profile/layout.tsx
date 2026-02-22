"use client";

import { useState } from "react";
import { AuthGuard } from "@/guard/AuthGuard";
import { useProfile } from "@/hooks/useProfile";
import { ProfileHeader } from "@/shared";
import Link from "next/link";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { Footer, Header } from "@/widgets";
import { useSEO, seoConfigs } from "@/hooks/useSEO";
import { UserProfile } from "@/types/user";
import ProfileTabs from "@/shared/profile-tabs/ProfileTabs";
import { ProfileNav } from "@/shared/profile-tabs/ProfileNav";
import ProfileSidebar from "@/shared/profile/ProfileSidebar";
import { getEquippedBackgroundUrl } from "@/api/shop";
import ProfileEditForm from "@/shared/profile/ProfileEditForm";
import { ProfileProvider } from "@/shared/profile/ProfileContext";
import Modal from "@/shared/modal/modal";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile, isLoading, authLoading, handleAvatarUpdate } = useProfile();
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [isEditing, setIsEditing] = useState(false);

  useSEO(seoConfigs.profile(userProfile?.username || userProfile?.email));

  const handleUpdateProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      await updateProfile(updatedProfile).unwrap();
      setIsEditing(false);
    } catch (error) {
      console.error("Ошибка при обновлении профиля:", error);
    }
  };

  const profileContextValue = {
    userProfile,
    isLoading,
    authLoading,
    handleAvatarUpdate,
  };

  // Хедер и футер только в layout; при загрузке/ошибке — контент без своего Header/Footer, чтобы не было двойного хедера
  const content = authLoading || isLoading ? (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-pulse text-center">
        <div className="w-24 h-24 bg-[var(--border)] rounded-full mx-auto mb-4" />
        <div className="h-6 bg-[var(--border)] rounded w-48 mx-auto mb-2" />
        <div className="h-4 bg-[var(--border)] rounded w-32 mx-auto" />
      </div>
    </div>
  ) : !userProfile ? (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-lg sm:text-xl font-bold text-[var(--foreground)] mb-4 px-2">
          Пользователь не найден
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6 px-2">Не удалось загрузить данные профиля</p>
        <Link
          href="/"
          className="px-4 py-2.5 sm:px-6 sm:py-3 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  ) : (
    <ProfileProvider value={profileContextValue}>
      <div
        className="relative min-h-[60vh] bg-[var(--background)]"
        style={
          (() => {
            const url = getEquippedBackgroundUrl(userProfile.equippedDecorations) || "/user/banner.jpg";
            return {
              backgroundImage: `url(${url})`,
              backgroundSize: "100% auto",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "top center",
            };
          })()
        }
      >
        <div className="relative w-full mx-auto px-2 min-[360px]:px-3 pt-3 sm:px-4 sm:pt-6 max-w-7xl min-w-0 overflow-x-hidden">
          <ProfileHeader />
        </div>
        <div className="relative w-full mx-auto px-2 min-[360px]:px-3 py-3 sm:px-4 sm:py-6 max-w-7xl min-w-0 overflow-x-hidden bg-[var(--background)]/70 backdrop-blur-sm rounded-xl">
          <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 xl:gap-8 items-stretch xl:items-start">
            {/* На больших экранах: одна левая колонка — карточка профиля и навигация */}
            <aside className="xl:w-72 xl:shrink-0 xl:flex xl:flex-col xl:gap-6 xl:sticky xl:top-4">
              <ProfileSidebar
                userProfile={userProfile}
                onEdit={() => setIsEditing(true)}
                onAvatarUpdate={handleAvatarUpdate}
                isOwnProfile
              />
              <div className="hidden xl:block">
                <ProfileNav />
              </div>
            </aside>
            <div className="flex-1 min-w-0 w-full">
              <ProfileTabs userProfile={userProfile} />
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Данные профиля">
        <ProfileEditForm
          userProfile={userProfile}
          onSave={handleUpdateProfile}
          onCancel={() => setIsEditing(false)}
          isLoading={isUpdatingProfile}
        />
      </Modal>
    </ProfileProvider>
  );

  return (
    <>
      <main className="min-h-screen flex flex-col bg-[var(--background)] min-w-0 overflow-x-hidden">
        <Header />
        <AuthGuard>
          <div className="flex flex-1 flex-col min-h-0">{content}</div>
        </AuthGuard>
        <Footer />
      </main>
    </>
  );
}
