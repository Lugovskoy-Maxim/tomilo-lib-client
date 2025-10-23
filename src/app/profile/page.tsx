"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/types/user";
import { BookmarksList, ProfileHeader, ProfileStats, ReadingHistory } from "@/shared";
import { Footer, Header } from "@/widgets";
import { pageTitle } from "@/lib/page-title";

// Mock данные на основе вашей схемы
const mockUserProfile: UserProfile = {
  _id: "507f1f77bcf86cd799439011",
  username: "mangalover",
  email: "user@example.com",
  avatar: "",
  role: "user",
  bookmarks: [
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013",
    "507f1f77bcf86cd799439014",
    "507f1f77bcf86cd799439015",
    "507f1f77bcf86cd799439016"
  ],
  readingHistory: [
    {
      title: "One Piece - Великий морской путь",
      chapter: "Глава 1095: Путь воина",
      date: "2024-03-15T14:30:00Z"
    },
    {
      title: "Attack on Titan - Последняя битва",
      chapter: "Глава 139: К небу",
      date: "2024-03-14T20:15:00Z"
    },
    {
      title: "Demon Slayer - Истребление демонов",
      chapter: "Глава 205: Последняя битва",
      date: "2024-03-13T16:45:00Z"
    },
    {
      title: "Naruto - История шиноби",
      chapter: "Глава 700: Свадьба",
      date: "2024-03-12T10:20:00Z"
    },
    {
      title: "Bleach - Поглотитель душ",
      chapter: "Глава 686: Смерть и клубника",
      date: "2024-03-10T18:30:00Z"
    }
  ],
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-03-15T14:30:00Z"
};

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // В реальном приложении здесь будет запрос к API
    // fetchUserProfile(user.id).then(setUserProfile);
    setUserProfile(mockUserProfile);
  }, []);

  useEffect(() => {
    pageTitle.setTitlePage(
      userProfile ? `Профиль ${userProfile.username}` : "Профиль пользователя"
    );
  }, [userProfile]);

  const handleRemoveBookmark = (bookmarkId: string) => {
    if (userProfile) {
      const updatedBookmarks = userProfile.bookmarks.filter(id => id !== bookmarkId);
      setUserProfile({
        ...userProfile,
        bookmarks: updatedBookmarks
      });
      // Здесь будет вызов API для удаления закладки
      console.log("Удаление закладки:", bookmarkId);
    }
  };

  const calculateStats = () => {
    if (!userProfile) return null;

    const uniqueMangaTitles = new Set(userProfile.readingHistory.map(item => item.title));
    
    return {
      totalMangaRead: uniqueMangaTitles.size,
      totalChaptersRead: userProfile.readingHistory.length,
      readingTime: userProfile.readingHistory.length * 15, // Пример: 15 минут на главу
      favoriteGenres: ["Сёнен", "Приключения", "Фэнтези"] // В реальном приложении будет расчет по жанрам
    };
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              Необходима авторизация
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Пожалуйста, войдите в систему чтобы просмотреть профиль
            </p>
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

  const stats = calculateStats();

  return (
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
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.username}
                    className="w-24 h-24 rounded-full object-cover border-4 border-[var(--background)] shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-2xl font-bold border-4 border-[var(--background)] shadow-lg">
                    {userProfile.username[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-[var(--primary)] text-white rounded-full hover:bg-[var(--primary)]/90 transition-colors border-2 border-[var(--background)]"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
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
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    userProfile.role === 'admin' 
                      ? 'bg-red-500/10 text-red-600' 
                      : 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  }`}>
                    {userProfile.role === 'admin' ? 'Администратор' : 'Пользователь'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">{userProfile.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">С {new Date(userProfile.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span className="text-xs">{userProfile.bookmarks.length} закладок</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-xs">{userProfile.readingHistory.length} в истории</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Статистика */}
        {stats && <ProfileStats stats={stats} />}

        {/* Сетка с карточками */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* История чтения в виде карточек */}
          <div className="bg-[var(--secondary)] rounded-xl p-6 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>История чтения</span>
              </h2>
              <span className="text-xs text-[var(--muted-foreground)] bg-[var(--background)] px-2 py-1 rounded">
                {userProfile.readingHistory.length} записей
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userProfile.readingHistory.slice(0, 4).map((item, index) => (
                <div
                  key={index}
                  className="bg-[var(--background)] rounded-lg p-4 border border-[var(--border)] hover:border-[var(--primary)] transition-colors cursor-pointer group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-16 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--chart-1)]/20 rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[var(--foreground)] text-sm mb-1 truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[var(--muted-foreground)] mb-2">
                        {item.chapter}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-[var(--muted-foreground)]">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{new Date(item.date).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {userProfile.readingHistory.length > 4 && (
              <div className="text-center mt-4">
                <button className="text-xs text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors">
                  Показать все {userProfile.readingHistory.length} записей
                </button>
              </div>
            )}
          </div>

          {/* Закладки в виде карточек */}
          <div className="bg-[var(--secondary)] rounded-xl p-6 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>Закладки</span>
              </h2>
              <span className="text-xs text-[var(--muted-foreground)] bg-[var(--background)] px-2 py-1 rounded">
                {userProfile.bookmarks.length} манги
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userProfile.bookmarks.slice(0, 4).map((bookmarkId, index) => (
                <div
                  key={bookmarkId}
                  className="bg-[var(--background)] rounded-lg p-4 border border-[var(--border)] hover:border-[var(--primary)] transition-colors group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-16 bg-gradient-to-br from-[var(--chart-1)]/20 to-[var(--primary)]/20 rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[var(--chart-1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[var(--foreground)] text-sm mb-1">
                        Манга #{bookmarkId.slice(-6)}
                      </h3>
                      <p className="text-xs text-[var(--muted-foreground)] mb-2">
                        ID: {bookmarkId}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--muted-foreground)]">
                          Добавлено недавно
                        </span>
                        <button
                          onClick={() => handleRemoveBookmark(bookmarkId)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {userProfile.bookmarks.length > 4 && (
              <div className="text-center mt-4">
                <button className="text-xs text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors">
                  Показать все {userProfile.bookmarks.length} закладок
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}