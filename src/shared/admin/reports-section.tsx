"use client";

// Component for managing reports in admin panel

import { useState, useEffect } from "react";
import {
  useGetReportsQuery,
  useUpdateReportStatusMutation,
  useDeleteReportMutation,
} from "@/store/api/reportsApi";
import { Report, ReportType } from "@/types/report";
import Button from "@/shared/ui/button";
import { AlertTriangle, CheckCircle, XCircle, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const reportTypeLabels = {
  [ReportType.ERROR]: "Ошибка",
  [ReportType.TYPO]: "Опечатка",
  [ReportType.COMPLAINT]: "Жалоба",
};

const reportTypeColors = {
  [ReportType.ERROR]: "bg-red-500",
  [ReportType.TYPO]: "bg-blue-500",
  [ReportType.COMPLAINT]: "bg-yellow-500",
};

export function ReportsSection() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("");
  const [isResolvedFilter, setIsResolvedFilter] = useState<string>("");

  const { data, error, isLoading, refetch } = useGetReportsQuery({
    page,
    limit,
    reportType: reportTypeFilter || undefined,
    isResolved: isResolvedFilter || undefined,
  });

  const [updateReportStatus] = useUpdateReportStatusMutation();
  const [deleteReport] = useDeleteReportMutation();
  const toast = useToast();

  const handleStatusChange = async (id: string, isResolved: boolean) => {
    try {
      await updateReportStatus({ id, data: { isResolved } }).unwrap();
      toast.success(`Жалоба ${isResolved ? "закрыта" : "открыта"} успешно`);
      refetch();
    } catch (error) {
      toast.error("Не удалось обновить статус жалобы");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReport(id).unwrap();
      toast.success("Жалоба удалена успешно");
      refetch();
    } catch (error) {
      toast.error("Не удалось удалить жалобу");
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
      <div className="bg-[var(--destructive)]/10 border border-[var(--destructive)] rounded-lg p-4">
        <p className="text-[var(--destructive)]">
          Ошибка загрузки жалоб: {JSON.stringify(error)}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
          Управление жалобами
        </h2>
        <p className="text-[var(--muted-foreground)]">
          Просмотр и управление всеми жалобами пользователей
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Тип жалобы
          </label>
          <select
            value={reportTypeFilter}
            onChange={(e) => setReportTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="">Все типы</option>
            {Object.entries(reportTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Статус
          </label>
          <select
            value={isResolvedFilter}
            onChange={(e) => setIsResolvedFilter(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="">Все</option>
            <option value="true">Решенные</option>
            <option value="false">Нерешенные</option>
          </select>
        </div>

        <div className="flex items-end">
          <Button onClick={refetch} variant="outline" className="w-full">
            Обновить
          </Button>
        </div>
      </div>

      {/* Reports Table */}
      {data?.data?.reports && data.data.reports.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-4 font-medium text-[var(--foreground)]">
                  Тип
                </th>
                <th className="text-left py-3 px-4 font-medium text-[var(--foreground)]">
                  Описание
                </th>
                <th className="text-left py-3 px-4 font-medium text-[var(--foreground)]">
                  Сущность
                </th>
                <th className="text-left py-3 px-4 font-medium text-[var(--foreground)]">
                  Статус
                </th>
                <th className="text-left py-3 px-4 font-medium text-[var(--foreground)]">
                  Дата
                </th>
                <th className="text-left py-3 px-4 font-medium text-[var(--foreground)]">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data.reports.map((report: Report) => (
                <tr
                  key={report._id}
                  className="border-b border-[var(--border)] hover:bg-[var(--accent)]"
                >
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs text-white ${
                        reportTypeColors[report.reportType]
                      }`}
                    >
                      {reportTypeLabels[report.reportType]}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate">
                    {report.content}
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize">
                      {report.entityType === "title" ? "Тайтл" : "Глава"}:{" "}
                      {report.entityId}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {report.isResolved ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Решена
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-500">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Открыта
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleStatusChange(report._id, !report.isResolved)
                        }
                      >
                        {report.isResolved ? (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            Открыть
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Закрыть
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(report._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">
            Жалобы не найдены
          </h3>
          <p className="text-[var(--muted-foreground)]">
            Нет жалоб, соответствующих выбранным фильтрам
          </p>
        </div>
      )}

      {/* Pagination */}
      {data?.data?.totalPages && data.data.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            variant="outline"
          >
            Назад
          </Button>

          <span className="text-[var(--muted-foreground)]">
            Страница {page} из {data.data.totalPages}
          </span>

          <Button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page === data.data.totalPages}
            variant="outline"
          >
            Вперед
          </Button>
        </div>
      )}
    </div>
  );
}
