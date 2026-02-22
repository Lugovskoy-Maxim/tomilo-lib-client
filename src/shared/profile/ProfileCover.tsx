"use client";

import { UserProfile } from "@/types/user";
import { getEquippedBackgroundUrl } from "@/api/shop";

interface ProfileCoverProps {
  userProfile: UserProfile;
  /** Когда true, фон рисует родитель (один общий фон без дублирования и растяжения) */
  backgroundFromParent?: boolean;
}

/** Полноширинная обложка профиля — только баннер, без аватара (аватар в сайдбаре) */
export default function ProfileCover({ userProfile, backgroundFromParent }: ProfileCoverProps) {
  const baseBannerUrl = "/user/banner.jpg";
  const equippedBackgroundUrl = getEquippedBackgroundUrl(userProfile.equippedDecorations);

  return (
    <div className="relative w-full h-32 min-[360px]:h-40 sm:h-48 md:h-56 overflow-hidden bg-[var(--secondary)]">
      {!backgroundFromParent && (
        <>
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
        </>
      )}
      {/* Жёсткий переход в цвет фона — и для декоративного баннера */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{ background: "linear-gradient(to top, var(--background) 0%, var(--background) 45%, transparent 65%)" }}
        aria-hidden
      />

      <div className="absolute top-2 right-2 min-[360px]:top-3 min-[360px]:right-3 sm:right-6 z-30">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 min-[360px]:px-2.5 min-[360px]:py-1 rounded-full bg-black/30 backdrop-blur-sm text-[10px] min-[360px]:text-xs font-medium text-white border border-white/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Онлайн
        </span>
      </div>
    </div>
  );
}
