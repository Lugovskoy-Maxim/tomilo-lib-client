"use client";

import { UserProfile } from "@/types/user";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import {
  getEquippedFrameUrl,
  getEquippedAvatarDecorationUrl,
  getDecorationImageUrls,
} from "@/api/shop";
import { getImageUrls, isValidAvatarUrl } from "@/lib/asset-url";
import { formatUsernameDisplay } from "@/lib/username-display";
import { useAuth } from "@/hooks/useAuth";
import { useResolvedEquippedDecorations } from "@/hooks/useEquippedFrameUrl";

interface UserAvatarProps {
  userProfile: UserProfile;
  /** sm = 96px (сайдбар), md = 128–144px, lg = 144px (баннер, фиксировано) */
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-24 h-24 text-2xl",
  md: "w-32 h-32 sm:w-36 sm:h-36 text-3xl sm:text-4xl",
  lg: "w-36 h-36 text-4xl",
};

const DEFAULT_AVATAR = "/logo/ring_logo.png";

/** URL декорации «аватар» из профиля (при populate объект с imageUrl или _id). */
function getAvatarDecorationUrls(equipped: UserProfile["equippedDecorations"]): {
  primary: string | null;
  fallback: string | null;
} {
  if (!equipped?.avatar) return { primary: null, fallback: null };
  const raw = equipped.avatar;
  if (typeof raw === "string") {
    const url = getEquippedAvatarDecorationUrl(equipped);
    if (url) {
      const { primary, fallback } = getDecorationImageUrls(url);
      return { primary, fallback };
    }
    return { primary: null, fallback: null };
  }
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    const imageUrl = (o.imageUrl ?? o.image_url) as string | undefined;
    if (imageUrl) {
      const { primary, fallback } = getDecorationImageUrls(imageUrl);
      return { primary: primary || imageUrl, fallback: fallback || imageUrl };
    }
  }
  const url = getEquippedAvatarDecorationUrl(equipped);
  if (url) {
    const { primary, fallback } = getDecorationImageUrls(url);
    return { primary, fallback };
  }
  return { primary: null, fallback: null };
}

export default function ProfileAvatar({ userProfile, size = "md" }: UserAvatarProps) {
  const { user } = useAuth();
  const { frameUrl: resolvedFrameUrl, avatarDecorationUrl: resolvedAvatarUrl } =
    useResolvedEquippedDecorations();
  const isCurrentUser = Boolean(
    user &&
      (userProfile._id === user._id ||
        userProfile._id === user.id ||
        (userProfile.username && userProfile.username === user.username)),
  );

  const sizeClass = sizeClasses[size];
  const pixelSize = size === "sm" ? 96 : 144;
  const frameUrl = isCurrentUser
    ? resolvedFrameUrl
    : getEquippedFrameUrl(userProfile.equippedDecorations);

  const effectiveAvatar = isValidAvatarUrl(userProfile.avatar) ? userProfile.avatar : null;
  const baseAvatarWithCacheBust =
    effectiveAvatar && userProfile.updatedAt
      ? `${effectiveAvatar}${effectiveAvatar.includes("?") ? "&" : "?"}t=${new Date(userProfile.updatedAt).getTime()}`
      : effectiveAvatar;
  const { primary: baseAvatarPrimary, fallback: baseAvatarFallback } = baseAvatarWithCacheBust
    ? getImageUrls(baseAvatarWithCacheBust)
    : { primary: null, fallback: null };

  const decorationFromProfile = getAvatarDecorationUrls(userProfile.equippedDecorations);
  const decorationUrls = isCurrentUser
    ? { primary: resolvedAvatarUrl ?? decorationFromProfile.primary, fallback: decorationFromProfile.fallback }
    : decorationFromProfile;

  const mainImageUrl = decorationUrls.primary ?? baseAvatarPrimary ?? DEFAULT_AVATAR;
  const fallbackImageUrl = decorationUrls.fallback ?? baseAvatarFallback ?? DEFAULT_AVATAR;
  const displayUsername = userProfile.username ? formatUsernameDisplay(userProfile.username) : "";
  const initial = displayUsername?.[0]?.toUpperCase() || "?";

  const avatarInner = (
    <OptimizedImage
      src={mainImageUrl}
      fallbackSrc={
        fallbackImageUrl && fallbackImageUrl !== mainImageUrl ? fallbackImageUrl : DEFAULT_AVATAR
      }
      errorSrc={DEFAULT_AVATAR}
      errorContent={
        <div
          className={`${sizeClass} bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center rounded-full font-semibold`}
          style={{ width: "100%", aspectRatio: "1 / 1" }}
          aria-hidden
        >
          {initial}
        </div>
      }
      alt={displayUsername || "User avatar"}
      className="w-full h-full object-cover rounded-full"
      height={pixelSize}
      width={pixelSize}
      priority={true}
    />
  );

  const avatarDecorationUrl = decorationUrls.primary;
  const hasDecoration = Boolean(frameUrl || avatarDecorationUrl);
  const wrapperClass = `relative ${sizeClass} aspect-square shrink-0 rounded-full overflow-hidden shadow-2xl glow-avatar transition-transform duration-300 group-hover:scale-105 ${
    hasDecoration ? "" : "border-4 border-[var(--background)]"
  }`;

  return (
    <div className={`group relative overflow-visible ${sizeClass}`}>
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--chart-1)] to-[var(--chart-2)] opacity-75 group-hover:opacity-100 blur-sm transition-all duration-500" />
      <div className="absolute -inset-2 rounded-full blur-xl transition-all duration-500" />
      <div className={wrapperClass}>{avatarInner}</div>
      {frameUrl && (
        <img
          src={frameUrl}
          alt=""
          className="absolute left-1/2 top-1/2 w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2 pointer-events-none object-contain z-10"
          style={{ maxWidth: "none", maxHeight: "none" }}
          aria-hidden
        />
      )}
    </div>
  );
}
