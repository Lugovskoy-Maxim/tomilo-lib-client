"use client";

import { useState } from "react";
import { AuthGuard } from "@/guard/AuthGuard";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { getEquippedBackgroundUrl, getDecorationImageUrl } from "@/api/shop";
import ProfileEditForm from "@/shared/profile/ProfileEditForm";
import ProfileShell from "@/shared/profile/ProfileShell";
import Modal from "@/shared/modal/modal";
import { useSEO, seoConfigs } from "@/hooks/useSEO";
import type { UserProfile } from "@/types/user";

function getBackgroundUrl(userProfile: UserProfile | null): string {
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
}

export default function ProfileLayout(_: { children: React.ReactNode }) {
  void _;
  const { user: currentUser } = useAuth();
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

  return (
    <AuthGuard>
      <ProfileShell
        variant="own"
        userProfile={userProfile ?? null}
        isLoading={authLoading || isLoading}
        backgroundUrl={userProfile ? getBackgroundUrl(userProfile) : "/user/banner.jpg"}
        profileContextValue={profileContextValue}
        onEdit={() => setIsEditing(true)}
        onAvatarUpdate={handleAvatarUpdate}
        showAdminLink={currentUser?.role === "admin"}
      />
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Данные профиля">
        {userProfile && (
          <ProfileEditForm
            userProfile={userProfile}
            onSave={handleUpdateProfile}
            onCancel={() => setIsEditing(false)}
            isLoading={isUpdatingProfile}
          />
        )}
      </Modal>
    </AuthGuard>
  );
}
