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
import { getEquippedBackgroundUrl, getDecorationImageUrl } from "@/api/shop";
import ProfileEditForm from "@/shared/profile/ProfileEditForm";
import { ProfileProvider } from "@/shared/profile/ProfileContext";
import Modal from "@/shared/modal/modal";
import { useResolvedEquippedDecorations } from "@/hooks/useEquippedFrameUrl";

export default function ProfileLayout(_: { children: React.ReactNode }) {
  void _;
  const { userProfile, isLoading, authLoading, handleAvatarUpdate } = useProfile();
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [isEditing, setIsEditing] = useState(false);
  
  const { frameUrl, avatarDecorationUrl } = useResolvedEquippedDecorations();

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

  const getBackgroundUrl = () => {
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
        className="relative min-h-[50vh] sm:min-h-[55vh] bg-[var(--background)] pt-12 sm:pt-36 bg-no-repeat bg-top"
        style={{
          backgroundImage: `url(${getBackgroundUrl()})`,
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
        <div className="relative z-10 w-full mx-auto px-3 min-[360px]:px-4 sm:px-6 pt-4 sm:pt-6 max-w-7xl min-w-0 overflow-x-hidden">
          <ProfileHeader />
        </div>
        <div className="relative z-10 w-full mx-auto px-3 min-[360px]:px-4 sm:px-6 py-4 sm:py-6 max-w-7xl min-w-0 overflow-x-hidden">
          <div className="relative rounded-2xl bg-[var(--background)]/55 backdrop-blur-md border border-[var(--border)]/50 shadow-xl shadow-black/5 min-h-[50vh] overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-16 pointer-events-none z-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, var(--background) 100%)', opacity: 0.55 }} aria-hidden />
            <div className="relative z-10 p-4 sm:p-6 flex flex-col xl:flex-row gap-6 xl:gap-8 items-stretch xl:items-start">
              {/* Левая колонка — только карточка профиля */}
              <aside className="xl:w-72 xl:shrink-0 xl:sticky xl:top-4">
                <ProfileSidebar
                  userProfile={userProfile}
                  onEdit={() => setIsEditing(true)}
                  onAvatarUpdate={handleAvatarUpdate}
                  isOwnProfile
                />
              </aside>
              
              {/* Центральная часть — контент вкладок */}
              <div className="flex-1 min-w-0 w-full">
                <ProfileTabs userProfile={userProfile} />
              </div>
              
              {/* Правая колонка — навигация (только на xl экранах) */}
              <aside className="hidden xl:block xl:w-56 xl:shrink-0 xl:sticky xl:top-4">
                <ProfileNav />
              </aside>
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
