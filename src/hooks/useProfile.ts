import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/types/user";
import { User } from "@/types/auth";
import { pageTitle } from "@/lib/page-title";
import { useGetProfileQuery, useGetReadingHistoryQuery } from "@/store/api/authApi";

// Преобразование User из API в UserProfile
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
    bookmarks: user.bookmarks || [],
    readingHistory: Array.isArray(user.readingHistory)
      ? user.readingHistory.map(item => ({
          ...item,
          titleId: item.titleId, // Preserve the original titleId (can be string, null, or object)
          chapters: Array.isArray(item.chapters)
            ? item.chapters.map(chap => ({
                chapterId:
                  typeof chap.chapterId === "object" && chap.chapterId !== null
                    ? ((chap.chapterId as { _id: string })._id as string)
                    : (chap.chapterId as string),
                chapterNumber: chap.chapterNumber,
                chapterTitle: chap.chapterTitle,
                readAt: chap.readAt,
              }))
            : [],
        }))
      : [],
    birthDate: user.birthDate,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function useProfile() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Получаем профиль пользователя напрямую из API
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery();

  // Получаем историю чтения напрямую из API
  const { data: readingHistoryData, isLoading: readingHistoryLoading } =
    useGetReadingHistoryQuery();

  // Обновление userProfile при получении данных из API
  useEffect(() => {
    if (profileData?.success && profileData.data) {
      const profile = transformUserToProfile(profileData.data);
      // Если есть данные из API истории чтения, используем их
      if (profile && readingHistoryData?.success && readingHistoryData.data) {
        profile.readingHistory = readingHistoryData.data;
      }
      setUserProfile(profile);
    } else if (!isAuthenticated) {
      setUserProfile(null);
    }
  }, [profileData, readingHistoryData, isAuthenticated]);

  // Обработчик обновления аватара
  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setUserProfile(prev => (prev ? { ...prev, avatar: newAvatarUrl } : null));
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
    isLoading: profileLoading || readingHistoryLoading || authLoading,
    authLoading,
    handleAvatarUpdate,
  };
}
