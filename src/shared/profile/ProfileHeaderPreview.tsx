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
  const bannerHeightClass = compact ? "h-28 sm:h-32" : "h-44 sm:h-56 lg:h-64";
  const avatarSize = compact ? 56 : 144;
  const avatarPadClass = compact ? "p-2.5" : "p-10 sm:p-12";
  const lvl = Math.max(1, level);
  const rankColor = getRankColor(levelToRank(lvl).rank);

  return (
    <div className="flex flex-col w-full">
      <div className={`relative ${bannerHeightClass} overflow-hidden bg-[var(--secondary)]`}>
        <Image src={baseBannerUrl} alt="" fill unoptimized className="absolute inset-0 object-cover object-center" />
        {backgroundUrl && (
          <Image
            src={backgroundUrl}
            alt=""
            fill
            unoptimized
            className="absolute inset-0 object-cover object-center z-10 pointer-events-none"
            aria-hidden
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{ background: "linear-gradient(to top, var(--background) 0%, var(--background) 45%, transparent 65%)" }}
          aria-hidden
        />

        <div className="absolute top-3 right-3 z-30">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-xs font-medium text-white border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Онлайн
          </span>
        </div>

        <div className="absolute left-4 sm:left-6 bottom-0 z-30 translate-y-1/2">
          <div className={`relative ring-4 ring-[var(--background)] rounded-2xl shadow-lg bg-[var(--background)] ${avatarPadClass} flex items-center justify-center min-w-[72px] min-h-[72px]`}>
            <AvatarWithFramePreview avatarUrl={avatarUrl} frameUrl={frameUrl} size={avatarSize} />
          </div>
        </div>
      </div>

      <div className={compact ? "relative pt-10 pb-4 px-4 bg-[var(--background)]" : "relative pt-14 sm:pt-16 pb-5 px-4 sm:px-6 sm:pb-6 bg-[var(--background)]"}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="font-semibold text-[var(--foreground)] truncate">{username}</div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--secondary)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)] shrink-0">
            <span
              className="w-4 h-4 rounded text-[10px] font-bold inline-flex items-center justify-center"
              style={{ backgroundColor: `${rankColor}25`, color: rankColor }}
            >
              {lvl}
            </span>
            Уровень
          </span>
        </div>
      </div>
    </div>
  );
}

