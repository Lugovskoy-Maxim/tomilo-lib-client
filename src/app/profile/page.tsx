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

// Импортируем новые компоненты настроек
import ProfileNotificationsSettings from "@/shared/profile/profile-notifications-settings";
import ProfileReadingSettings from "@/shared/profile/profile-reading-settings";
import ProfileSecuritySettings from "@/shared/profile/profile-security-settings";
import ProfilePrivacySettings from "@/shared/profile/profile-privacy-settings";
import ProfileThemeSettings from "@/shared/profile/profile-theme-settings";
import ProfileAdditionalInfo from "@/shared/profile/profile-additional-info";

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
          
          {/* Статистика пользователя */}
          <ProfileContent userProfile={userProfile} />
          
          {/* Дополнительная информация */}
          <div className="mt-6">
            <ProfileAdditionalInfo userProfile={userProfile} />
          </div>
          
          {/* Настройки уведомлений */}
          <div className="mt-6">
            <ProfileNotificationsSettings userProfile={userProfile} />
          </div>
          
          {/* Настройки чтения */}
          <div className="mt-6">
            <ProfileReadingSettings userProfile={userProfile} />
          </div>
          
          {/* Настройки внешнего вида */}
          <div className="mt-6">
            <ProfileThemeSettings userProfile={userProfile} />
          </div>
          
          {/* Настройки приватности */}
          <div className="mt-6">
            <ProfilePrivacySettings userProfile={userProfile} />
          </div>
          
          {/* Настройки безопасности */}
          <div className="mt-6">
            <ProfileSecuritySettings userProfile={userProfile} />
          </div>
        </div>

        <Footer />
      </main>
    </AuthGuard>
  );
}
