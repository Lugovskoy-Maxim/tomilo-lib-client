import React from "react";
import { UserProfile } from "@/types/user";

// Определяем интерфейсы для всех типов данных
interface Stats {
  totalMangaRead: number;
  totalChaptersRead: number;
  readingTime: number;
  favoriteGenres: string[];
}

interface ProfileStatsProps {
  userProfile?: UserProfile | null;
  isLoading?: boolean;
}

interface SharedProfileStatsProps {
  totalMangaRead: number;
  totalChaptersRead: number;
  readingTime: number;
  favoriteGenres: string[];
}

interface StatCardProps {
  title: string;
  value: number;
  unit: string;
}

// Компонент статистики профиля
export default function ProfileStats({ userProfile, isLoading = false }: ProfileStatsProps) {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(false);

  React.useEffect(() => {
    if (userProfile && userProfile.readingHistory) {
      calculateStatsAsync(userProfile);
    } else {
      setStats(getEmptyStats());
    }
  }, [userProfile]);

  const calculateStatsAsync = async (userProfile: UserProfile) => {
    setStatsLoading(true);
    try {
      const calculatedStats = await calculateStats(userProfile);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error calculating stats:', error);
      setStats(getEmptyStats());
    } finally {
      setStatsLoading(false);
    }
  };

  if (isLoading || statsLoading) {
    return <ProfileStatsSkeleton />;
  }

  if (!stats) {
    return (
      <div className="profile-stats-empty p-6 text-center text-[var(--muted-foreground)]">
        <p>Нет данных для отображения статистики</p>
      </div>
    );
  }

  return <SharedProfileStats {...stats} />;
}

// Компонент отображения статистики
function SharedProfileStats({
  totalMangaRead,
  totalChaptersRead,
  readingTime,
  favoriteGenres
}: SharedProfileStatsProps) {
  return (
    <div className="profile-stats grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
      <StatCard
        title="Прочитано манги"
        value={totalMangaRead}
        unit="шт"
      />
      <StatCard
        title="Прочитано глав"
        value={totalChaptersRead}
        unit="глав"
      />
      <StatCard
        title="Время чтения"
        value={Math.round(readingTime / 60)}
        unit="часов"
      />
      <div className="favorite-genres col-span-2 md:col-span-1">
        <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Любимые жанры</h3>
        <div className="flex flex-wrap gap-1">
          {favoriteGenres.slice(0, 3).map((genre, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-xs rounded-full"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Компонент карточки статистики
function StatCard({ title, value, unit }: StatCardProps) {
  return (
    <div className="stat-card p-4 rounded-lg shadow-sm border border-[var(--border)]">
      <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-1">{title}</h3>
      <div className="flex items-baseline">
        <span className="text-2xl font-bold text-[var(--muted-foreground)]">{value}</span>
        <span className="text-sm text-[var(--muted-foreground)] ml-1">{unit}</span>
      </div>
    </div>
  );
}

// Скелетон для состояния загрузки
function ProfileStatsSkeleton() {
  return (
    <div className="profile-stats-skeleton grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="stat-card bg-[var(--muted)] p-4 rounded-lg animate-pulse">
          <div className="h-4 bg-[var(--muted)] rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-[var(--muted)] rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}

// Вспомогательные функции с правильной типизацией
async function calculateStats(userProfile: UserProfile): Promise<Stats> {
  if (!userProfile || !userProfile.readingHistory || userProfile.readingHistory.length === 0) {
    return getEmptyStats();
  }

  const readingHistory = userProfile.readingHistory;

  // Создаем Set для подсчета уникальных тайтлов
  const uniqueMangaTitles = new Set<string>();
  let totalChaptersRead = 0;
  const genreCount: Record<string, number> = {};

  // Проходим по истории чтения
  for (const historyItem of readingHistory) {
    // Определяем titleId
    const titleId = typeof historyItem.titleId === 'object' ? (historyItem.titleId as { _id: string })._id : historyItem.titleId;
    uniqueMangaTitles.add(titleId);

    // Считаем главы
    if (historyItem.chapters && Array.isArray(historyItem.chapters)) {
      totalChaptersRead += historyItem.chapters.length;
    }

    // Получаем жанры для тайтла
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3001'}/api/titles/${titleId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.genres) {
          result.data.genres.forEach((genre: string) => {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching genres for title ${titleId}:`, error);
    }
  }

  // Определяем любимые жанры
  const favoriteGenres = Object.entries(genreCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([genre]) => genre);

  return {
    totalMangaRead: uniqueMangaTitles.size,
    totalChaptersRead,
    readingTime: Math.round(totalChaptersRead * 15), // Предполагаем 15 минут на главу
    favoriteGenres: favoriteGenres.length > 0 ? favoriteGenres : ["Популярное", "Новинки", "Рекомендуемое"],
  };
}

function getEmptyStats(): Stats {
  return {
    totalMangaRead: 0,
    totalChaptersRead: 0,
    readingTime: 0,
    favoriteGenres: [],
  };
}

// Хук для использования статистики
export function useProfileStats(userProfile?: UserProfile | null) {
  const [stats, setStats] = React.useState<Stats | null>(null);

  React.useEffect(() => {
    if (userProfile && userProfile.readingHistory) {
      calculateStats(userProfile).then(setStats).catch(() => setStats(getEmptyStats()));
    } else {
      setStats(getEmptyStats());
    }
  }, [userProfile]);

  return stats;
}
