"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGetUserProfileDecorationsQuery } from "@/store/api/shopApi";
import { getEquippedFrameUrl, getDecorationImageUrl } from "@/api/shop";

/**
 * Возвращает URL изображения надетой рамки/аватара для текущего пользователя.
 * Если бэкенд отдаёт в equippedDecorations ID декорации (а не URL), подставляет
 * imageUrl из GET /shop/profile/decorations.
 */
export function useResolvedEquippedFrameUrl(): string | null {
  const { user } = useAuth();
  const equipped = user?.equippedDecorations;
  const { data: userDecorations = [] } = useGetUserProfileDecorationsQuery(undefined, {
    skip: !user,
  });

  return useMemo(() => {
    if (!equipped) return null;
    const raw = equipped.frame ?? equipped.avatar;
    if (!raw || typeof raw !== "string") return null;

    const isLikelyUrl = raw.startsWith("http") || raw.startsWith("/");
    if (isLikelyUrl) {
      return getEquippedFrameUrl(equipped);
    }

    const decoration = userDecorations.find(
      (d) => (d.id === raw || (d as { _id?: string })._id === raw) && (d.type === "frame" || d.type === "avatar"),
    );
    if (decoration?.imageUrl) {
      const url = getDecorationImageUrl(decoration.imageUrl);
      return url || null;
    }

    return getEquippedFrameUrl(equipped);
  }, [equipped, userDecorations]);
}
