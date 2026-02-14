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
    <div className="flex flex-col rounded-2xl border border-[var(--border)] mb-6 overflow-hidden w-full bg-[var(--card)] shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] animate-fade-in-up">
      <div className="relative h-44 sm:h-56 lg:h-64 overflow-hidden">
        <img
          src={bannerUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={e => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-[var(--card)]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--card)]/90 backdrop-blur-sm text-xs font-medium text-[var(--foreground)] border border-[var(--border)]/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Онлайн
          </span>
        </div>

        <div className="absolute left-4 sm:left-6 bottom-0 z-10 translate-y-1/2">
          <div className="relative ring-4 ring-[var(--card)] rounded-2xl shadow-lg overflow-hidden bg-[var(--card)]">
            <div className="rounded-xl overflow-hidden">
              <ProfileAvatar userProfile={userProfile} />
              <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
                <RankStarsOverlay userProfile={userProfile} size={150} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative pt-14 sm:pt-16 pb-5 px-4 sm:px-6 sm:pb-6 bg-[var(--card)]">
        <UserInfo userProfile={userProfile} />
      </div>
      <div className="px-4 sm:px-6 pb-6 sm:pb-8 border-t border-[var(--border)]/60 bg-[var(--card)]">
        <ProfileStats userProfile={userProfile} />
      </div>
    </div>
  );
}
