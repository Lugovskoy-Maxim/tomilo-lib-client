export enum ReportType {
  ERROR = "error",
  TYPO = "typo",
  COMPLAINT = "complaint",
  MISSING_PAGES = "missing_pages",
  BROKEN_IMAGES = "broken_images",
  WRONG_ORDER = "wrong_order",
  DUPLICATE = "duplicate",
  OTHER = "other",
  /** Жалоба на комментарий пользователя */
  COMMENT_REPORT = "comment_report",
}

export interface ReportUser {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface Report {
  _id: string;
  reportType: ReportType;
  content: string;
  /** Ответ администратора (сервер возвращает resolutionMessage) */
  response?: string | null;
  reply?: string | null;
  adminResponse?: string | null;
  resolutionMessage?: string | null;
  entityId: string | null;
  entityType: "title" | "chapter" | "comment" | string | null;
  url: string | null;
  userId: ReportUser;
  creatorId: string | null;
  titleId: string | null;
  isResolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CreateReportDto {
  entityType: "title" | "chapter" | "comment";
  entityId: string;
  reportType: ReportType;
  content: string;
  creatorId?: string;
  titleId?: string;
  url?: string | null;
}

export interface UpdateReportStatusDto {
  isResolved: boolean;
  /** Текст ответа на жалобу (макс. 2000 символов). Сервер ожидает resolutionMessage. */
  resolutionMessage?: string;
}

export interface ReportsResponse {
  reports: Report[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}
