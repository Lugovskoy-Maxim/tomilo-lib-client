// ApiResponseDto - стандартный формат ответа API
export type { ApiResponseDto } from "./api";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
}

// Privacy settings type
export interface UserPrivacy {
  profileVisibility: "public" | "friends" | "private";
  readingHistoryVisibility: "public" | "friends" | "private";
}

// Display settings type (including 18+ content preference)
export interface UserDisplaySettings {
  isAdult: boolean;
  theme: "light" | "dark" | "system";
}

export interface StoredUser {
  updatedAt: string;
  createdAt: string;
  _id: string;
  id: string;
  email: string;
  emailVerified?: boolean;
  username: string;
  avatar?: string;
  role: string;
  level?: number;
  experience?: number;
  balance?: number;
  bookmarks?: import("@/types/user").BookmarkEntry[];
  readingHistory?: import("@/types/store").ReadingHistoryEntry[];
  birthDate?: string;
  // Privacy and display settings
  privacy?: UserPrivacy;
  displaySettings?: UserDisplaySettings;
  // Notifications, reading, locale
  notificationPreferences?: import("@/types/user").NotificationPreferences;
  readingSettings?: import("@/types/user").ReadingSettings;
  locale?: import("@/types/user").UserLocale;
  /** Подключённые способы входа: "yandex", "vk" и т.д. */
  linkedProviders?: string[];
}

export interface AuthResponse {
  access_token: string;
  user: StoredUser;
}

export interface AuthState {
  user: StoredUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// RTK Query
export type User = StoredUser;
