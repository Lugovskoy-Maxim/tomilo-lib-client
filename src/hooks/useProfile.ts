import { useMemo, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/types/user";
import { User } from "@/types/auth";
import { pageTitle } from "@/lib/page-title";
import { normalizeBookmarks } from "@/lib/bookmarks";
import { getLinkedProvidersFromUser } from "@/lib/linkedProviders";
import { useGetProfileQuery, useGetReadingHistoryQuery } from "@/store/api/authApi";
import { ReadingHistoryEntry } from "@/types/store";

function transformUserToProfile(user: User): UserProfile | null {
  if (!user) return null;

  return {
    _id: user._id || user.id,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    avatar: user.avatar || "",
    role: user.role,
    level: user.level,
    experience: user.experience,
    balance: user.balance,
    bookmarks: normalizeBookmarks(user.bookmarks as unknown),
    readingHistory: Array.isArray(user.readingHistory)
      ? transformReadingHistory(user.readingHistory)
      : [],
    birthDate: user.birthDate,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastStreakDate: user.lastStreakDate,
    privacy: user.privacy,
    displaySettings: user.displaySettings,
    linkedProviders: getLinkedProvidersFromUser(user),
    equippedDecorations: (user as User & { equippedDecorations?: UserProfile["equippedDecorations"] }).equippedDecorations ??
      (user as unknown as Record<string, unknown>).equipped_decorations as UserProfile["equippedDecorations"],
    ownedDecorations: (user as User & { ownedDecorations?: UserProfile["ownedDecorations"] }).ownedDecorations,
  };
}

function transformReadingHistory(history: ReadingHistoryEntry[] | unknown): ReadingHistoryEntry[] {
  if (!Array.isArray(history)) return [];
  return history.map((item: ReadingHistoryEntry) => ({
    ...item,
    titleId: item.titleId,
    chapters: Array.isArray(item.chapters)
      ? item.chapters.map(chap => ({
          chapterId:
            typeof chap.chapterId === "object" && chap.chapterId !== null
              ? (chap.chapterId as { _id: string })._id
              : String(chap.chapterId),
          chapterNumber: chap.chapterNumber,
          chapterTitle: chap.chapterTitle,
          readAt: chap.readAt,
        }))
      : [],
  }));
}

export function useProfile() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const prevTitleRef = useRef<string | null>(null);

  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated && !authLoading,
  });

  const { data: readingHistoryData, isLoading: readingHistoryLoading } =
    useGetReadingHistoryQuery({ limit: 200, light: false }, {
      skip: !isAuthenticated && !authLoading,
    });

  const userProfile = useMemo(() => {
    if (!profileData?.success || !profileData.data) {
      return null;
    }
    
    const profile = transformUserToProfile(profileData.data);
    if (profile && readingHistoryData?.success && readingHistoryData.data) {
      profile.readingHistory = transformReadingHistory(readingHistoryData.data);
    }
    return profile;
  }, [profileData, readingHistoryData]);

  const handleAvatarUpdate = useCallback((newAvatarUrl: string) => {
    if (userProfile) {
      userProfile.avatar = newAvatarUrl;
    }
  }, [userProfile]);

  useEffect(() => {
    const newTitle = userProfile 
      ? `Профиль ${userProfile.username}` 
      : "Профиль пользователя";
    
    if (prevTitleRef.current !== newTitle) {
      prevTitleRef.current = newTitle;
      pageTitle.setTitlePage(newTitle);
    }
  }, [userProfile?.username]);

  const isLoading = profileLoading || readingHistoryLoading || authLoading;

  return {
    userProfile,
    isLoading,
    authLoading,
    handleAvatarUpdate,
  };
}
