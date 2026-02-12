"use client";

import { UserProfile } from "@/types/user";
import { ProfileAvatar, UserInfo } from "@/shared";
import RankStarsOverlay from "./RankStarsOverlay";
import ProfileStats from "./ProfileStats";

interface PublicProfileBannerProps {
  userProfile: UserProfile;
}

export default function PublicProfileBanner({ userProfile }: PublicProfileBannerProps) {
  const bannerUrl = userProfile.equippedDecorations?.background || "/user/banner.jpg";

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border)] mb-4 overflow-hidden w-full shadow-xl animate-fade-in-up bg-[var(--card)]">
      <div className="relative flex flex-col items-center justify-center h-56 sm:h-72 lg:h-80">
        <img
          src={bannerUrl}
          alt="Баннер профиля"
          className="absolute inset-0 w-full h-full object-cover"
          onError={e => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/30 via-[var(--chart-1)]/20 to-[var(--chart-2)]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent" />
        <div className="absolute top-4 right-4 flex gap-2">
          <div className="glass px-3 py-1.5 rounded-full text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Онлайн
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0 -bottom-14 sm:-bottom-16 z-10">
          <div className="relative">
            <ProfileAvatar userProfile={userProfile} />
            <div className="absolute inset-0 pointer-events-none">
              <RankStarsOverlay userProfile={userProfile} size={150} />
            </div>
          </div>
        </div>
      </div>
      <div className="relative pt-16 pb-6 px-4 sm:pt-6 sm:pb-8 sm:px-8">
        <UserInfo userProfile={userProfile} />
      </div>
      <div className="px-4 pb-6 sm:px-8 sm:pb-8">
        <ProfileStats userProfile={userProfile} />
      </div>
    </div>
  );
}
