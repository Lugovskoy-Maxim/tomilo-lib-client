"use client";

import { useState, useEffect } from "react";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";

interface UserAvatarProps {
  avatarUrl?: string | null;
  username?: string;
  size?: number;
  className?: string;
}

export default function UserAvatar({
  avatarUrl,
  username,
  size = 40,
  className = "",
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Если аватар не загружен или произошла ошибка, показываем заглушку
  if (!avatarUrl || imageError || !isMounted) {
    return (
      <div
        className={`rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold ${className}`}
        style={{ width: size, height: size }}
      >
        {username?.[0]?.toUpperCase() || "U"}
      </div>
    );
  }

  return (
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
    />
  );
}
