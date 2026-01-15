// Типы для уведомлений

export interface NotificationTitle {
  _id: string;
  slug?: string;
  name: string;
  altNames?: string[];
  description?: string;
  genres?: string[];
  tags?: string[];
  artist?: string;
  status?: string;
  author?: string;
  views?: number;
  totalChapters?: number;
  rating?: number;
  releaseYear?: number;
  ageLimit?: number;
  chapters?: string[];
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  coverImage?: string;
}

export interface NotificationChapter {
  _id: string;
  titleId: string;
  chapterNumber: number;
  pages?: string[];
  views?: number;
  releaseDate?: string;
  isPublished?: boolean;
  translator?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface NotificationMetadata {
  chapterNumber?: number;
  titleName?: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: "new_chapter" | "update" | "user" | "system";
  title: string;
  message: string;
  isRead: boolean;
  titleId?: NotificationTitle | string;
  chapterId?: NotificationChapter | string;
  metadata?: NotificationMetadata;
  __v?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkAsReadResponse {
  message: string;
}

export interface MarkAllAsReadResponse {
  message: string;
}

export interface DeleteNotificationResponse {
  message: string;
}
