"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  useGetReportsQuery,
  useUpdateReportStatusMutation,
  useDeleteReportMutation,
} from "@/store/api/reportsApi";
import { Report, ReportType } from "@/types/report";
import Button from "@/shared/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  Grid3X3,
  LayoutList,
  Clock3,
  MessageSquareReply,
  CheckSquare,
  Square,
  X,
  Download,
  FileText,
  RefreshCw,
  ExternalLink,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { formatUsernameDisplay } from "@/lib/username-display";
import { ReportEntityInfo } from "./ReportEntityInfo";
import { AdminModal, ConfirmModal } from "./ui/AdminModal";
import Image from "next/image";
import { getCoverUrls } from "@/lib/asset-url";

const DEFAULT_AVATAR = "/logo/ring_logo.png";

function isValidAvatarUrl(avatar: string | undefined): boolean {
  if (!avatar) return false;
  if (avatar.includes("undefined") || avatar.includes("null")) return false;
  return true;
}

function isStaticAsset(path: string): boolean {
  return path.startsWith("/logo/") || path.startsWith("/images/") || path.startsWith("/icons/");
}

function getUserAvatar(report: Report): string {
  if (!report.userId) return DEFAULT_AVATAR;
  const avatar = report.userId.avatar;
  return isValidAvatarUrl(avatar) ? avatar! : DEFAULT_AVATAR;
}

function normalizeAvatarUrl(url: string): string {
  if (isStaticAsset(url)) return url;
  return getCoverUrls(url, "").primary;
}

const RESPONSE_TEMPLATES = [
  { label: "Исправлено", text: "Спасибо за обращение! Проблема была исправлена." },
  { label: "Проверено", text: "Спасибо за сообщение. Мы проверили указанную информацию." },
  { label: "Опечатка исправлена", text: "Опечатка исправлена. Благодарим за внимательность!" },
  { label: "Дубликат", text: "Эта проблема уже была решена ранее. Спасибо за обращение." },
  {
    label: "Не воспроизводится",
    text: "К сожалению, нам не удалось воспроизвести описанную проблему. Если она повторится, пожалуйста, сообщите нам.",
  },
  { label: "Отклонено", text: "После рассмотрения мы решили отклонить данное обращение." },
];

type ReportsViewMode = "list" | "cards";
type ReportsSortMode = "newest" | "oldest" | "open-first";
type EntityTypeFilter = "all" | "title" | "chapter";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн назад`;

  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

const reportTypeLabels = {
  [ReportType.ERROR]: "Ошибка",
  [ReportType.TYPO]: "Опечатка",
  [ReportType.COMPLAINT]: "Жалоба",
  [ReportType.MISSING_PAGES]: "Нет страниц",
  [ReportType.BROKEN_IMAGES]: "Битые изображения",
  [ReportType.WRONG_ORDER]: "Неверный порядок",
  [ReportType.DUPLICATE]: "Дубликат",
  [ReportType.OTHER]: "Другое",
};

const reportTypeColors = {
  [ReportType.ERROR]: "bg-[var(--destructive)]",
  [ReportType.TYPO]: "bg-[var(--chart-1)]",
  [ReportType.COMPLAINT]: "bg-[var(--chart-5)]",
  [ReportType.MISSING_PAGES]: "bg-amber-500/80",
  [ReportType.BROKEN_IMAGES]: "bg-orange-500/80",
  [ReportType.WRONG_ORDER]: "bg-[var(--chart-2)]",
  [ReportType.DUPLICATE]: "bg-[var(--chart-3)]",
  [ReportType.OTHER]: "bg-[var(--muted)]",
};

function getReportResponse(report: Report | null): string {
  if (!report) return "";
  return report.resolutionMessage ?? report.response ?? report.reply ?? report.adminResponse ?? "";
}

export function ReportsSection() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("");
  const [isResolvedFilter, setIsResolvedFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ReportsViewMode>("cards");
  const [sortMode, setSortMode] = useState<ReportsSortMode>("open-first");
  const [responseModalReport, setResponseModalReport] = useState<Report | null>(null);
  const [responseModalResolveTo, setResponseModalResolveTo] = useState<boolean | null>(null);
  const [responseModalText, setResponseModalText] = useState("");
  const [isResponseSubmitting, setIsResponseSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkResolveOpen, setBulkResolveOpen] = useState(false);
  const [isBulkResolving, setIsBulkResolving] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityTypeFilter>("all");
  const [detailReport, setDetailReport] = useState<Report | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- зарезервировано для расширенных фильтров
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { data, error, isLoading, refetch } = useGetReportsQuery({
    page,
    limit,
    reportType: reportTypeFilter || undefined,
    isResolved: isResolvedFilter || undefined,
  });

  const [updateReportStatus, { isLoading: isStatusUpdating }] = useUpdateReportStatusMutation();
  const [deleteReport, { isLoading: isDeleting }] = useDeleteReportMutation();
  const toast = useToast();

  useEffect(() => {
    setPage(1);
  }, [reportTypeFilter, isResolvedFilter, limit]);

  const reports = useMemo(() => data?.data?.reports || [], [data]);
  const processedReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = reports.filter(report => {
      // Entity type filter
      if (entityTypeFilter !== "all" && report.entityType !== entityTypeFilter) {
        return false;
      }

      if (!normalizedSearch) return true;
      const haystack = [
        report.content,
        report.userId?.username,
        report.entityId,
        report._id,
        report.reportType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });

    return filtered.sort((a, b) => {
      if (sortMode === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortMode === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (a.isResolved !== b.isResolved) {
        return Number(a.isResolved) - Number(b.isResolved);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reports, searchTerm, sortMode, entityTypeFilter]);

  const stats = useMemo(
    () => ({
      total: processedReports.length,
      open: processedReports.filter(report => !report.isResolved).length,
      resolved: processedReports.filter(report => report.isResolved).length,
      critical: processedReports.filter(report => report.reportType === ReportType.ERROR).length,
    }),
    [processedReports],
  );

  const getErrorMessage = (err: unknown) => {
    if (typeof err === "string") return err;
    if (err && typeof err === "object") {
      const maybe = err as { data?: { message?: string }; message?: string };
      return maybe.data?.message || maybe.message || "Неизвестная ошибка";
    }
    return "Неизвестная ошибка";
  };

  const openResponseModal = (report: Report, resolveTo: boolean) => {
    setResponseModalReport(report);
    setResponseModalResolveTo(resolveTo);
    setResponseModalText(getReportResponse(report));
  };

  const closeResponseModal = () => {
    setResponseModalReport(null);
    setResponseModalResolveTo(null);
    setResponseModalText("");
  };

  const handleResponseModalSubmit = async () => {
    if (!responseModalReport) return;
    const trimmed = responseModalText.trim();
    if (!trimmed) {
      toast.error("Текст ответа не может быть пустым");
      return;
    }
    const isResolved = responseModalResolveTo ?? responseModalReport.isResolved;
    setIsResponseSubmitting(true);
    try {
      await updateReportStatus({
        id: responseModalReport._id,
        data: { isResolved, resolutionMessage: trimmed },
      }).unwrap();
      toast.success(
        isResolved !== responseModalReport.isResolved
          ? `Жалоба ${isResolved ? "закрыта" : "открыта"} успешно`
          : "Ответ сохранён",
      );
      refetch();
      closeResponseModal();
    } catch (e) {
      toast.error(`Не удалось сохранить ответ: ${getErrorMessage(e)}`);
    } finally {
      setIsResponseSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, isResolved: boolean) => {
    const report = reports.find(item => item._id === id);
    if (isResolved && report) {
      openResponseModal(report, true);
      return;
    }
    try {
      await updateReportStatus({ id, data: { isResolved } }).unwrap();
      toast.success(`Отчёт ${isResolved ? "закрыт" : "открыт"} успешно`);
      refetch();
    } catch (e) {
      toast.error(`Не удалось обновить статус: ${getErrorMessage(e)}`);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = confirm("Удалить жалобу? Это действие нельзя отменить.");
    if (!confirmed) return;
    try {
      await deleteReport(id).unwrap();
      toast.success("Жалоба удалена успешно");
      refetch();
    } catch (e) {
      toast.error(`Не удалось удалить жалобу: ${getErrorMessage(e)}`);
    }
  };

  const handleSelectReport = useCallback((id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  const handleSelectAll = useCallback(() => {
    const unresolvedIds = processedReports.filter(r => !r.isResolved).map(r => r._id);
    if (selectedIds.length === unresolvedIds.length && unresolvedIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unresolvedIds);
    }
  }, [selectedIds.length, processedReports]);

  const handleBulkResolve = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkResolving(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map(id =>
          updateReportStatus({
            id,
            data: { isResolved: true, resolutionMessage: "Массово закрыто администратором" },
          }).unwrap(),
        ),
      );
      const failed = results.filter(r => r.status === "rejected").length;
      const success = results.length - failed;
      if (failed === 0) {
        toast.success(`Закрыто ${success} жалоб`);
      } else {
        toast.error(`Закрыто: ${success}, ошибок: ${failed}`);
      }
      setSelectedIds([]);
      setBulkResolveOpen(false);
      refetch();
    } catch {
      toast.error("Ошибка при массовом закрытии");
    } finally {
      setIsBulkResolving(false);
    }
  };

  const handleUseTemplate = (text: string) => {
    setResponseModalText(text);
    setShowTemplates(false);
  };

  const handleExportCSV = useCallback(() => {
    const headers = ["ID", "Тип", "Контент", "Пользователь", "Статус", "Дата создания", "Ответ"];
    const rows = processedReports.map(r => [
      r._id,
      reportTypeLabels[r.reportType] || r.reportType,
      `"${(r.content || "").replace(/"/g, '""')}"`,
      r.userId?.username ? formatUsernameDisplay(r.userId.username) : "Аноним",
      r.isResolved ? "Решена" : "Открыта",
      new Date(r.createdAt).toLocaleDateString("ru-RU"),
      `"${(getReportResponse(r) || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [processedReports]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const results = await Promise.allSettled(selectedIds.map(id => deleteReport(id).unwrap()));
      const failed = results.filter(r => r.status === "rejected").length;
      const success = results.length - failed;
      if (failed === 0) {
        toast.success(`Удалено ${success} жалоб`);
      } else {
        toast.error(`Удалено: ${success}, ошибок: ${failed}`);
      }
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      refetch();
    } catch {
      toast.error("Ошибка при массовом удалении");
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedIds, deleteReport, toast, refetch]);

  const handleViewUserProfile = useCallback((userId: string) => {
    window.open(`/user/${userId}`, "_blank");
  }, []);

  const openDetailModal = useCallback((report: Report) => {
    setDetailReport(report);
  }, []);

  const closeDetailModal = useCallback(() => {
    setDetailReport(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--destructive)]/10 border border-[var(--destructive)] rounded-[var(--admin-radius)] p-4">
        <p className="text-[var(--destructive)]">Ошибка загрузки жалоб: {JSON.stringify(error)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox label="После фильтров" value={stats.total} />
        <StatBox label="Открытые" value={stats.open} />
        <StatBox label="Решенные" value={stats.resolved} />
        <StatBox label="Ошибки" value={stats.critical} />
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Поиск по жалобам, пользователю, id..."
            className="admin-input w-full pl-9"
          />
        </div>

        <select
          value={reportTypeFilter}
          onChange={e => setReportTypeFilter(e.target.value)}
          className="admin-input"
        >
          <option value="">Все типы</option>
          {Object.entries(reportTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={isResolvedFilter}
          onChange={e => setIsResolvedFilter(e.target.value)}
          className="admin-input"
        >
          <option value="">Все статусы</option>
          <option value="false">Нерешенные</option>
          <option value="true">Решенные</option>
        </select>

        <select
          value={sortMode}
          onChange={e => setSortMode(e.target.value as ReportsSortMode)}
          className="admin-input"
        >
          <option value="open-first">Открытые сначала</option>
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
        </select>

        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          className="admin-input"
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <div className="flex items-center rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--secondary)] p-1">
          <button
            onClick={() => setViewMode("cards")}
            className={`p-1.5 rounded ${viewMode === "cards" ? "bg-[var(--card)] text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}
            title="Карточки"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded ${viewMode === "list" ? "bg-[var(--card)] text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}
            title="Список"
          >
            <LayoutList className="w-4 h-4" />
          </button>
        </div>

        <select
          value={entityTypeFilter}
          onChange={e => setEntityTypeFilter(e.target.value as EntityTypeFilter)}
          className="admin-input"
        >
          <option value="all">Все источники</option>
          <option value="title">Тайтлы</option>
          <option value="chapter">Главы</option>
        </select>

        <button
          onClick={handleExportCSV}
          className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          title="Экспорт CSV"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
          title="Обновить"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30">
          <span className="text-sm font-medium text-[var(--primary)]">
            Выбрано: {selectedIds.length}
          </span>
          <button
            onClick={handleSelectAll}
            className="text-xs sm:text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            {selectedIds.length === processedReports.filter(r => !r.isResolved).length
              ? "Снять все"
              : "Выбрать все открытые"}
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setBulkResolveOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-green-600 hover:bg-green-500/10 rounded-lg transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Закрыть</span>
          </button>
          <button
            onClick={() => setBulkDeleteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Удалить</span>
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {processedReports.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">Жалобы не найдены</h3>
          <p className="text-[var(--muted-foreground)]">
            Нет жалоб, соответствующих выбранным фильтрам
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-3">
          {processedReports.map(report => (
            <article
              key={report._id}
              className={`rounded-xl border p-4 ${
                report.isResolved
                  ? "border-[var(--border)] bg-[var(--background)]/70 opacity-70"
                  : selectedIds.includes(report._id)
                    ? "border-[var(--primary)]/50 bg-[var(--primary)]/5"
                    : "border-[var(--border)] bg-[var(--background)]/70"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {!report.isResolved && (
                    <button
                      onClick={() => handleSelectReport(report._id)}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex-shrink-0 mt-0.5"
                    >
                      {selectedIds.includes(report._id) ? (
                        <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-[var(--admin-radius)] text-xs text-white ${reportTypeColors[report.reportType] ?? "bg-[var(--muted)]"}`}
                    >
                      {reportTypeLabels[report.reportType] ?? report.reportType}
                    </span>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)] font-mono break-all">
                      {report._id}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-[var(--admin-radius)] text-xs ${
                    report.isResolved
                      ? "bg-[var(--chart-2)]/15 text-[var(--chart-2)]"
                      : "bg-[var(--chart-5)]/15 text-[var(--chart-5)]"
                  }`}
                >
                  {report.isResolved ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Решена
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Открыта
                    </>
                  )}
                </span>
              </div>

              <p className="mt-3 text-sm text-[var(--foreground)] whitespace-pre-wrap">
                {report.content}
              </p>
              {(report.response || report.reply || report.adminResponse) && (
                <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 p-2.5">
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">
                    Ответ администратора
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground)] whitespace-pre-wrap">
                    {report.response || report.reply || report.adminResponse}
                  </p>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
                <button
                  onClick={() => report.userId && handleViewUserProfile(report.userId._id)}
                  disabled={!report.userId}
                  className="inline-flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors disabled:opacity-50"
                >
                  <Image
                    src={normalizeAvatarUrl(getUserAvatar(report))}
                    alt=""
                    width={16}
                    height={16}
                    unoptimized
                    className="w-4 h-4 rounded-full object-cover bg-[var(--secondary)]"
                  />
                  {report.userId?.username
                    ? formatUsernameDisplay(report.userId.username)
                    : "Аноним"}
                  {report.userId && <ExternalLink className="w-2.5 h-2.5 opacity-50" />}
                </button>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="w-3.5 h-3.5" />
                  {formatTimeAgo(report.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--secondary)]">
                  {report.entityType === "title" ? "Тайтл" : "Глава"}
                </span>
              </div>

              <div className="mt-2 text-sm">
                <ReportEntityInfo
                  entityType={report.entityType}
                  entityId={report.entityId}
                  titleId={report.titleId}
                />
              </div>

              <div className="mt-3 flex justify-end gap-1">
                <button
                  onClick={() => openDetailModal(report)}
                  className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded-[var(--admin-radius)] transition-colors"
                  title="Подробнее"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openResponseModal(report, report.isResolved)}
                  disabled={isStatusUpdating}
                  className="p-2 text-[var(--muted-foreground)] hover:text-blue-500 hover:bg-blue-500/10 rounded-[var(--admin-radius)] transition-colors"
                  title={getReportResponse(report) ? "Изменить ответ" : "Ответить"}
                >
                  <MessageSquareReply className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleStatusChange(report._id, !report.isResolved)}
                  disabled={isStatusUpdating}
                  className={`p-2 rounded-[var(--admin-radius)] transition-colors ${
                    report.isResolved
                      ? "text-yellow-500 hover:bg-yellow-500/10"
                      : "text-green-500 hover:bg-green-500/10"
                  }`}
                  title={report.isResolved ? "Открыть" : "Закрыть"}
                >
                  {report.isResolved ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(report._id)}
                  disabled={isDeleting}
                  className="p-2 text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded-[var(--admin-radius)] transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--secondary)]">
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs w-10">
                  <button
                    onClick={handleSelectAll}
                    className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {selectedIds.length === processedReports.filter(r => !r.isResolved).length &&
                    processedReports.filter(r => !r.isResolved).length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">
                  Тип
                </th>
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">
                  Описание
                </th>
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">
                  Пользователь
                </th>
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">
                  Статус
                </th>
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">
                  Дата
                </th>
                <th className="text-right py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {processedReports.map(report => (
                <tr
                  key={report._id}
                  className={`border-b border-[var(--border)] hover:bg-[var(--accent)]/50 transition-colors ${
                    report.isResolved
                      ? "opacity-70"
                      : selectedIds.includes(report._id)
                        ? "bg-[var(--primary)]/5"
                        : ""
                  }`}
                >
                  <td className="py-2.5 px-3">
                    {!report.isResolved ? (
                      <button
                        onClick={() => handleSelectReport(report._id)}
                        className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        {selectedIds.includes(report._id) ? (
                          <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <span className="w-6 h-6 block" />
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-[var(--admin-radius)] text-xs text-white ${reportTypeColors[report.reportType] ?? "bg-[var(--muted)]"}`}
                    >
                      {reportTypeLabels[report.reportType] ?? report.reportType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[var(--foreground)] text-sm block">{report.content}</span>
                    {(report.response || report.reply || report.adminResponse) && (
                      <span className="text-xs text-[var(--muted-foreground)] mt-1 block">
                        Ответ: {report.response || report.reply || report.adminResponse}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <Image
                        src={normalizeAvatarUrl(getUserAvatar(report))}
                        alt=""
                        width={24}
                        height={24}
                        unoptimized
                        className="w-6 h-6 rounded-full object-cover bg-[var(--secondary)]"
                      />
                      <span className="font-medium text-sm">
                        {report.userId?.username
                          ? formatUsernameDisplay(report.userId.username)
                          : "Аноним"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    {report.isResolved ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--admin-radius)] text-xs bg-[var(--chart-2)]/15 text-[var(--chart-2)]">
                        <CheckCircle className="w-3 h-3 mr-0.5" />
                        Решена
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--admin-radius)] text-xs bg-[var(--chart-5)]/15 text-[var(--chart-5)]">
                        <AlertTriangle className="w-3 h-3 mr-0.5" />
                        Открыта
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[var(--muted-foreground)] text-sm">
                      {new Date(report.createdAt).toLocaleDateString("ru-RU")}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openResponseModal(report, report.isResolved)}
                        disabled={isStatusUpdating}
                        className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded-[var(--admin-radius)] transition-colors"
                        title={getReportResponse(report) ? "Изменить ответ" : "Ответить"}
                      >
                        <MessageSquareReply className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(report._id, !report.isResolved)}
                        disabled={isStatusUpdating}
                        className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded-[var(--admin-radius)] transition-colors"
                        title={report.isResolved ? "Открыть" : "Закрыть"}
                      >
                        {report.isResolved ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(report._id)}
                        disabled={isDeleting}
                        className="p-2 text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded-[var(--admin-radius)] transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.data?.totalPages && data.data.totalPages > 1 && (
        <div className="flex justify-between items-center border-t border-[var(--border)] pt-3">
          <span className="text-sm text-[var(--muted-foreground)]">
            Страница {page} из {data.data.totalPages} • Всего: {data.data.total}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              variant="outline"
              size="sm"
            >
              Назад
            </Button>
            <Button
              onClick={() => setPage(prev => Math.min(data.data.totalPages, prev + 1))}
              disabled={page === data.data.totalPages}
              variant="outline"
              size="sm"
            >
              Вперед
            </Button>
          </div>
        </div>
      )}

      <AdminModal
        isOpen={!!responseModalReport}
        onClose={closeResponseModal}
        title={
          responseModalResolveTo === true
            ? "Ответ на отчёт и закрытие"
            : getReportResponse(responseModalReport)
              ? "Изменить ответ на отчёт"
              : "Ответ на отчёт"
        }
        size="lg"
        closeOnOverlayClick={!isResponseSubmitting}
        closeOnEsc={!isResponseSubmitting}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeResponseModal}
              disabled={isResponseSubmitting}
              className="admin-btn admin-btn-secondary"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleResponseModalSubmit}
              disabled={isResponseSubmitting || !responseModalText.trim()}
              className="admin-btn admin-btn-primary disabled:opacity-50"
            >
              {isResponseSubmitting
                ? "Сохранение..."
                : responseModalResolveTo === true
                  ? "Ответить и закрыть"
                  : "Сохранить ответ"}
            </button>
          </div>
        }
      >
        <p className="text-sm text-[var(--muted-foreground)] mb-2">
          Текст сохранится в отчёте. Для жалоб он будет отправлен инициатору. Ответ можно изменить
          позже.
        </p>

        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
          >
            <FileText className="w-4 h-4" />
            {showTemplates ? "Скрыть шаблоны" : "Использовать шаблон"}
          </button>
          {showTemplates && (
            <div className="mt-2 flex flex-wrap gap-2">
              {RESPONSE_TEMPLATES.map(template => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => handleUseTemplate(template.text)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors"
                >
                  {template.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <textarea
          value={responseModalText}
          onChange={e => setResponseModalText(e.target.value)}
          placeholder="Введите ответ (например: «Исправлено», «Проверено» или развёрнутый комментарий)..."
          rows={5}
          maxLength={2000}
          className="admin-input w-full resize-y min-h-[120px]"
          disabled={isResponseSubmitting}
        />
        <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
          {responseModalText.length} / 2000
        </p>
      </AdminModal>

      <ConfirmModal
        isOpen={bulkResolveOpen}
        onClose={() => setBulkResolveOpen(false)}
        onConfirm={handleBulkResolve}
        title="Массовое закрытие жалоб"
        message={`Вы уверены, что хотите закрыть ${selectedIds.length} жалоб? Они будут отмечены как решённые.`}
        confirmText={isBulkResolving ? "Закрытие..." : "Закрыть"}
        confirmVariant="primary"
        isLoading={isBulkResolving}
      />

      <ConfirmModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Массовое удаление жалоб"
        message={`Вы уверены, что хотите удалить ${selectedIds.length} жалоб? Это действие нельзя отменить.`}
        confirmText={isBulkDeleting ? "Удаление..." : "Удалить"}
        confirmVariant="danger"
        isLoading={isBulkDeleting}
      />

      {/* Report Detail Modal */}
      <AdminModal
        isOpen={!!detailReport}
        onClose={closeDetailModal}
        title="Детали жалобы"
        size="lg"
      >
        {detailReport && (
          <div className="space-y-4">
            {/* Status and Type */}
            <div className="flex items-center gap-3">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white ${reportTypeColors[detailReport.reportType] ?? "bg-[var(--muted)]"}`}
              >
                {reportTypeLabels[detailReport.reportType] ?? detailReport.reportType}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  detailReport.isResolved
                    ? "bg-[var(--chart-2)]/15 text-[var(--chart-2)]"
                    : "bg-[var(--chart-5)]/15 text-[var(--chart-5)]"
                }`}
              >
                {detailReport.isResolved ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Решена
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-1.5" />
                    Открыта
                  </>
                )}
              </span>
            </div>

            {/* User info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--secondary)]/50">
              <Image
                src={normalizeAvatarUrl(getUserAvatar(detailReport))}
                alt=""
                width={40}
                height={40}
                unoptimized
                className="w-10 h-10 rounded-full object-cover bg-[var(--secondary)]"
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-[var(--foreground)]">
                  {detailReport.userId?.username
                    ? formatUsernameDisplay(detailReport.userId.username)
                    : "Аноним"}
                </span>
                {detailReport.userId?.email && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {detailReport.userId.email}
                  </p>
                )}
              </div>
              {detailReport.userId && (
                <button
                  onClick={() => handleViewUserProfile(detailReport.userId._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-sm hover:bg-[var(--primary)]/20 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Профиль
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                <p className="text-xs text-[var(--muted-foreground)]">Создана</p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {new Date(detailReport.createdAt).toLocaleDateString("ru-RU")}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                <p className="text-xs text-[var(--muted-foreground)]">Источник</p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {detailReport.entityType === "title" ? "Тайтл" : "Глава"}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                <p className="text-xs text-[var(--muted-foreground)]">ID жалобы</p>
                <p className="text-[10px] font-mono text-[var(--foreground)] truncate">
                  {detailReport._id}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                <p className="text-xs text-[var(--muted-foreground)]">Entity ID</p>
                <p className="text-[10px] font-mono text-[var(--foreground)] truncate">
                  {detailReport.entityId}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="rounded-lg border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--muted-foreground)] mb-2">Содержание жалобы</p>
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                {detailReport.content}
              </p>
            </div>

            {/* Admin response */}
            {getReportResponse(detailReport) && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                <p className="text-xs text-green-600 mb-2">Ответ администратора</p>
                <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                  {getReportResponse(detailReport)}
                </p>
                {detailReport.resolvedAt && (
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    Закрыта: {new Date(detailReport.resolvedAt).toLocaleString("ru-RU")}
                  </p>
                )}
              </div>
            )}

            {/* Entity link */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--secondary)]/50">
              <span className="text-sm text-[var(--muted-foreground)]">Источник:</span>
              <ReportEntityInfo
                entityType={detailReport.entityType}
                entityId={detailReport.entityId}
                titleId={detailReport.titleId}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => {
                  openResponseModal(detailReport, detailReport.isResolved);
                  closeDetailModal();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
              >
                <MessageSquareReply className="w-4 h-4" />
                {getReportResponse(detailReport) ? "Изменить ответ" : "Ответить"}
              </button>
              <button
                onClick={() => {
                  handleStatusChange(detailReport._id, !detailReport.isResolved);
                  closeDetailModal();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  detailReport.isResolved
                    ? "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
                    : "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                }`}
              >
                {detailReport.isResolved ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {detailReport.isResolved ? "Переоткрыть" : "Закрыть"}
              </button>
              <button
                onClick={() => {
                  handleDelete(detailReport._id);
                  closeDetailModal();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
