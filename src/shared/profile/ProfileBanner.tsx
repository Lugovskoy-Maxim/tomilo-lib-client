"use client";

import { UserProfile } from "@/types/user";
import { EditAvatarButton, ProfileAvatar, UserInfo } from "@/shared";
import { getEquippedBackgroundUrl } from "@/api/shop";
import RankStarsOverlay from "./RankStarsOverlay";
import ProfileStats from "./ProfileStats";
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

  // Сначала пользовательский/дефолтный баннер, поверх — надетый фон из магазина
  const baseBannerUrl = "/user/banner.jpg";
  const equippedBackgroundUrl = getEquippedBackgroundUrl(userProfile.equippedDecorations);

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
    <div className="flex flex-col w-full animate-fade-in-up">
      {/* Баннер как фон/обложка — без карточки, полноширинный блок */}
      <div className="relative h-44 sm:h-56 lg:h-64 overflow-hidden bg-[var(--secondary)]">
        <img
          src={baseBannerUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={e => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
        {equippedBackgroundUrl && (
          <img
            src={equippedBackgroundUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center z-10 pointer-events-none"
            aria-hidden
          />
        )}
        {/* Жёсткий переход в цвет фона — как в layout профиля (и для декоративного баннера) */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{ background: "linear-gradient(to top, var(--background) 0%, var(--background) 45%, transparent 65%)" }}
          aria-hidden
        />

        <div className="absolute top-3 right-3 z-30">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-xs font-medium text-white border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Онлайн
          </span>
        </div>

        <div className="absolute left-4 sm:left-6 bottom-0 z-30 translate-y-1/2">
          <div className="relative ring-4 ring-[var(--background)] rounded-2xl shadow-lg overflow-hidden bg-[var(--background)]">
            <div className="rounded-xl overflow-hidden">
              <ProfileAvatar userProfile={userProfile} />
              <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
                <RankStarsOverlay userProfile={userProfile} size={150} />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 z-20">
              <EditAvatarButton onAvatarUpdate={onAvatarUpdate} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative pt-14 sm:pt-16 pb-5 px-4 sm:px-6 sm:pb-6 bg-[var(--background)]">
        <UserInfo userProfile={userProfile} onEdit={handleEdit} />
      </div>

      <div className="px-4 sm:px-6 pb-6 sm:pb-8 border-t border-[var(--border)]/60 bg-[var(--background)]">
        <ProfileStats userProfile={userProfile} />
      </div>

      {/* Модальное окно редактирования профиля */}
      <Modal isOpen={isEditing} onClose={handleCancel} title="Редактирование профиля">
        <ProfileEditForm userProfile={userProfile} onSave={handleSave} onCancel={handleCancel} />
      </Modal>
    </div>
  );
}
