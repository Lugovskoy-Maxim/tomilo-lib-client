export enum ReportType {
  ERROR = "error",
  TYPO = "typo",
  COMPLAINT = "complaint",
}

export interface Report {
  _id: string;
  reporterId: string;
  entityType: "title" | "chapter";
  entityId: string;
  reportType: ReportType;
  content: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportDto {
  entityType: "title" | "chapter";
  entityId: string;
  reportType: ReportType;
  content: string;
}

export interface UpdateReportStatusDto {
  isResolved: boolean;
}

export interface ReportsResponse {
  reports: Report[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

import { ApiResponseDto } from "./api";
