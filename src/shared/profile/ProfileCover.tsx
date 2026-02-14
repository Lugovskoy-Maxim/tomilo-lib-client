"use client";

import { UserProfile } from "@/types/user";

interface ProfileCoverProps {
  userProfile: UserProfile;
}

/** Полноширинная обложка профиля — только баннер, без аватара (аватар в сайдбаре) */
export default function ProfileCover({ userProfile }: ProfileCoverProps) {
  const bannerUrl = userProfile.equippedDecorations?.background || "/user/banner.jpg";

  return (
    <div className="relative w-full h-32 min-[360px]:h-40 sm:h-48 md:h-56 overflow-hidden bg-[var(--secondary)]">
      <img
        src={bannerUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
        onError={e => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-transparent" />

      <div className="absolute top-2 right-2 min-[360px]:top-3 min-[360px]:right-3 sm:right-6 z-10">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 min-[360px]:px-2.5 min-[360px]:py-1 rounded-full bg-black/30 backdrop-blur-sm text-[10px] min-[360px]:text-xs font-medium text-white border border-white/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Онлайн
        </span>
      </div>
    </div>
  );
}
