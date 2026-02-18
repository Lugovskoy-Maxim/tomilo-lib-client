export enum ReportType {
  ERROR = "error",
  TYPO = "typo",
  COMPLAINT = "complaint",
}

export interface ReportUser {
  _id: string;
  username: string;
  email: string;
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
  entityId: string;
  entityType: "title" | "chapter";
  url: string | null;
  userId: ReportUser;
  creatorId: string | null;
  titleId: string;
  isResolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CreateReportDto {
  entityType: "title" | "chapter";
  entityId: string;
  reportType: ReportType;
  content: string;
  creatorId?: string;
  titleId?: string;
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
