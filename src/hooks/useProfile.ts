import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/types/user";
import { User } from "@/types/auth";
import { pageTitle } from "@/lib/page-title";
import { normalizeBookmarks } from "@/lib/bookmarks";
import { useGetProfileQuery, useGetReadingHistoryQuery } from "@/store/api/authApi";
import { ReadingHistoryEntry } from "@/types/store";

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
    bookmarks: normalizeBookmarks(user.bookmarks as unknown),
    readingHistory: Array.isArray(user.readingHistory)
      ? transformReadingHistory(user.readingHistory)
      : [],
    birthDate: user.birthDate,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    // Privacy and display settings
    privacy: user.privacy,
    displaySettings: user.displaySettings,
    linkedProviders: user.linkedProviders,
    // Надетые декорации (аватар, рамка, фон) — API может вернуть equippedDecorations или equipped_decorations
    equippedDecorations: (user as User & { equippedDecorations?: UserProfile["equippedDecorations"] }).equippedDecorations ??
      (user as Record<string, unknown>).equipped_decorations as UserProfile["equippedDecorations"],
    ownedDecorations: (user as User & { ownedDecorations?: UserProfile["ownedDecorations"] }).ownedDecorations,
  };
}

// Transform reading history to ensure chapterId is string while preserving titleId object
function transformReadingHistory(history: ReadingHistoryEntry[] | unknown): ReadingHistoryEntry[] {
  if (!Array.isArray(history)) return [];
  return history.map((item: ReadingHistoryEntry) => ({
    ...item,
    // Keep titleId as is (can be string or object), but ensure it's consistent
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Получаем профиль пользователя напрямую из API
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery();

  // Получаем историю чтения в полном формате (все главы по каждому тайтлу) для секции «История чтения»
  const { data: readingHistoryData, isLoading: readingHistoryLoading } =
    useGetReadingHistoryQuery({ limit: 200, light: false });

  // Обновление userProfile при получении данных из API
  useEffect(() => {
    if (profileData?.success && profileData.data) {
      const profile = transformUserToProfile(profileData.data);
      // Если есть данные из API истории чтения, используем их с преобразованием
      if (profile && readingHistoryData?.success && readingHistoryData.data) {
        profile.readingHistory = transformReadingHistory(readingHistoryData.data);
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

  // Показываем загрузку, пока запросы идут или пока данные уже пришли, но ещё не синхронизированы в userProfile (useEffect выполняется после рендера)
  const isSyncingProfile =
    isAuthenticated &&
    Boolean(profileData?.success && profileData?.data) &&
    userProfile === null;
  const isLoading =
    profileLoading ||
    readingHistoryLoading ||
    authLoading ||
    isSyncingProfile;

  return {
    userProfile,
    isLoading,
    authLoading,
    handleAvatarUpdate,
  };
}
