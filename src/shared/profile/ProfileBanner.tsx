
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

  // Получаем URL баннера: пользовательский или дефолтный
  const bannerUrl = userProfile.equippedDecorations?.background || "/user/banner.jpg";

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
    <div className="flex flex-col bg-[var(--secondary)] rounded-xl border border-[var(--border)] mb-2 overflow-hidden w-full">
      {/* Верхняя часть - баннер с аватаром */}
      <div className="relative flex flex-col items-center justify-center h-48 sm:h-62">
        {/* Изображение баннера - на весь контейнер */}
        <img
          src={bannerUrl}
          alt="Баннер профиля"
          className="absolute inset-0 w-full h-full object-cover "
          onError={(e) => {
            // Fallback на градиент при ошибке загрузки
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        
        {/* Градиентный фон (виден если картинка не загрузилась) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--chart-1)]/20" />

        {/* Статистика пользователя в верхней части */}
        <div className="absolute top-3 left-4 right-4 sm:top-4 sm:left-4 sm:right-4 flex justify-between items-center gap-2 z-10">
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

        {/* Аватар - перекрывает низ баннера */}
        <div className="absolute left-1/2 -translate-x-1/2 sm:left-8 -bottom-16 sm:-translate-x-0 z-20">
          <div className="relative">
            <ProfileAvatar userProfile={userProfile} />
            <RankStarsOverlay userProfile={userProfile} />
            <EditAvatarButton onAvatarUpdate={onAvatarUpdate} />
          </div>
        </div>
      </div>

      {/* Нижняя часть - информация о пользователе */}
      <div className="pt-16 pb-4 px-4 sm:pt-4 sm:pb-6 sm:px-8">
        <UserInfo userProfile={userProfile} onEdit={handleEdit} />
      </div>

      {/* Статистика пользователя */}
      <div className="px-4 pb-4 sm:px-8 sm:pb-6">
        <ProfileStats userProfile={userProfile} />
      </div>

      {/* Модальное окно редактирования профиля */}
      <Modal isOpen={isEditing} onClose={handleCancel} title="Редактирование профиля">
        <ProfileEditForm userProfile={userProfile} onSave={handleSave} onCancel={handleCancel} />
      </Modal>
    </div>
  );
}


