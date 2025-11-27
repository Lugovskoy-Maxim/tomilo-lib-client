import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/types/user";
import { pageTitle } from "@/lib/page-title";
import { StoredUser } from "@/types/auth";

// Преобразование StoredUser в UserProfile
function transformStoredUserToProfile(storedUser: StoredUser | null): UserProfile | null {
  if (!storedUser) return null;

    return {
      _id: storedUser._id || storedUser.id,
      username: storedUser.username,
      email: storedUser.email,
      avatar: storedUser.avatar || "",
      role: storedUser.role,
      level: storedUser.level,
      experience: storedUser.experience,
      balance: storedUser.balance,
      bookmarks: storedUser.bookmarks || [],
      readingHistory: Array.isArray(storedUser.readingHistory)
        ? storedUser.readingHistory.map((item) => ({
            ...item,
            titleId:
              typeof item.titleId === "object" && item.titleId !== null
                ? (item.titleId._id as string)
                : (item.titleId as string),
            chapters: Array.isArray(item.chapters)
              ? item.chapters.map((chap) => ({
                  chapterId:
                    typeof chap.chapterId === "object" && chap.chapterId !== null
                      ? (chap.chapterId as { _id: string })._id as string
                      : (chap.chapterId as string),
                  chapterNumber: chap.chapterNumber,
                  chapterTitle: chap.chapterTitle,
                  readAt: chap.readAt,
                }))
              : [],
          }))
        : [],
      createdAt: storedUser.createdAt,
      updatedAt: storedUser.updatedAt,
    };
}

export function useProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Обновление userProfile при изменении user из useAuth
  useEffect(() => {
    if (user) {
      setUserProfile(transformStoredUserToProfile(user));
    } else {
      setUserProfile(null);
    }
    setIsLoading(false);
  }, [user]);

  // Обработчик обновления аватара
  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setUserProfile(prev => prev ? { ...prev, avatar: newAvatarUrl } : null);
    // Здесь можно добавить логику для обновления аватара на сервере
  };

  // Устанавливаем заголовок страницы
  useEffect(() => {
    if (userProfile) {
      pageTitle.setTitlePage(`Профиль ${userProfile.username}`);
    } else {
      pageTitle.setTitlePage("Профиль пользователя");
    }
  }, [userProfile]);

  return {
    userProfile,
    isLoading: isLoading || authLoading,
    authLoading,
    handleAvatarUpdate,
  };
}