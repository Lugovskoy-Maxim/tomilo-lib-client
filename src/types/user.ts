export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  bookmarks: string[];
  readingHistory: {
    title: string;
    chapter: string;
    date: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Дополнительные интерфейсы для расширенной функциональности
export interface ReadingStats {
  totalMangaRead: number;
  totalChaptersRead: number;
  readingTime: number;
  favoriteGenres: string[];
}

export interface UserPreferences {
  readingMode: 'vertical' | 'horizontal';
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    newChapters: boolean;
    comments: boolean;
    recommendations: boolean;
  };
}