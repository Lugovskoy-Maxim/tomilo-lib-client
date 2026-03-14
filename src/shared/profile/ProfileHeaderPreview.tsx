"use client";

import Image from "next/image";
import { getRankColor, levelToRank } from "@/lib/rank-utils";

type ProfileHeaderPreviewProps = {
  username: string;
  level?: number;
  /** Базовый аватар пользователя (или уже с декорацией). */
  avatarUrl: string;
  /** Надетая рамка (опционально). */
  frameUrl?: string | null;
  /** Надетый фон/баннер (опционально). */
  backgroundUrl?: string | null;
  /** Уменьшенная версия для предпросмотра. */
  compact?: boolean;
};

function AvatarWithFramePreview({
  avatarUrl,
  frameUrl,
  size,
}: {
  avatarUrl: string;
  frameUrl?: string | null;
  size: number;
}) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="relative overflow-hidden border-2 border-[var(--background)] shadow-lg rounded-full bg-[var(--muted)]"
        style={{ width: size, height: size }}
      >
        <Image src={avatarUrl} alt="" fill unoptimized className="object-cover rounded-full" />
      </div>
      {frameUrl && (
        <img
          src={frameUrl}
          alt=""
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none object-contain z-10"
          style={{
            width: size * 1.2,
            height: size * 1.2,
            maxWidth: "none",
            maxHeight: "none",
          }}
          aria-hidden
        />
      )}
    </div>
  );
}

export default function ProfileHeaderPreview({
  username,
  level = 1,
  avatarUrl,
  frameUrl = null,
  backgroundUrl = null,
  compact = true,
}: ProfileHeaderPreviewProps) {
  // В профиле это /user/banner.jpg, поверх — надетый фон.
  const baseBannerUrl = "/user/banner.jpg";
  const bannerHeightClass = compact ? "h-36 sm:h-40" : "h-44 sm:h-56 lg:h-64";
  const avatarSize = compact ? 40 : 144;
  const avatarPad = compact ? "p-1.5" : "p-4 sm:p-6";
  const lvl = Math.max(1, level);
  const rankColor = getRankColor(levelToRank(lvl).rank);

  return (
    <div className="flex flex-col w-full">
      <div className={`relative ${bannerHeightClass} overflow-hidden bg-[var(--secondary)]`}>
        <Image
          src={baseBannerUrl}
          alt=""
          fill
          unoptimized
          className="absolute inset-0 object-cover object-top"
        />
        {backgroundUrl && (
          <Image
            src={backgroundUrl}
            alt=""
            fill
            unoptimized
            className="absolute inset-0 object-cover object-top z-10 pointer-events-none"
            aria-hidden
          />
        )}

        {/* Блок аватар + ник + уровень над фоном (имитация профиля) */}
        <div className="absolute left-2 sm:left-3 bottom-12 right-2 sm:right-3 z-30 translate-y-1/2">
          <div className="flex items-center gap-2 px-2 py-1.5 sm:gap-2.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-[var(--border)]/80 bg-[var(--background)] shadow-md ring-1 ring-[var(--background)] min-w-0">
            <div
              className={`relative shrink-0 rounded-lg overflow-hidden bg-[var(--background)] ${avatarPad} flex items-center justify-center`}
            >
              <AvatarWithFramePreview avatarUrl={avatarUrl} frameUrl={frameUrl} size={avatarSize} />
            </div>
            <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-nowrap">
              <span className="font-semibold text-xs text-[var(--foreground)] truncate min-w-0">
                {username}
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[var(--secondary)] border border-[var(--border)] text-[10px] font-medium text-[var(--foreground)] shrink-0 whitespace-nowrap">
                <span
                  className="w-3.5 h-3.5 rounded text-[9px] font-bold inline-flex items-center justify-center"
                  style={{ backgroundColor: `${rankColor}25`, color: rankColor }}
                >
                  {lvl}
                </span>
                Уровень
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
