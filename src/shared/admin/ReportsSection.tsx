"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useGetReportsQuery,
  useUpdateReportStatusMutation,
  useDeleteReportMutation,
} from "@/store/api/reportsApi";
import { ReportType } from "@/types/report";
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
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { ReportEntityInfo } from "./ReportEntityInfo";

type ReportsViewMode = "list" | "cards";
type ReportsSortMode = "newest" | "oldest" | "open-first";

const reportTypeLabels = {
  [ReportType.ERROR]: "Ошибка",
  [ReportType.TYPO]: "Опечатка",
  [ReportType.COMPLAINT]: "Жалоба",
};

const reportTypeColors = {
  [ReportType.ERROR]: "bg-[var(--destructive)]",
  [ReportType.TYPO]: "bg-[var(--chart-1)]",
  [ReportType.COMPLAINT]: "bg-[var(--chart-5)]",
};

export function ReportsSection() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("");
  const [isResolvedFilter, setIsResolvedFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ReportsViewMode>("cards");
  const [sortMode, setSortMode] = useState<ReportsSortMode>("open-first");

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
  }, [reports, searchTerm, sortMode]);

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

  const handleStatusChange = async (id: string, isResolved: boolean) => {
    const report = reports.find(item => item._id === id);
    let response: string | undefined;

    if (isResolved && report?.reportType === ReportType.COMPLAINT) {
      const initialResponse = report.response || report.reply || report.adminResponse || "";
      const replyInput = prompt("Введите ответ на жалобу (будет отправлен инициатору):", initialResponse);
      if (replyInput === null) return;

      const trimmedReply = replyInput.trim();
      if (!trimmedReply) {
        toast.error("Ответ на жалобу не может быть пустым");
        return;
      }
      response = trimmedReply;
    }

    try {
      await updateReportStatus({ id, data: { isResolved, response } }).unwrap();
      toast.success(`Жалоба ${isResolved ? "закрыта" : "открыта"} успешно`);
      refetch();
    } catch (e) {
      toast.error(`Не удалось обновить статус жалобы: ${getErrorMessage(e)}`);
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

        <Button onClick={refetch} variant="outline" size="sm" className="whitespace-nowrap">
          Обновить
        </Button>
      </div>

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
              className="rounded-xl border border-[var(--border)] bg-[var(--background)]/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-[var(--admin-radius)] text-xs text-white ${reportTypeColors[report.reportType]}`}
                  >
                    {reportTypeLabels[report.reportType]}
                  </span>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)] font-mono break-all">{report._id}</p>
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

              <p className="mt-3 text-sm text-[var(--foreground)] whitespace-pre-wrap">{report.content}</p>
              {(report.response || report.reply || report.adminResponse) && (
                <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 p-2.5">
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">Ответ администратора</p>
                  <p className="mt-1 text-sm text-[var(--foreground)] whitespace-pre-wrap">
                    {report.response || report.reply || report.adminResponse}
                  </p>
                </div>
              )}

              <div className="mt-3 text-xs text-[var(--muted-foreground)]">
                <div>Пользователь: {report.userId?.username || "Аноним"}</div>
                <div className="mt-1 inline-flex items-center gap-1">
                  <Clock3 className="w-3.5 h-3.5" />
                  {new Date(report.createdAt).toLocaleString("ru-RU")}
                </div>
              </div>

              <div className="mt-2 text-sm">
                <ReportEntityInfo
                  entityType={report.entityType}
                  entityId={report.entityId}
                  titleId={report.titleId}
                />
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => handleStatusChange(report._id, !report.isResolved)}
                  disabled={isStatusUpdating}
                  className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded-[var(--admin-radius)] transition-colors"
                  title={report.isResolved ? "Открыть" : "Закрыть"}
                >
                  {report.isResolved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">Тип</th>
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">Описание</th>
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">Пользователь</th>
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">Статус</th>
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">Дата</th>
                <th className="text-right py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">Действия</th>
              </tr>
            </thead>
            <tbody>
              {processedReports.map(report => (
                <tr key={report._id} className="border-b border-[var(--border)] hover:bg-[var(--accent)]/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-[var(--admin-radius)] text-xs text-white ${reportTypeColors[report.reportType]}`}
                    >
                      {reportTypeLabels[report.reportType]}
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
                    <span className="font-medium text-sm">{report.userId?.username || "Аноним"}</span>
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
                        onClick={() => handleStatusChange(report._id, !report.isResolved)}
                        disabled={isStatusUpdating}
                        className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded-[var(--admin-radius)] transition-colors"
                        title={report.isResolved ? "Открыть" : "Закрыть"}
                      >
                        {report.isResolved ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
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
