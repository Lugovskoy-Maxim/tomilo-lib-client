"use client";
import { UserProfile } from "@/types/user";
import { EditAvatarButton, ProfileAvatar, UserInfo } from "@/shared";
import RankStarsOverlay from "./RankStarsOverlay";
import ProfileStats from "./ProfileStats";
import { CircleDollarSign } from "lucide-react";
import { useState } from "react";
import ProfileEditForm from "./ProfileEditForm";
import Modal from "@/shared/modal/modal";

interface ProfileBannerProps {
  userProfile: UserProfile;
  onAvatarUpdate: (newAvatarUrl: string) => void;
  onUpdateProfile: (updatedProfile: Partial<UserProfile>) => void;
}

export default function ProfileBanner({
  userProfile,
  onAvatarUpdate,
  onUpdateProfile,
}: ProfileBannerProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = (updatedProfile: Partial<UserProfile>) => {
    onUpdateProfile(updatedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="bg-[var(--secondary)] rounded-xl border border-[var(--border)] mb-2">
      {/* Верхняя часть - баннер */}
      <div className="h-32 sm:h-42 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--chart-1)]/20 relative">
        {/* Аватар, перекрывающий обе части */}
        <div className="absolute left-1/2 -translate-x-1/2 sm:left-8 -bottom-12 sm:-translate-x-0 sm:-bottom-16 z-20">
          <div className="relative">
            <ProfileAvatar userProfile={userProfile} />
            <RankStarsOverlay userProfile={userProfile} />
            <EditAvatarButton onAvatarUpdate={onAvatarUpdate} />
          </div>
        </div>
        {/* Статистика пользователя в верхней части */}
        <div className="absolute top-3 left-4 right-4 sm:top-4 sm:left-4 sm:right-4 flex justify-between items-center gap-2">
          {/* Опыт и баланс */}
          <div className="flex items-center gap-1.5 sm:space-x-2">
            <div className="flex justify-center items-center px-2 py-0.5 sm:px-3 sm:py-1 border border-[var(--border)] font-medium bg-[var(--chart-2)] rounded-lg text-[var(--primary)] text-xs sm:text-sm">
              {userProfile.experience || 0} XP
            </div>
            <div className="flex justify-center items-center px-2 py-0.5 sm:px-3 sm:py-1 border border-[var(--border)] font-medium bg-[var(--chart-3)] rounded-lg text-[var(--primary)] text-xs sm:text-sm">
              <CircleDollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              {userProfile.balance || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя часть - информация */}
      <div className="pt-20 pb-4 px-4 sm:pt-2 sm:pb-6 sm:px-8">
        <UserInfo userProfile={userProfile} onEdit={handleEdit} />
      </div>

      {/* Статистика пользователя */}
      <div className="px-4 pb-4 sm:px-8 sm:pb-6">
        <ProfileStats userProfile={userProfile} />
      </div>

      <Modal isOpen={isEditing} onClose={handleCancel} title="Редактирование профиля">
        <ProfileEditForm userProfile={userProfile} onSave={handleSave} onCancel={handleCancel} />
      </Modal>
    </div>
  );
}
