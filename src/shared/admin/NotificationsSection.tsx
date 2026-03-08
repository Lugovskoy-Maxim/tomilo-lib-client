"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Bell,
  Send,
  Trash2,
  Users,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Megaphone,
  Link as LinkIcon,
  Calendar,
  Search,
  Copy,
  Filter,
  FileText,
  Eye,
} from "lucide-react";
import {
  useGetSystemNotificationsQuery,
  useSendSystemNotificationMutation,
  useGetNotificationStatsQuery,
  useDeleteSystemNotificationMutation,
  type SystemNotificationType,
  type SystemNotification,
} from "@/store/api/notificationsApi";
import { AdminCard, AdminModal, ConfirmModal } from "./ui";
import { useToast } from "@/hooks/useToast";
import { Pagination } from "@/shared/ui/pagination";

const NOTIFICATION_TYPES: {
  value: SystemNotificationType;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: "info", label: "Информация", icon: Info, color: "text-blue-500 bg-blue-500/10" },
  { value: "success", label: "Успех", icon: CheckCircle, color: "text-green-500 bg-green-500/10" },
  {
    value: "warning",
    label: "Предупреждение",
    icon: AlertTriangle,
    color: "text-yellow-500 bg-yellow-500/10",
  },
  { value: "error", label: "Ошибка", icon: XCircle, color: "text-red-500 bg-red-500/10" },
  {
    value: "announcement",
    label: "Объявление",
    icon: Megaphone,
    color: "text-purple-500 bg-purple-500/10",
  },
];

const TARGET_OPTIONS = [
  { value: "all", label: "Все пользователи" },
  { value: "active", label: "Активные (30 дней)" },
];

const emptyForm = {
  title: "",
  message: "",
  type: "info" as SystemNotificationType,
  targetUsers: "all" as "all" | "active",
  linkUrl: "",
  expiresAt: "",
};

const NOTIFICATION_TEMPLATES = [
  {
    name: "Обновление сайта",
    title: "Обновление сайта",
    message: "Мы выпустили новую версию сайта с улучшениями и исправлениями.",
    type: "info" as SystemNotificationType,
  },
  {
    name: "Технические работы",
    title: "Плановые работы",
    message:
      "Сегодня в 02:00 МСК будут проводиться технические работы. Возможны кратковременные перебои.",
    type: "warning" as SystemNotificationType,
  },
  {
    name: "Новый контент",
    title: "Новые главы!",
    message: "Добавлены новые главы популярных тайтлов. Приятного чтения!",
    type: "success" as SystemNotificationType,
  },
  {
    name: "Важное событие",
    title: "Важное объявление",
    message: "У нас важные новости для сообщества!",
    type: "announcement" as SystemNotificationType,
  },
];

export function NotificationsSection() {
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<SystemNotification | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useGetSystemNotificationsQuery({
    page: currentPage,
    limit: 20,
  });
  const { data: statsData } = useGetNotificationStatsQuery();
  const [sendNotification, { isLoading: isSending }] = useSendSystemNotificationMutation();
  const [deleteNotification] = useDeleteSystemNotificationMutation();

  const allNotifications = notificationsData?.data?.notifications || [];
  const pagination = notificationsData?.data?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  };
  const stats = statsData?.data;

  const notifications = useMemo(() => {
    let filtered = allNotifications;

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        n => n.title.toLowerCase().includes(search) || n.message.toLowerCase().includes(search),
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    return filtered;
  }, [allNotifications, searchTerm, typeFilter]);

  const handleResend = useCallback(
    (notification: SystemNotification) => {
      setForm({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        targetUsers: notification.targetUsers === "all" ? "all" : "active",
        linkUrl: notification.linkUrl || "",
        expiresAt: "",
      });
      setIsFormOpen(true);
      toast.info("Данные скопированы в форму");
    },
    [toast],
  );

  const handleUseTemplate = useCallback((template: (typeof NOTIFICATION_TEMPLATES)[0]) => {
    setForm({
      ...emptyForm,
      title: template.title,
      message: template.message,
      type: template.type,
    });
    setShowTemplates(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Заголовок и сообщение обязательны");
      return;
    }

    try {
      await sendNotification({
        title: form.title,
        message: form.message,
        type: form.type,
        targetUsers: form.targetUsers,
        linkUrl: form.linkUrl || undefined,
        expiresAt: form.expiresAt || undefined,
      }).unwrap();
      toast.success("Уведомление отправлено");
      setIsFormOpen(false);
      setForm(emptyForm);
      refetch();
    } catch (err) {
      toast.error("Ошибка при отправке уведомления");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteNotification(deleteTarget._id).unwrap();
      toast.success("Уведомление удалено");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error("Ошибка при удалении");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getTypeInfo = (type: SystemNotificationType) => {
    return NOTIFICATION_TYPES.find(t => t.value === type) || NOTIFICATION_TYPES[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU");
  };

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 min-[480px]:grid-cols-4 gap-2 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <p className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">Всего</p>
            <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
          </div>
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <p className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">Доставлено</p>
            <p className="text-xl sm:text-2xl font-bold text-green-500">{stats.sent}</p>
          </div>
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <p className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">Прочитано</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-500">{stats.read}</p>
          </div>
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <p className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">В ожидании</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-500">{stats.pending}</p>
          </div>
        </div>
      )}

      <AdminCard
        title="Системные уведомления"
        icon={<Bell className="w-4 h-4 sm:w-5 sm:h-5" />}
        action={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={`admin-btn-secondary flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ${
                showTemplates ? "bg-[var(--primary)]/10" : ""
              }`}
              title="Шаблоны"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="admin-btn-primary flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden min-[400px]:inline">Отправить</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск уведомлений..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="admin-input w-full pl-10 text-sm"
              />
            </div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="admin-input text-xs sm:text-sm px-2 sm:px-3"
            >
              <option value="">Все типы</option>
              {NOTIFICATION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Templates */}
          {showTemplates && (
            <div className="p-3 sm:p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
              <p className="text-xs sm:text-sm font-medium text-[var(--foreground)] mb-2">
                Быстрые шаблоны
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {NOTIFICATION_TEMPLATES.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleUseTemplate(template)}
                    className="p-2 sm:p-3 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]/50 text-left transition-colors"
                  >
                    <p className="text-xs sm:text-sm font-medium text-[var(--foreground)] truncate">
                      {template.name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                      {template.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted-foreground)]">
              Нет отправленных уведомлений
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {notifications.map(notification => {
                const typeInfo = getTypeInfo(notification.type);
                const TypeIcon = typeInfo.icon;
                return (
                  <div
                    key={notification._id}
                    className="p-3 sm:p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)]"
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`p-1.5 sm:p-2 rounded-lg ${typeInfo.color} flex-shrink-0`}>
                          <TypeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-medium text-[var(--foreground)] truncate">
                            {notification.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5 sm:mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-3 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              {notification.targetUsers === "all"
                                ? "Все"
                                : notification.targetUsers === "active"
                                  ? "Активные"
                                  : `${(notification.targetUsers as string[]).length}`}
                            </span>
                            <span className="hidden min-[400px]:inline">
                              Отпр: {notification.sentCount}
                            </span>
                            <span className="hidden min-[400px]:inline">
                              Прочит: {notification.readCount}
                            </span>
                            <span className="min-[400px]:hidden">
                              {notification.sentCount}/{notification.readCount}
                            </span>
                            <span className="hidden sm:inline">
                              {formatDate(notification.createdAt)}
                            </span>
                            {notification.linkUrl && (
                              <span className="flex items-center gap-1">
                                <LinkIcon className="w-3 h-3" />
                                <span className="hidden sm:inline">Ссылка</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleResend(notification)}
                        className="p-1.5 sm:p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] active:scale-95 transition-all flex-shrink-0"
                        title="Повторить"
                      >
                        <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(notification)}
                        className="p-1.5 sm:p-2 text-[var(--muted-foreground)] hover:text-red-500 active:scale-95 transition-all flex-shrink-0"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </AdminCard>

      <AdminModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Отправить уведомление"
      >
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Preview toggle */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                previewMode
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Превью
            </button>
          </div>

          {/* Preview */}
          {previewMode && form.title && (
            <div className="p-3 sm:p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
              <p className="text-xs text-[var(--muted-foreground)] mb-2">Как будет выглядеть:</p>
              <div className={`p-3 rounded-lg ${getTypeInfo(form.type).color}`}>
                <div className="flex items-start gap-2">
                  {(() => {
                    const TypeIcon = getTypeInfo(form.type).icon;
                    return <TypeIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />;
                  })()}
                  <div>
                    <p className="font-medium text-sm">{form.title || "Заголовок"}</p>
                    <p className="text-xs mt-1 opacity-90">{form.message || "Сообщение..."}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
              Заголовок *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Важное объявление"
              className="admin-input w-full text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
              Сообщение *
            </label>
            <textarea
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder="Текст уведомления..."
              className="admin-input w-full resize-none text-sm"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
                Тип
              </label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as SystemNotificationType })}
                className="admin-input w-full text-sm"
              >
                {NOTIFICATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
                Получатели
              </label>
              <select
                value={form.targetUsers}
                onChange={e =>
                  setForm({ ...form, targetUsers: e.target.value as "all" | "active" })
                }
                className="admin-input w-full text-sm"
              >
                {TARGET_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
              Ссылка
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
              <input
                type="url"
                value={form.linkUrl}
                onChange={e => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="https://..."
                className="admin-input w-full pl-10 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">
              Срок действия
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                className="admin-input w-full pl-10 text-sm"
              />
            </div>
            <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] mt-1">
              После этой даты уведомление скроется
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="admin-btn-secondary text-xs sm:text-sm px-3 py-2"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="admin-btn-primary flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 py-2"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isSending ? "..." : "Отправить"}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Удалить уведомление"
        message={deleteTarget ? `Удалить уведомление "${deleteTarget.title}"?` : ""}
        confirmText="Удалить"
        isLoading={deleteLoading}
        confirmVariant="danger"
      />
    </div>
  );
}
