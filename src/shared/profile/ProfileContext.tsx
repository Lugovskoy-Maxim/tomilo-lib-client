"use client";

import { createContext, useContext, ReactNode } from "react";
import type { UserProfile } from "@/types/user";

export interface ProfileContextValue {
  userProfile: UserProfile | null;
  isLoading: boolean;
  authLoading: boolean;
  handleAvatarUpdate: (newAvatarUrl: string) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  value,
  children,
}: {
  value: ProfileContextValue;
  children: ReactNode;
}) {
  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfileContext must be used within ProfileProvider");
  }
  return ctx;
}

/** Использовать профиль из контекста, если есть провайдер; иначе вернуть null (для использования вне /profile) */
export function useProfileContextOptional(): ProfileContextValue | null {
  return useContext(ProfileContext);
}
