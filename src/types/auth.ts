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
  /** Токен капчи (Cloudflare Turnstile), передаётся при включённой капче */
  captchaToken?: string;
}

/** Тело запроса отправки кода на email (шаг 1 регистрации). Пользователь не создаётся. */
export interface SendRegistrationCodeData {
  email: string;
  username: string;
  password: string;
  captchaToken?: string;
}

/** Тело запроса регистрации с кодом из письма (шаг 2). Сервер ожидает code и те же email/username/password. */
export interface RegisterWithCodeData {
  email: string;
  username: string;
  password: string;
  /** 6-значный код из письма */
  code: string;
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
  /** Надетые декорации (рамка аватара, фон и т.д.) — отображаются поверх пользовательских */
  equippedDecorations?: import("@/types/user").EquippedDecorations;
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

/** Ответ 409 при привязке соцсети: ВК/Яндекс уже привязаны к другому пользователю */
export interface LinkConflictExistingAccount {
  id: string;
  username: string;
}

export interface LinkConflictData {
  conflict: true;
  existingAccount: LinkConflictExistingAccount;
  /** Провайдер, по которому конфликт: "vk" | "vk_id" | "yandex" */
  provider?: "vk" | "vk_id" | "yandex";
}

/** Варианты разрешения конфликта при привязке соцсети */
export type LinkResolve = "use_existing" | "link_here" | "merge";
