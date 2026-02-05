"use client";

import { useState } from "react";
import {
  useGetReportsQuery,
  useUpdateReportStatusMutation,
  useDeleteReportMutation,
} from "@/store/api/reportsApi";
import { Report, ReportType } from "@/types/report";
import Button from "@/shared/ui/button";
import { AlertTriangle, CheckCircle, XCircle, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { ReportEntityInfo } from "./ReportEntityInfo";

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
  const [limit] = useState(20);
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
      toast.error(`Не удалось обновить статус жалобы, ${error}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReport(id).unwrap();
      toast.success("Жалоба удалена успешно");
      refetch();
    } catch (error) {
      toast.error(`Не удалось удалить жалобу, ${error}`);
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
        <p className="text-[var(--destructive)]">Ошибка загрузки жалоб: {JSON.stringify(error)}</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)]">
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-[var(--border)]">
        <select
          value={reportTypeFilter}
          onChange={e => setReportTypeFilter(e.target.value)}
          className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
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
          className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <option value="">Все статусы</option>
          <option value="true">Решенные</option>
          <option value="false">Нерешенные</option>
        </select>

        <Button onClick={refetch} variant="outline" size="sm" className="whitespace-nowrap">
          Обновить
        </Button>
      </div>

      {/* Reports Table */}
      {data?.data?.reports && data.data.reports.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--secondary)]">
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">
                  Тип
                </th>
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs hidden sm:table-cell">
                  Описание
                </th>
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs hidden md:table-cell">
                  Польз.
                </th>
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs hidden lg:table-cell">
                  Тайтл
                </th>
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">
                  Статус
                </th>
                <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground)] text-xs hidden xl:table-cell">
                  Дата
                </th>
                <th className="text-right py-2.5 px-3 font-medium text-[var(--foreground)] text-xs">
                  Действ.
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data.reports.map((report: Report) => (
                <tr
                  key={report._id}
                  className="border-b border-[var(--border)] hover:bg-[var(--accent)]/50 transition-colors"
                >
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs text-white ${
                        reportTypeColors[report.reportType]
                      }`}
                    >
                      {reportTypeLabels[report.reportType]}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 hidden sm:table-cell">
                    <span className="text-[var(--foreground)] text-sm block">
                      {report.content}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 hidden md:table-cell">
                    {report.userId ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-sm truncate max-w-[100px]">
                          {report.userId.username}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[var(--muted-foreground)] text-sm">Аноним</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 hidden lg:table-cell">
                    <ReportEntityInfo
                      entityType={report.entityType}
                      entityId={report.entityId}
                      titleId={report.titleId}
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    {report.isResolved ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-500 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle className="w-3 h-3 mr-0.5" />
                        Решена
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-300">
                        <AlertTriangle className="w-3 h-3 mr-0.5" />
                        Открыта
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 hidden xl:table-cell">
                    <span className="text-[var(--muted-foreground)] text-sm">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleStatusChange(report._id, !report.isResolved)}
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] rounded transition-colors"
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
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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
      ) : (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">Жалобы не найдены</h3>
          <p className="text-[var(--muted-foreground)]">
            Нет жалоб, соответствующих выбранным фильтрам
          </p>
        </div>
      )}

      {/* Pagination */}
      {data?.data?.totalPages && data.data.totalPages > 1 && (
        <div className="flex justify-between items-center p-4 border-t border-[var(--border)]">
          <span className="text-sm text-[var(--muted-foreground)]">
            Страница {page} из {data.data.totalPages}
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
              onClick={() => setPage(prev => prev + 1)}
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
