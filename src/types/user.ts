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

/** Настройки уведомлений (сохраняются в профиле) */
export type NotificationPreferences = {
  newChapters: boolean;
  comments: boolean;
  recommendations: boolean;
};

/** Настройки читалки (сохраняются в профиле, fallback на localStorage) */
export type ReadingSettings = {
  readingMode?: "single" | "continuous";
  orientation?: "auto" | "portrait" | "landscape";
  imageWidth?: number;
  readChaptersInRow?: boolean;
  showPageCounter?: boolean;
  hideBottomMenu?: boolean;
  preloadAllImages?: boolean;
  autoScrollSpeed?: number;
  alwaysStartFromBeginning?: boolean;
};

export type UserLocale = "ru" | "en";

export interface EquippedDecorations {
  avatar?: string | null;
  /** URL изображения надетой рамки аватара */
  frame?: string | null;
  background?: string | null;
  card?: string | null;
  _id?: string;
}

/** Элемент списка купленных декораций в профиле (API users/profile) */
export interface OwnedDecorationEntry {
  decorationType: "avatar" | "frame" | "background" | "card";
  decorationId: string;
  purchasedAt?: string;
  _id?: string;
}

/** Категории закладок */
export type BookmarkCategory = "reading" | "planned" | "completed" | "favorites" | "dropped";

/** Минимальные поля тайтла из API (когда сервер возвращает populated titleId) */
export interface BookmarkTitleInfo {
  _id: string;
  name: string;
  slug?: string;
  coverImage?: string;
  type?: string;
  status?: string;
  totalChapters?: number;
  averageRating?: number;
  releaseYear?: number;
}

export interface BookmarkEntry {
  titleId: string;
  category: BookmarkCategory;
  addedAt: string;
  /** Заполняется при наличии populated titleId в ответе API (избегаем лишних запросов) */
  title?: BookmarkTitleInfo | null;
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
  // Notifications, reading, locale
  notificationPreferences?: NotificationPreferences;
  readingSettings?: ReadingSettings;
  locale?: UserLocale;
  // Equipped decorations (banner, avatar frame, etc.)
  equippedDecorations?: EquippedDecorations;
  /** Купленные декорации (из API users/profile). Используется для инвентаря, если GET /shop/profile/decorations пуст. */
  ownedDecorations?: OwnedDecorationEntry[];
  /** Подключённые способы входа: "yandex", "vk" и т.д. */
  linkedProviders?: string[];
  /** Полученные достижения пользователя */
  achievements?: UserAchievement[];
  
  // Статистика пользователя
  /** Количество уникальных прочитанных тайтлов */
  titlesReadCount?: number;
  /** Количество оставленных комментариев */
  commentsCount?: number;
  /** Количество полученных лайков на комментариях */
  likesReceivedCount?: number;
  /** Примерное время чтения в минутах */
  readingTimeMinutes?: number;
  /** Текущая серия дней с активностью */
  currentStreak?: number;
  /** Максимальная серия дней */
  longestStreak?: number;
  /** Дата последней активности для streak */
  lastStreakDate?: string;
  /** Количество завершённых тайтлов */
  completedTitlesCount?: number;
  
  // Кастомизация профиля
  /** Краткое описание / статус (до 200 символов) */
  bio?: string;
  /** Любимый жанр */
  favoriteGenre?: string;
  /** Ссылки на соцсети */
  socialLinks?: SocialLinks;
  /** Показывать ли статистику в профиле */
  showStats?: boolean;
  /** Показывать ли достижения */
  showAchievements?: boolean;
  /** Показывать ли любимых персонажей */
  showFavoriteCharacters?: boolean;
}

/** Типы достижений */
export type AchievementType = 
  | "reading"      // За чтение глав
  | "collection"   // За закладки
  | "social"       // За привязку соцсетей
  | "veteran"      // За время на сайте
  | "special"      // Особые достижения
  | "level";       // За уровень

/** Редкость достижения */
export type AchievementRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

/** Достижение пользователя */
export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AchievementType;
  rarity: AchievementRarity;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

// Статистика пользователя
export interface UserStats {
  titlesReadCount: number;
  commentsCount: number;
  likesReceivedCount: number;
  readingTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  lastStreakDate?: string;
  completedTitlesCount: number;
}

// Ссылки на соцсети
export interface SocialLinks {
  telegram?: string;
  discord?: string;
  vk?: string;
}

// Настройки отображения профиля
export interface ProfileVisibilitySettings {
  showStats: boolean;
  showAchievements: boolean;
  showFavoriteCharacters: boolean;
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
