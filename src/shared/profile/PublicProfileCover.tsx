"use client";

import { UserProfile } from "@/types/user";

interface PublicProfileCoverProps {
  userProfile: UserProfile;
  /** Когда true, фон рисует родитель (один общий фон без дублирования и растяжения) */
  backgroundFromParent?: boolean;
}

/** Обложка публичного профиля — только баннер */
export default function PublicProfileCover({ backgroundFromParent }: PublicProfileCoverProps) {
  const baseBannerUrl = "/user/banner.jpg";

  return (
    <div className="relative w-full h-32 min-[360px]:h-40 sm:h-48 md:h-56 overflow-hidden bg-[var(--secondary)]">
      {!backgroundFromParent && (
        <img
          src={baseBannerUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={e => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      )}

      <div className="absolute top-2 right-2 min-[360px]:top-3 min-[360px]:right-3 sm:right-6 z-30">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 min-[360px]:px-2.5 min-[360px]:py-1 rounded-full bg-[var(--card)]/85 text-[10px] min-[360px]:text-xs font-medium text-[var(--foreground)] border border-[var(--border)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Онлайн
        </span>
      </div>
    </div>
  );
}
