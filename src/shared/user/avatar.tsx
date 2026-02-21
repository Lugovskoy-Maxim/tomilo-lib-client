"use client";

import { useState, useEffect } from "react";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";

interface UserAvatarProps {
  avatarUrl?: string | null;
  username?: string;
  size?: number;
  className?: string;
  /** URL надетой рамки — отображается поверх аватара */
  frameUrl?: string | null;
}

export default function UserAvatar({
  avatarUrl,
  username,
  size = 40,
  className = "",
  frameUrl,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const content =
    !avatarUrl || imageError || !isMounted ? (
      <div
        className={`rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold ${className}`}
        style={{ width: size, height: size }}
      >
        {username?.[0]?.toUpperCase() || "U"}
      </div>
    ) : (
      <OptimizedImage
        src={
          avatarUrl.startsWith("/uploads/")
            ? `${process.env.NEXT_PUBLIC_URL || "http://localhost:3001"}${avatarUrl}`
            : avatarUrl
        }
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
      <div className="relative rounded-full" style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-full overflow-hidden">{content}</div>
        <img
          src={frameUrl}
          alt=""
          className="absolute inset-0 w-full h-full rounded-full pointer-events-none object-contain z-10"
          aria-hidden
        />
      </div>
    );
  }

  return content;
}
