export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  level?: number;
  bookmarks: string[];
  readingHistory: {
    titleId: string;
    chapters: {
      chapterId: string;
      chapterNumber: number;
      chapterTitle: string | null;
      readAt: string;
    }[];
    readAt: string;
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