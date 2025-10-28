"use client";

import { UserProfile } from "@/types/user";
import { EditAvatarButton, ProfileStats } from "@/shared";
import {
  BookmarksSection,
  Footer,
  Header,
  ReadingHistorySection,
} from "@/widgets";
import { pageTitle } from "@/lib/page-title";
import Image from "next/image";
import { AuthGuard } from "@/guard/auth-guard";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  basePublicUrl: process.env.NEXT_PUBLIC_URL || 'http://localhost:3001',
};

// Адаптируем тип UserProfile к данным с бэкенда
interface BackendUserProfile {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  bookmarks: string[];
  readingHistory: Array<{
    title: string;
    chapter: string;
    date: string;
  }>;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

// Функция для преобразования данных с бэкенда в UserProfile
function transformBackendProfile(
  backendProfile: BackendUserProfile | null
): UserProfile | null {
  if (!backendProfile) return null;

  return {
    _id: backendProfile._id,
    username: backendProfile.username,
    email: backendProfile.email,
    avatar: backendProfile.avatar || "",
    role: backendProfile.role,
    bookmarks: backendProfile.bookmarks || [],
    readingHistory: backendProfile.readingHistory || [],
    createdAt: backendProfile.createdAt,
    updatedAt: backendProfile.updatedAt,
  };
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка данных профиля
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_CONFIG.baseUrl}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('tomilo_lib_token')}`,
          },
        });

        if (response.ok) {
          const backendProfile: BackendUserProfile = await response.json();
          setUserProfile(transformBackendProfile(backendProfile));
        } else {
          console.error('Failed to load user profile');
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // Обработчик обновления аватара
  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setUserProfile(prev => prev ? { ...prev, avatar: newAvatarUrl } : null);
    
    // Также обновляем аватар в контексте аутентификации
    if (user) {
      updateUser({ ...user, avatar: newAvatarUrl });
    }
  };

  // Устанавливаем заголовок страницы
  useEffect(() => {
    if (userProfile) {
      pageTitle.setTitlePage(`Профиль ${userProfile.username}`);
    } else {
      pageTitle.setTitlePage("Профиль пользователя");
    }
  }, [userProfile]);

  if (authLoading || isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-center">
            <div className="w-24 h-24 bg-[var(--border)] rounded-full mx-auto mb-4"></div>
            <div className="h-6 bg-[var(--border)] rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-[var(--border)] rounded w-32 mx-auto"></div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!userProfile) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              Пользователь не найден
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Не удалось загрузить данные профиля
            </p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const stats = calculateStats(userProfile);

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3001';

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Заголовок страницы */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--muted-foreground)] mb-2">
              Профиль пользователя
            </h1>
            <p className="text-[var(--muted-foreground)] text-sm">
              Управление вашим аккаунтом и отслеживание прогресса чтения
            </p>
          </div>

          {/* Новый заголовок профиля с разделением на две части */}
          <div className="bg-[var(--secondary)] rounded-xl border border-[var(--border)] overflow-hidden mb-8">
            {/* Верхняя часть - баннер */}
            <div className="h-32 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--chart-1)]/20 relative">
              {/* Аватар, перекрывающий обе части */}
              <div className="absolute left-8 -bottom-8">
                <div className="relative">
                  {userProfile.avatar ? (
                    <Image
                      loader={() => `${API_CONFIG.basePublicUrl}${userProfile.avatar}`}
                      src={`${baseUrl}${userProfile.avatar}`}
                      alt={userProfile.username}
                      className="w-24 h-24 rounded-full object-cover border-4 border-[var(--background)] shadow-lg"
                      height={96}
                      width={96}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-2xl font-bold border-4 border-[var(--background)] shadow-lg">
                      {userProfile.username[0].toUpperCase()}
                    </div>
                  )}
                  <EditAvatarButton onAvatarUpdate={handleAvatarUpdate} />
                </div>
              </div>
            </div>

            {/* Нижняя часть - информация */}
            <div className="pt-12 pb-6 px-8">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
                <div className="mb-4 lg:mb-0">
                  <h1 className="text-xl font-bold text-[var(--foreground)] mb-1">
                    {userProfile.username}
                  </h1>
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        userProfile.role === "admin"
                          ? "bg-red-500/10 text-red-600"
                          : "bg-[var(--primary)]/10 text-[var(--primary)]"
                      }`}
                    >
                      {userProfile.role === "admin"
                        ? "Администратор"
                        : "Пользователь"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
                  <div className="flex items-center space-x-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-xs">{userProfile.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-xs">
                      С{" "}
                      {new Date(userProfile.createdAt).toLocaleDateString(
                        "ru-RU"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                    <span className="text-xs">
                      {userProfile.bookmarks.length} закладок
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <span className="text-xs">
                      {userProfile.readingHistory.length} в истории
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Статистика */}
          {stats && <ProfileStats stats={stats} />}

          {/* Сетка с карточками */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* История чтения */}
            <ReadingHistorySection
              readingHistory={userProfile.readingHistory}
            />

            {/* Закладки */}
            <BookmarksSection
              bookmarks={userProfile.bookmarks}
              initialBookmarks={userProfile.bookmarks}
            />
          </div>
        </div>

        <Footer />
      </main>
    </AuthGuard>
  );
}

// Вспомогательные функции
function calculateStats(userProfile: UserProfile) {
  if (!userProfile) return null;

  const uniqueMangaTitles = new Set(
    userProfile.readingHistory.map((item) => item.title)
  );

  return {
    totalMangaRead: uniqueMangaTitles.size,
    totalChaptersRead: userProfile.readingHistory.length,
    readingTime: userProfile.readingHistory.length * 15, // Пример: 15 минут на главу
    favoriteGenres: ["Сёнен", "Приключения", "Фэнтези"], // В реальном приложении будет расчет по жанрам
  };
}