import { ReadingHistoryEntry } from "./store";

// Privacy settings type
export type UserPrivacy = {
  profileVisibility: "public" | "friends" | "private";
  readingHistoryVisibility: "public" | "friends" | "private";
};

// Display settings type (including 18+ content preference)
export type UserDisplaySettings = {
  isAdult: boolean;
  theme: "light" | "dark" | "system";
};

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
  // Privacy and display settings
  privacy?: UserPrivacy;
  displaySettings?: UserDisplaySettings;
}

// Дополнительные интерфейсы для расширенной функциональности
export interface ReadingStats {
  totalMangaRead: number;
  totalChaptersRead: number;
  readingTime: number;
  favoriteGenres: string[];
}

export interface UserPreferences {
  readingMode: "vertical" | "horizontal";
  theme: "light" | "dark" | "auto";
  notifications: {
    newChapters: boolean;
    comments: boolean;
    recommendations: boolean;
  };
}
