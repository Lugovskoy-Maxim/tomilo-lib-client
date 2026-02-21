"use client";

import { UserProfile } from "@/types/user";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { getEquippedFrameUrl } from "@/api/shop";
import { useAuth } from "@/hooks/useAuth";
import { useResolvedEquippedFrameUrl } from "@/hooks/useEquippedFrameUrl";

const API_CONFIG = {
  basePublicUrl: process.env.NEXT_PUBLIC_URL || "http://localhost:3001",
};

interface UserAvatarProps {
  userProfile: UserProfile;
  /** sm = 96px (для сайдбара/обложки), md = 128–144px (по умолчанию) */
  size?: "sm" | "md";
}

const sizeClasses = {
  sm: "w-24 h-24 text-2xl",
  md: "w-32 h-32 sm:w-36 sm:h-36 text-3xl sm:text-4xl",
};

export default function ProfileAvatar({ userProfile, size = "md" }: UserAvatarProps) {
  const { user } = useAuth();
  const resolvedFrameUrl = useResolvedEquippedFrameUrl();
  const isCurrentUser = user && (userProfile._id === user._id || userProfile._id === user.id);

  const displayName =
    userProfile.username && userProfile.username.length > 0
      ? userProfile.username.charAt(0).toUpperCase()
      : "?";

  const sizeClass = sizeClasses[size];
  const pixelSize = size === "sm" ? 96 : 144;
  const frameUrl = isCurrentUser ? resolvedFrameUrl : getEquippedFrameUrl(userProfile.equippedDecorations);

  const avatarInner = userProfile.avatar ? (
    (() => {
      const avatarUrl = userProfile.avatar.startsWith("http")
        ? userProfile.avatar
        : `${API_CONFIG.basePublicUrl}${userProfile.avatar}`;
      return (
        <OptimizedImage
          src={avatarUrl}
          alt={userProfile.username || "User avatar"}
          className="w-full h-full object-cover"
          height={pixelSize}
          width={pixelSize}
          priority={true}
        />
      );
    })()
  ) : (
    <span className="drop-shadow-lg">{displayName}</span>
  );

  const hasImage = Boolean(userProfile.avatar);
  const wrapperClass = `relative ${sizeClass} rounded-full overflow-hidden border-4 border-[var(--background)] shadow-2xl glow-avatar transition-transform duration-300 group-hover:scale-105 ${
    hasImage ? "" : "bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)] flex items-center justify-center text-white font-bold"
  }`;

  return (
    <div className="relative group">
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--chart-1)] to-[var(--chart-2)] opacity-75 group-hover:opacity-100 blur-sm transition-all duration-500" />
      <div className="absolute -inset-2 rounded-full bg-[var(--primary)]/20 blur-xl transition-all duration-500" />
      <div className={wrapperClass}>
        {avatarInner}
        {frameUrl && (
          <img
            src={frameUrl}
            alt=""
            className="absolute inset-0 w-full h-full rounded-full pointer-events-none object-contain z-10"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
