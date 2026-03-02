"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ScrollText,
  Search,
  Filter,
  Download,
  User,
  Calendar,
  Activity,
  Shield,
  FileText,
  MessageCircle,
  Users,
  Settings,
  Bell,
  Tag,
  Trophy,
  ShoppingBag,
  FolderOpen,
  Megaphone,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";
import { AdminModal } from "./ui";
import {
  useGetAuditLogsQuery,
  useGetAuditLogStatsQuery,
  type AuditLog,
  type AuditAction,
} from "@/store/api/auditLogsApi";
import { AdminCard } from "./ui";
import { Pagination } from "@/shared/ui/pagination";

const ACTION_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  user_create: { label: "Создание пользователя", icon: Users, color: "text-green-500 bg-green-500/10" },
  user_update: { label: "Обновление пользователя", icon: Users, color: "text-blue-500 bg-blue-500/10" },
  user_delete: { label: "Удаление пользователя", icon: Users, color: "text-red-500 bg-red-500/10" },
  user_ban: { label: "Блокировка пользователя", icon: Shield, color: "text-red-500 bg-red-500/10" },
  user_unban: { label: "Разблокировка пользователя", icon: Shield, color: "text-green-500 bg-green-500/10" },
  user_role_change: { label: "Изменение роли", icon: Shield, color: "text-yellow-500 bg-yellow-500/10" },
  user_balance_change: { label: "Изменение баланса", icon: Users, color: "text-purple-500 bg-purple-500/10" },
  title_create: { label: "Создание тайтла", icon: FileText, color: "text-green-500 bg-green-500/10" },
  title_update: { label: "Обновление тайтла", icon: FileText, color: "text-blue-500 bg-blue-500/10" },
  title_delete: { label: "Удаление тайтла", icon: FileText, color: "text-red-500 bg-red-500/10" },
  chapter_create: { label: "Создание главы", icon: FileText, color: "text-green-500 bg-green-500/10" },
  chapter_update: { label: "Обновление главы", icon: FileText, color: "text-blue-500 bg-blue-500/10" },
  chapter_delete: { label: "Удаление главы", icon: FileText, color: "text-red-500 bg-red-500/10" },
  comment_delete: { label: "Удаление комментария", icon: MessageCircle, color: "text-red-500 bg-red-500/10" },
  report_resolve: { label: "Решение жалобы", icon: MessageCircle, color: "text-green-500 bg-green-500/10" },
  settings_update: { label: "Обновление настроек", icon: Settings, color: "text-blue-500 bg-blue-500/10" },
  notification_send: { label: "Отправка уведомления", icon: Bell, color: "text-purple-500 bg-purple-500/10" },
  ip_block: { label: "Блокировка IP", icon: Shield, color: "text-red-500 bg-red-500/10" },
  ip_unblock: { label: "Разблокировка IP", icon: Shield, color: "text-green-500 bg-green-500/10" },
  genre_create: { label: "Создание жанра", icon: Tag, color: "text-green-500 bg-green-500/10" },
  genre_update: { label: "Обновление жанра", icon: Tag, color: "text-blue-500 bg-blue-500/10" },
  genre_delete: { label: "Удаление жанра", icon: Tag, color: "text-red-500 bg-red-500/10" },
  achievement_create: { label: "Создание достижения", icon: Trophy, color: "text-green-500 bg-green-500/10" },
  achievement_update: { label: "Обновление достижения", icon: Trophy, color: "text-blue-500 bg-blue-500/10" },
  achievement_delete: { label: "Удаление достижения", icon: Trophy, color: "text-red-500 bg-red-500/10" },
  decoration_create: { label: "Создание декорации", icon: ShoppingBag, color: "text-green-500 bg-green-500/10" },
  decoration_update: { label: "Обновление декорации", icon: ShoppingBag, color: "text-blue-500 bg-blue-500/10" },
  decoration_delete: { label: "Удаление декорации", icon: ShoppingBag, color: "text-red-500 bg-red-500/10" },
  collection_create: { label: "Создание коллекции", icon: FolderOpen, color: "text-green-500 bg-green-500/10" },
  collection_update: { label: "Обновление коллекции", icon: FolderOpen, color: "text-blue-500 bg-blue-500/10" },
  collection_delete: { label: "Удаление коллекции", icon: FolderOpen, color: "text-red-500 bg-red-500/10" },
  announcement_create: { label: "Создание новости", icon: Megaphone, color: "text-green-500 bg-green-500/10" },
  announcement_update: { label: "Обновление новости", icon: Megaphone, color: "text-blue-500 bg-blue-500/10" },
  announcement_delete: { label: "Удаление новости", icon: Megaphone, color: "text-red-500 bg-red-500/10" },
  other: { label: "Другое", icon: Activity, color: "text-gray-500 bg-gray-500/10" },
};

const TARGET_TYPES = [
  { value: "", label: "Все типы" },
  { value: "user", label: "Пользователи" },
  { value: "title", label: "Тайтлы" },
  { value: "chapter", label: "Главы" },
  { value: "comment", label: "Комментарии" },
  { value: "report", label: "Жалобы" },
  { value: "settings", label: "Настройки" },
  { value: "notification", label: "Уведомления" },
  { value: "ip", label: "IP-адреса" },
  { value: "genre", label: "Жанры" },
  { value: "achievement", label: "Достижения" },
  { value: "decoration", label: "Декорации" },
  { value: "collection", label: "Коллекции" },
  { value: "announcement", label: "Новости" },
];

export function AuditLogsSection() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    action: "",
    targetType: "",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: logsData, isLoading, refetch } = useGetAuditLogsQuery({
    ...filters,
    page: currentPage,
    limit: 50,
  });
  const { data: statsData } = useGetAuditLogStatsQuery();

  const allLogs = logsData?.data?.logs || [];
  const pagination = logsData?.data?.pagination || { total: 0, page: 1, limit: 50, pages: 0 };
  const stats = statsData?.data;

  const logs = useMemo(() => {
    if (!searchTerm.trim()) return allLogs;
    const search = searchTerm.toLowerCase();
    return allLogs.filter(log => 
      log.username?.toLowerCase().includes(search) ||
      log.targetName?.toLowerCase().includes(search) ||
      log.ipAddress?.includes(search)
    );
  }, [allLogs, searchTerm]);

  const handleExportCSV = useCallback(() => {
    const headers = ["Дата", "Пользователь", "Роль", "Действие", "Цель", "IP"];
    const rows = logs.map(log => [
      formatDate(log.createdAt),
      log.username,
      log.userRole,
      getActionInfo(log.action).label,
      log.targetName || "",
      log.ipAddress || "",
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [logs]);

  const getActionInfo = (action: AuditAction) => {
    return ACTION_LABELS[action] || ACTION_LABELS.other;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU");
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "только что";
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} д назад`;
    return formatDate(dateString);
  };

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 min-[480px]:grid-cols-4 gap-2 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <p className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">Всего</p>
            <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">{stats.totalLogs}</p>
          </div>
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <p className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">Сегодня</p>
            <p className="text-xl sm:text-2xl font-bold text-[var(--primary)]">{stats.todayLogs}</p>
          </div>
          {stats.topActions?.[0] && (
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
              <p className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">Топ действие</p>
              <p className="text-sm sm:text-lg font-semibold text-[var(--foreground)] truncate">
                {getActionInfo(stats.topActions[0].action as AuditAction).label}
              </p>
              <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">{stats.topActions[0].count}x</p>
            </div>
          )}
          {stats.topUsers?.[0] && (
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
              <p className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">Топ админ</p>
              <p className="text-sm sm:text-lg font-semibold text-[var(--foreground)] truncate">
                {stats.topUsers[0].username}
              </p>
              <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">{stats.topUsers[0].count} действий</p>
            </div>
          )}
        </div>
      )}

      <AdminCard
        title="Аудит-логи"
        icon={<ScrollText className="w-4 h-4 sm:w-5 sm:h-5" />}
        action={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleExportCSV}
              className="admin-btn-secondary flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
              title="Экспорт CSV"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`admin-btn-secondary flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ${showFilters ? "bg-[var(--primary)]/10" : ""}`}
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden min-[400px]:inline">Фильтры</span>
            </button>
            <button onClick={() => refetch()} className="admin-btn-secondary flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm">
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск по пользователю, цели или IP..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="admin-input w-full pl-10 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {showFilters && (
            <div className="p-3 sm:p-4 rounded-lg bg-[var(--secondary)] space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">Тип</label>
                  <select
                    value={filters.targetType}
                    onChange={e => {
                      setFilters({ ...filters, targetType: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="admin-input w-full text-xs sm:text-sm"
                  >
                    {TARGET_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">Действие</label>
                  <select
                    value={filters.action}
                    onChange={e => {
                      setFilters({ ...filters, action: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="admin-input w-full text-xs sm:text-sm"
                  >
                    <option value="">Все</option>
                    {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">От</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={e => {
                      setFilters({ ...filters, startDate: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="admin-input w-full text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-[var(--muted-foreground)] mb-1">До</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={e => {
                      setFilters({ ...filters, endDate: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="admin-input w-full text-xs sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setFilters({ action: "", targetType: "", startDate: "", endDate: "" });
                    setCurrentPage(1);
                  }}
                  className="text-xs sm:text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Сбросить
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted-foreground)]">Логи не найдены</div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => {
                const actionInfo = getActionInfo(log.action);
                const ActionIcon = actionInfo.icon;
                return (
                  <div
                    key={log._id}
                    className="p-3 sm:p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors"
                  >
                    <div className="flex items-start gap-2 sm:gap-4">
                      <div className={`p-1.5 sm:p-2 rounded-lg ${actionInfo.color} flex-shrink-0`}>
                        <ActionIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base font-medium text-[var(--foreground)] truncate">{actionInfo.label}</p>
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 sm:gap-2 mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-[var(--muted-foreground)]">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="truncate max-w-[80px] sm:max-w-none">{log.username}</span>
                                <span className="px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-xs bg-[var(--card)]">
                                  {log.userRole}
                                </span>
                              </span>
                              {log.targetName && (
                                <span className="flex items-center gap-1 truncate">
                                  → <span className="truncate max-w-[60px] sm:max-w-none">{log.targetName}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">
                                {formatRelativeTime(log.createdAt)}
                              </p>
                              {log.ipAddress && (
                                <p className="text-[9px] sm:text-xs text-[var(--muted-foreground)] hidden sm:block">{log.ipAddress}</p>
                              )}
                            </div>
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] active:scale-95 transition-all"
                              title="Подробнее"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 rounded bg-[var(--card)] text-[9px] sm:text-xs text-[var(--muted-foreground)] overflow-x-auto max-h-20 sm:max-h-32">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                Показано {logs.length} из {pagination.total}
              </p>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </AdminCard>

      {/* Detail Modal */}
      <AdminModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Детали лога"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">Действие</p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {getActionInfo(selectedLog.action).label}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">Дата</p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {formatDate(selectedLog.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">Пользователь</p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {selectedLog.username} ({selectedLog.userRole})
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">IP-адрес</p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {selectedLog.ipAddress || "—"}
                </p>
              </div>
              {selectedLog.targetName && (
                <div className="col-span-2">
                  <p className="text-xs text-[var(--muted-foreground)]">Цель</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {selectedLog.targetName}
                  </p>
                </div>
              )}
            </div>
            
            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
              <div>
                <p className="text-xs text-[var(--muted-foreground)] mb-2">Детали</p>
                <div className="p-3 rounded-lg bg-[var(--secondary)] overflow-x-auto max-h-64">
                  <pre className="text-xs text-[var(--foreground)] whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="admin-btn-secondary"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
