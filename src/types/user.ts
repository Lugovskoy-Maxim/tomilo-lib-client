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

export interface EquippedDecorations {
  avatar?: string | null;
  background?: string | null;
  card?: string | null;
  _id?: string;
}

/** Категории закладок */
export type BookmarkCategory = "reading" | "planned" | "completed" | "favorites" | "dropped";

export interface BookmarkEntry {
  titleId: string;
  category: BookmarkCategory;
  addedAt: string;
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  level?: number;
  experience?: number;
  balance?: number;
  bookmarks: BookmarkEntry[];
  readingHistory: ReadingHistoryEntry[];
  birthDate?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified?: boolean;
  // Privacy and display settings
  privacy?: UserPrivacy;
  displaySettings?: UserDisplaySettings;
  // Equipped decorations (banner, avatar frame, etc.)
  equippedDecorations?: EquippedDecorations;
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
