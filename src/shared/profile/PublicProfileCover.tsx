"use client";

import { UserProfile } from "@/types/user";

/** Обложка публичного профиля — только баннер */
export default function PublicProfileCover({ userProfile }: { userProfile: UserProfile }) {
  const bannerUrl = userProfile.equippedDecorations?.background || "/user/banner.jpg";

  return (
    <div className="relative w-full h-40 sm:h-48 md:h-56 overflow-hidden bg-[var(--secondary)]">
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

      <div className="absolute top-3 right-3 sm:right-6 z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-xs font-medium text-white border border-white/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Онлайн
        </span>
      </div>
    </div>
  );
}
