// src/app/profile/components/ProfileBanner.tsx
import { UserProfile } from "@/types/user";
import { EditAvatarButton, ProfileAvatar, UserInfo } from "@/shared";
import { useState } from "react";
import ProfileEditForm from "./profile-edit-form";

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
            <EditAvatarButton onAvatarUpdate={onAvatarUpdate} />
          </div>
        </div>
        {/* уровень пользователя */}
        <div className="absolute flex items-center space-x-1 top-4 right-4">
          {/* <ChevronsUp className="w-4 h-4" /> */}
          <span className="flex justify-center items-center text-md gap-1">
            {userProfile.level ? (
              <div className=" flex justify-center items-center w-6 h-8 border border-[var(--border)] font-bold p-2 bg-[var(--chart-1)] rounded-lg text-[var(--primary-)] ">
                {userProfile.level}
              </div>
            ) : (
              <div className=" flex justify-center items-center w-6 h-8 border border-[var(--border)] font-bold p-2 bg-[var(--chart-1)] rounded-lg text-[var(--primary)] ">
                0
              </div>
            )}{" "}
            <p className="font-medium italic text-[var(--muted-foreground)]">
              уровень
            </p>
          </span>
        </div>
        {/* опыт и баланс пользователя */}
        <div className="absolute flex items-center space-x-2 top-4 left-4">
          <span className="flex justify-center items-center text-sm gap-1">
            <div className="flex justify-center items-center px-2 py-1 border border-[var(--border)] font-medium bg-[var(--chart-2)] rounded-lg text-[var(--primary)]">
              {userProfile.experience || 0} XP
            </div>
            <div className="flex justify-center items-center px-2 py-1 border border-[var(--border)] font-medium bg-[var(--chart-3)] rounded-lg text-[var(--primary)]">
              {userProfile.balance || 0} ₽
            </div>
          </span>
        </div>
      </div>

      {/* Нижняя часть - информация */}
      <div className="pt-2 pb-6 px-8">
        {isEditing ? (
          <ProfileEditForm
            userProfile={userProfile}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <UserInfo userProfile={userProfile} onEdit={handleEdit} />
        )}
      </div>
    </div>
  );
}
