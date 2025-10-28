import { UserProfile } from "@/types/user";

// Определяем интерфейсы для всех типов данных
interface ReadingHistoryItem {
  title: string;
  chapter: string;
  date: string;
  genres?: string[];
}

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
  if (isLoading) {
    return <ProfileStatsSkeleton />;
  }

  const stats = calculateStats(userProfile);

  if (!stats) {
    return (
      <div className="profile-stats-empty p-6 text-center text-gray-500">
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
    <div className="profile-stats grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
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
        <h3 className="text-sm font-medium text-gray-500 mb-2">Любимые жанры</h3>
        <div className="flex flex-wrap gap-1">
          {favoriteGenres.slice(0, 3).map((genre, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
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
    <div className="stat-card bg-white p-4 rounded-lg shadow-sm border">
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <div className="flex items-baseline">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className="text-sm text-gray-500 ml-1">{unit}</span>
      </div>
    </div>
  );
}

// Скелетон для состояния загрузки
function ProfileStatsSkeleton() {
  return (
    <div className="profile-stats-skeleton grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="stat-card bg-gray-200 p-4 rounded-lg animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-gray-300 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}

// Вспомогательные функции с правильной типизацией
function calculateStats(userProfile?: UserProfile | null): Stats | null {
  if (!userProfile) {
    return null;
  }

  // Используем type guard для проверки readingHistory
  if (!isValidReadingHistory(userProfile.readingHistory)) {
    return getEmptyStats();
  }

  const readingHistory = userProfile.readingHistory;
  
  if (readingHistory.length === 0) {
    return getEmptyStats();
  }

  // Используем type guard для фильтрации элементов с title
  const itemsWithTitle = readingHistory.filter((item): item is ReadingHistoryItem & { title: string } => 
    Boolean(item && typeof item === 'object' && 'title' in item && typeof item.title === 'string')
  );

  const uniqueMangaTitles = new Set(itemsWithTitle.map(item => item.title));
  const favoriteGenres = extractFavoriteGenres(readingHistory);

  return {
    totalMangaRead: uniqueMangaTitles.size,
    totalChaptersRead: readingHistory.length,
    readingTime: Math.round(readingHistory.length * 15),
    favoriteGenres: favoriteGenres,
  };
}

// Type guard для проверки readingHistory
function isValidReadingHistory(history: unknown): history is ReadingHistoryItem[] {
  return Array.isArray(history) && history.every(item => 
    typeof item === 'object' && 
    item !== null && 
    'title' in item && 
    'chapter' in item && 
    'date' in item
  );
}

function getEmptyStats(): Stats {
  return {
    totalMangaRead: 0,
    totalChaptersRead: 0,
    readingTime: 0,
    favoriteGenres: [],
  };
}

// Функция для извлечения жанров с правильной типизацией
function extractFavoriteGenres(readingHistory: ReadingHistoryItem[]): string[] {
  const genreMap = new Map<string, number>();
  
  readingHistory.forEach(item => {
    if (item.genres && Array.isArray(item.genres)) {
      item.genres.forEach((genre: unknown) => {
        if (typeof genre === 'string') {
          genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
        }
      });
    }
  });

  const topGenres = Array.from(genreMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([genre]) => genre);

  return topGenres.length > 0 ? topGenres : ["Популярное", "Новинки", "Рекомендуемое"];
}

// Хук для использования статистики
export function useProfileStats(userProfile?: UserProfile | null) {
  return calculateStats(userProfile);
}