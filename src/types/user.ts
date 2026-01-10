import { ReadingHistoryEntry } from "./store";

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  level?: number;
  experience?: number;
  balance?: number;
  bookmarks: string[];
  readingHistory: ReadingHistoryEntry[];
  birthDate?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified?: boolean;
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