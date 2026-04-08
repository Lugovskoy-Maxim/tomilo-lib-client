import { Comment } from "./comment";

export interface SpamStats {
  totalSpamComments: number;
  totalRestrictedUsers: number;
  recentSpamComments: number;
}

export interface SpamCommentsQuery {
  page?: number;
  limit?: number;
  /**
   * Если сервер поддерживает — включает “старые” комментарии/историю, а не только недавние.
   * Без поддержки на сервере параметр будет проигнорирован.
   */
  includeOld?: boolean;
}

export interface SpamRestrictedUsersQuery {
  page?: number;
  limit?: number;
}

export interface SpamPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface SpamComment extends Comment {
  isSpam?: boolean;
  isSpamChecked?: boolean;
  spamDetectedAt?: string;
  spamCheckedBy?: string;
  spamScore?: number;
  spamReasons?: string[];
  /** Опционально, если сервер отдаёт денормализованную инфу о тайтле */
  titleInfo?: {
    _id: string;
    name: string;
    slug?: string;
  };
}

export interface SpamCommentsResponse {
  comments: SpamComment[];
  pagination: SpamPagination;
}

export interface SpamRestrictedUser {
  _id: string;
  username?: string;
  email?: string;
  avatar?: string;
  spamWarnings?: number;
  lastSpamWarningAt?: string;
  commentRestrictedUntil?: string | null;
}

export interface SpamRestrictedUsersResponse {
  users: SpamRestrictedUser[];
  pagination: SpamPagination;
}

/** Тело POST /admin/spam/backfill */
export interface SpamBackfillRequest {
  /** Глубина перепроверки в днях от текущей даты */
  days?: number;
  /** Макс. число комментариев за проход; без поля — по правилам бэкенда (часто без верхней границы) */
  limit?: number;
  onlyUnchecked?: boolean;
  dryRun?: boolean;
}

/** Ответ POST /admin/spam/backfill */
export interface SpamBackfillResult {
  scanned: number;
  markedSpam: number;
  warned: number;
  restricted: number;
}

