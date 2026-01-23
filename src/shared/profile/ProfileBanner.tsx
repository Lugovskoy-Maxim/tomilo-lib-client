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
    <div className="bg-[var(--secondary)] rounded-xl border border-[var(--border)] overflow-hidden mb-2">
      {/* Верхняя часть - баннер */}
      <div className="h-42 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--chart-1)]/20 relative">
        {/* Аватар, перекрывающий обе части */}
        <div className="absolute left-8 -bottom-16">
          <div className="relative">
            <ProfileAvatar userProfile={userProfile} />
            <RankStarsOverlay userProfile={userProfile} />
            <EditAvatarButton onAvatarUpdate={onAvatarUpdate} />
          </div>
        </div>
        {/* Статистика пользователя в верхней части */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          {/* Опыт и баланс */}
          <div className="flex items-center space-x-2">
            <div className="flex justify-center items-center px-3 py-1 border border-[var(--border)] font-medium bg-[var(--chart-2)] rounded-lg text-[var(--primary)] text-sm">
              {userProfile.experience || 0} XP
            </div>
            <div className="flex justify-center items-center px-3 py-1 border border-[var(--border)] font-medium bg-[var(--chart-3)] rounded-lg text-[var(--primary)] text-sm">
              <CircleDollarSign className="w-4 h-4 mr-1" />
              {userProfile.balance || 0}
            </div>
          </div>

          {/* Уровень */}
          {/* <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-[var(--muted-foreground)]">Уровень</span>
            <div className="flex justify-center items-center w-8 h-8 border border-[var(--border)] font-bold bg-[var(--chart-1)] rounded-lg text-[var(--primary)]">
              {userProfile.level || 0}
            </div>
          </div> */}
        </div>
      </div>

      {/* Нижняя часть - информация */}
      <div className="pt-2 pb-6 px-8">
        <UserInfo userProfile={userProfile} onEdit={handleEdit} />
      </div>

      {/* Статистика пользователя */}
      <div className="px-8 pb-6">
        <ProfileStats userProfile={userProfile} />
      </div>

      <Modal isOpen={isEditing} onClose={handleCancel} title="Редактирование профиля">
        <ProfileEditForm userProfile={userProfile} onSave={handleSave} onCancel={handleCancel} />
      </Modal>
    </div>
  );
}
