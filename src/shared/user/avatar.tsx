"use client";

import { useState, useEffect, useMemo } from "react";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { getImageUrls } from "@/lib/asset-url";

interface UserAvatarProps {
  avatarUrl?: string | null;
  username?: string;
  size?: number;
  className?: string;
  /** URL надетой рамки — отображается поверх аватара */
  frameUrl?: string | null;
  /** URL декорации «аватар» (персонаж) — показывается как основное изображение вместо avatarUrl */
  avatarDecorationUrl?: string | null;
}

export default function UserAvatar({
  avatarUrl,
  username,
  size = 40,
  className = "",
  frameUrl,
  avatarDecorationUrl,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const effectiveAvatarUrl = avatarDecorationUrl ?? avatarUrl;

  const { primary: avatarSrc, fallback: avatarFallback } = useMemo(() => {
    if (!effectiveAvatarUrl) return { primary: "", fallback: "" };
    if (effectiveAvatarUrl.startsWith("/uploads/") || effectiveAvatarUrl.startsWith("/")) {
      return getImageUrls(effectiveAvatarUrl);
    }
    if (effectiveAvatarUrl.startsWith("http")) {
      return getImageUrls(effectiveAvatarUrl);
    }
    return { primary: effectiveAvatarUrl, fallback: effectiveAvatarUrl };
  }, [effectiveAvatarUrl]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const content =
    !effectiveAvatarUrl || imageError || !isMounted ? (
      <div
        className={`rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold ${className}`}
        style={{ width: size, height: size }}
      >
        {username?.[0]?.toUpperCase() || "U"}
      </div>
    ) : (
      <OptimizedImage
        src={avatarSrc}
        fallbackSrc={avatarFallback !== avatarSrc ? avatarFallback : undefined}
        alt={`Аватар ${username || "пользователя"}`}
        width={size}
        height={size}
        className={`rounded-full object-cover h-10 w-10 ${className}`}
        onError={() => setImageError(true)}
        priority={size > 60}
        hidePlaceholder={true}
      />
    );

  if (frameUrl) {
    return (
      <div className="relative overflow-visible" style={{ width: size, height: size, borderRadius: "50%" }}>
        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: "50%" }}>{content}</div>
        <img
          src={frameUrl}
          alt=""
          className="absolute left-1/2 top-1/2 w-[calc(100%+3rem)] h-[calc(100%+3rem)] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none object-contain z-10 scale-125"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{ width: size, height: size, borderRadius: "50%" }}
    >
      <div
        className="absolute inset-0 overflow-hidden [&_img]:!object-cover"
        style={{ borderRadius: "50%" }}
      >
        {content}
      </div>
    </div>
  );
}
