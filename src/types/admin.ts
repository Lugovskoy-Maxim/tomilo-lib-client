import { UserProfile } from "./user";
import { TitleType, TitleStatus } from "./title";

/** Статистика дашборда админки */
export interface AdminDashboardStats {
  users: {
    total: number;
    today: number;
    activeToday: number;
    banned: number;
  };
  titles: {
    total: number;
    published: number;
    today: number;
  };
  chapters: {
    total: number;
    published: number;
    today: number;
  };
  comments: {
    total: number;
    today: number;
    hidden: number;
  };
  activity: {
    readingToday: number;
    bookmarksToday: number;
    ratingsToday: number;
  };
}

/** Данные для графиков админки */
export interface AdminChartData {
  date: string;
  users: number;
  titles: number;
  chapters: number;
  comments: number;
  readings: number;
}

/** Последние действия в системе */
export interface AdminActivity {
  id: string;
  type:
    | "user_registered"
    | "title_created"
    | "chapter_published"
    | "comment_created"
    | "rating_added"
    | "bookmark_added";
  description: string;
  userId?: string;
  username?: string;
  targetId?: string;
  targetName?: string;
  createdAt: string;
}

/** Системная информация */
export interface AdminSystemInfo {
  uptime: number;
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  nodejs: {
    version: string;
    memoryUsage: {
      heapTotal: number;
      heapUsed: number;
      external: number;
      rss: number;
    };
  };
  database: {
    connected: boolean;
    collections: number;
  };
}

/** Параметры запроса списка пользователей для админки */
export interface AdminUsersQuery {
  search?: string;
  page?: number;
  limit?: number;
  role?: string;
  status?: "active" | "banned" | "all";
  sortBy?: "createdAt" | "lastActiveAt" | "level" | "username";
  sortOrder?: "asc" | "desc";
}

/** Детальная информация о пользователе для админки */
export interface AdminUserDetails extends UserProfile {
  bans?: {
    _id: string;
    reason: string;
    bannedAt: string;
    expiresAt?: string;
    bannedBy: string;
    isActive: boolean;
  }[];
  stats?: {
    totalComments: number;
    totalRatings: number;
    totalBookmarks: number;
    totalReadChapters: number;
  };
}

/** Комментарий для модерации */
export interface AdminComment {
  _id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  targetType: "title" | "chapter";
  targetId: string;
  targetName?: string;
  content: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  dislikesCount: number;
  repliesCount: number;
  reportCount?: number;
}

/** Параметры запроса комментариев для модерации */
export interface AdminCommentsQuery {
  search?: string;
  page?: number;
  limit?: number;
  status?: "visible" | "hidden" | "all";
  targetType?: "title" | "chapter" | "all";
  sortBy?: "createdAt" | "reportCount" | "likesCount";
  sortOrder?: "asc" | "desc";
  userId?: string;
}

/** Статистика комментариев */
export interface AdminCommentsStats {
  total: number;
  visible: number;
  hidden: number;
  today: number;
  withReports: number;
}

/** Лог действий администратора */
export interface AdminLog {
  _id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  details?: Record<string, unknown>;
  targetType?: "user" | "title" | "chapter" | "comment" | "system";
  targetId?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

/** Параметры запроса логов */
export interface AdminLogsQuery {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}

/** Элемент списка тайтлов в админке */
export interface AdminTitleListItem {
  _id: string;
  name: string;
  slug: string;
  status?: string;
  type?: string;
  isPublished?: boolean;
  totalChapters?: number;
  createdAt?: string;
  updatedAt?: string;
  chaptersRemovedByCopyrightHolder?: boolean;
}

/** Параметры запроса списка тайтлов для админки */
export interface AdminTitlesQuery {
  page?: number;
  limit?: number;
  isPublished?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** Запрос на массовое обновление тайтлов */
export interface BulkUpdateTitlesRequest {
  titleIds: string[];
  updates: {
    status?: TitleStatus;
    type?: TitleType;
    genres?: string[];
    tags?: string[];
    isPublished?: boolean;
    isAdult?: boolean;
  };
}

/** Формат экспорта */
export type ExportFormat = "csv" | "json";

/** Параметры экспорта пользователей */
export interface ExportUsersParams {
  format: ExportFormat;
  fields?: string[];
  filters?: {
    role?: string;
    status?: string;
    createdAfter?: string;
    createdBefore?: string;
  };
}

/** Параметры экспорта тайтлов */
export interface ExportTitlesParams {
  format: ExportFormat;
  fields?: string[];
  filters?: {
    type?: TitleType;
    status?: TitleStatus;
    isPublished?: boolean;
    createdAfter?: string;
    createdBefore?: string;
  };
}
