// src/app/profile/components/ProfileBanner.tsx
import { UserProfile } from "@/types/user";
import { EditAvatarButton, ProfileAvatar, UserInfo } from "@/shared";

interface ProfileBannerProps {
  userProfile: UserProfile;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

export default function ProfileBanner({
  userProfile,
  onAvatarUpdate,
}: ProfileBannerProps) {
  return (
    <div className="bg-[var(--secondary)] rounded-xl border border-[var(--border)] overflow-hidden mb-8">
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
      </div>

      {/* Нижняя часть - информация */}
      <div className="pt-2 pb-6 px-8">
        <UserInfo userProfile={userProfile} />
      </div>
    </div>
  );
}
