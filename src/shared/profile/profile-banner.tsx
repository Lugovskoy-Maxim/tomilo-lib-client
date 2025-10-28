// src/app/profile/components/ProfileBanner.tsx
import { UserProfile } from "@/types/user";
import { EditAvatarButton, ProfileAvatar, UserInfo } from "@/shared";


interface ProfileBannerProps {
  userProfile: UserProfile;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

export default function ProfileBanner({ userProfile, onAvatarUpdate }: ProfileBannerProps) {
  return (
    <div className="bg-[var(--secondary)] rounded-xl border border-[var(--border)] overflow-hidden mb-8">
      {/* Верхняя часть - баннер */}
      <div className="h-32 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--chart-1)]/20 relative">
        {/* Аватар, перекрывающий обе части */}
        <div className="absolute left-8 -bottom-16">
          <div className="relative">
            <ProfileAvatar userProfile={userProfile} />
            <EditAvatarButton onAvatarUpdate={onAvatarUpdate} />
          </div>
        </div>
      </div>

      {/* Нижняя часть - информация */}
      <div className="pt-2 pb-6 px-8">
        <UserInfo userProfile={userProfile} />
      </div>
    </div>
  );
}