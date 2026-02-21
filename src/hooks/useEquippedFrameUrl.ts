"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGetProfileQuery } from "@/store/api/authApi";
import { useGetUserProfileDecorationsQuery } from "@/store/api/shopApi";
import {
  getEquippedFrameUrl,
  getEquippedAvatarDecorationUrl,
  getDecorationImageUrl,
} from "@/api/shop";
import type { EquippedDecorations } from "@/types/user";

/** Нормализует equipped из ответа API (camelCase или snake_case, объект или строки). */
function getEquippedFromProfile(profileData: unknown): EquippedDecorations | null {
  if (!profileData || typeof profileData !== "object") return null;
  const p = profileData as Record<string, unknown>;
  const eq = (p.equippedDecorations ?? p.equipped_decorations) as EquippedDecorations | undefined;
  if (!eq || typeof eq !== "object") return null;
  const frame = (eq.frame ?? (eq as Record<string, unknown>).frame) as string | object | undefined;
  const avatar = (eq.avatar ?? (eq as Record<string, unknown>).avatar) as string | object | undefined;
  return { ...eq, frame: frame ?? undefined, avatar: avatar ?? undefined } as EquippedDecorations;
}

function resolveUrl(
  raw: string | object | null | undefined,
  type: "frame" | "avatar",
  userDecorations: { id: string; type: string; imageUrl?: string }[],
): string | null {
  if (raw == null) return null;
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const imageUrl = (o.imageUrl ?? o.image_url) as string | undefined;
    if (imageUrl) return getDecorationImageUrl(imageUrl) || imageUrl;
    const id = (o.id ?? o._id) as string | undefined;
    if (id) {
      const d = userDecorations.find(
        (x) => (x.id === id || (x as { _id?: string })._id === id) && x.type === type,
      );
      if (d?.imageUrl) return getDecorationImageUrl(d.imageUrl) || null;
    }
    return null;
  }
  const str = String(raw).trim();
  if (!str) return null;
  if (str.startsWith("http") || str.startsWith("/")) {
    return type === "frame" ? getEquippedFrameUrl({ frame: str }) : getEquippedAvatarDecorationUrl({ avatar: str });
  }
  const d = userDecorations.find(
    (x) => (x.id === str || (x as { _id?: string })._id === str) && x.type === type,
  );
  if (d?.imageUrl) return getDecorationImageUrl(d.imageUrl) || null;
  return type === "frame" ? getEquippedFrameUrl({ frame: str }) : getEquippedAvatarDecorationUrl({ avatar: str });
}

export type ResolvedEquipped = { frameUrl: string | null; avatarDecorationUrl: string | null };

/**
 * Возвращает URL рамки и URL декорации «аватар» для текущего пользователя.
 * Данные из GET /users/profile и при необходимости из GET /shop/profile/decorations.
 */
export function useResolvedEquippedDecorations(): ResolvedEquipped {
  const { user } = useAuth();
  const { data: profileResponse } = useGetProfileQuery(undefined, { skip: !user });
  const profileUser = profileResponse?.success ? profileResponse.data : null;
  const equipped = useMemo(
    () => getEquippedFromProfile(profileUser) ?? user?.equippedDecorations ?? null,
    [profileUser, user?.equippedDecorations],
  );
  const { data: userDecorations = [] } = useGetUserProfileDecorationsQuery(undefined, {
    skip: !user,
  });

  return useMemo(() => {
    if (!equipped) return { frameUrl: null, avatarDecorationUrl: null };
    const frameUrl = resolveUrl(equipped.frame, "frame", userDecorations)
      ?? getEquippedFrameUrl(equipped);
    const avatarDecorationUrl = resolveUrl(equipped.avatar, "avatar", userDecorations)
      ?? getEquippedAvatarDecorationUrl(equipped);
    return { frameUrl, avatarDecorationUrl };
  }, [equipped, userDecorations]);
}

/** Оставлено для совместимости: возвращает только URL рамки. */
export function useResolvedEquippedFrameUrl(): string | null {
  const { frameUrl } = useResolvedEquippedDecorations();
  return frameUrl;
}
