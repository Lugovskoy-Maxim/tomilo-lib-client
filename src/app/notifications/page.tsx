"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Inbox,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  BookOpen,
  RefreshCw,
  User,
  Settings,
  MessageSquareReply,
  MessageCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Header, Footer } from "@/widgets";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import NotificationCard from "@/shared/notification-card/NotificationCard";
import NotificationChapterGroupCard from "@/shared/notification-card/NotificationChapterGroupCard";
import { buildNewChapterGroupRows } from "@/lib/notification-navigation";
import { Button } from "@/shared/ui/button";
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from "@/store/api/notificationsApi";
import { Notification } from "@/types/notifications";
import LoginModal from "@/shared/modal/LoginModal";
import RegisterModal from "@/shared/modal/RegisterModal";

type NotificationFilter =
  | "all"
  | "new_chapter"
  | "update"
  | "user"
  | "system"
  | "report_response"
  | "comments";

const filterConfig = [
  { key: "all" as const, label: "Все", icon: Bell },
  { key: "new_chapter" as const, label: "Новые главы", icon: BookOpen },
  { key: "update" as const, label: "Обновления", icon: RefreshCw },
  { key: "user" as const, label: "Пользователи", icon: User },
  { key: "system" as const, label: "Система", icon: Settings },
  { key: "comments" as const, label: "Комментарии", icon: MessageCircle },
  { key: "report_response" as const, label: "Ответы на жалобы", icon: MessageSquareReply },
];

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [showRead, setShowRead] = useState(false);
  const [page, setPage] = useState(1);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const { isAuthenticated } = useAuth();
  const {
    data: notificationsResponse,
    isLoading,
    isFetching,
  } = useGetNotificationsQuery({ page, limit: 20 }, { skip: !isAuthenticated });
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notificationsData = useMemo(
    () => notificationsResponse?.data?.notifications || [],
    [notificationsResponse?.data?.notifications],
  );
  const pagination = notificationsResponse?.data?.pagination;

  // SEO для страницы уведомлений
  useSEO({
    title: "Уведомления - Tomilo-lib.ru",
    description: "Уведомления о новых главах, обновлениях и системных сообщениях.",
    keywords: "уведомления, новые главы, обновления, закладки",
    type: "website",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notificationsData.filter((notification: Notification) => {
      const isReportReplyType =
        notification.type === "report_response" ||
        notification.type === "complaint_response" ||
        notification.type === "report_resolved";

      const isCommentType =
        notification.type === "comment_reply" || notification.type === "comment_reactions";

      if (activeFilter !== "all") {
        if (activeFilter === "report_response" && !isReportReplyType) {
          return false;
        }
        if (activeFilter === "comments" && !isCommentType) {
          return false;
        }
        if (
          activeFilter !== "report_response" &&
          activeFilter !== "comments" &&
          notification.type !== activeFilter
        ) {
          return false;
        }
      }

      if (!showRead && notification.isRead) {
        return false;
      }
      return true;
    });
  }, [notificationsData, activeFilter, showRead]);

  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectGroup = useCallback((ids: string[], selected: boolean) => {
    setSelectedIds((prev: Set<string>) => {
      const newSet = new Set(prev);
      ids.forEach(id => {
        if (selected) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
      });
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const visibleIds = filteredNotifications.map(n => n._id);
    const allSelected = visibleIds.every(id => selectedIds.has(id));

    setSelectedIds((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (allSelected) {
        visibleIds.forEach(id => newSet.delete(id));
      } else {
        visibleIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }, [filteredNotifications, selectedIds]);

  const handleDeleteSelected = async () => {
    const idsToDelete = Array.from(selectedIds);
    try {
      await Promise.all(idsToDelete.map(id => deleteNotification(id).unwrap()));
      setSelectedIds(new Set());
      if (selectionMode && idsToDelete.length === filteredNotifications.length) {
        setSelectionMode(false);
      }
    } catch (error) {
      console.error("Error deleting notifications:", error);
    }
  };

  const handleAuthSuccess = () => {
    setLoginModalOpen(false);
    setRegisterModalOpen(false);
  };

  const unreadCount = useMemo(
    () => notificationsData.filter((n: Notification) => !n.isRead).length,
    [notificationsData],
  );

  const typeCounts = useMemo(() => {
    const counts = {
      all: notificationsData.length,
      new_chapter: 0,
      update: 0,
      user: 0,
      system: 0,
      comments: 0,
      report_response: 0,
    };
    notificationsData.forEach(n => {
      if (n.type === "complaint_response" || n.type === "report_resolved") {
        counts.report_response++;
        return;
      }
      if (n.type === "comment_reply" || n.type === "comment_reactions") {
        counts.comments++;
        return;
      }
      if (n.type in counts) {
        counts[n.type as keyof typeof counts]++;
      }
    });
    return counts;
  }, [notificationsData]);

  const groupByDate = (notifications: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (dateOnly.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (dateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else if (dateOnly.getTime() > weekAgo.getTime()) {
        groups.thisWeek.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });

    return groups;
  };

  const groupedNotifications = useMemo(
    () => groupByDate(filteredNotifications),
    [filteredNotifications],
  );

  const renderNotificationRows = (list: Notification[]) => {
    const rows = buildNewChapterGroupRows(list);
    return rows.map(row => {
      if (row.kind === "chapterGroup") {
        const key = [...row.notifications].map(n => n._id).sort().join("-");
        return (
          <NotificationChapterGroupCard
            key={key}
            notifications={row.notifications}
            selectedIds={selectedIds}
            onSelectGroup={handleSelectGroup}
            selectionMode={selectionMode}
          />
        );
      }
      return (
        <NotificationCard
          key={row.notification._id}
          notification={row.notification}
          isSelected={selectedIds.has(row.notification._id)}
          onSelect={handleSelect}
          selectionMode={selectionMode}
        />
      );
    });
  };

  const hasMorePages = pagination ? page < pagination.pages : false;

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <div className="w-full max-w-5xl mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-muted rounded-xl w-1/3"></div>
              <div className="h-16 bg-muted rounded-xl"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <div className="text-center px-4 max-w-md">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--primary)]/15 to-[var(--primary)]/5 border border-[var(--primary)]/20 flex items-center justify-center mx-auto mb-6">
              <Bell className="w-12 h-12 text-[var(--primary)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Уведомления</h1>
            <p className="text-[var(--muted-foreground)] mb-8 leading-relaxed">
              Войдите в аккаунт, чтобы видеть уведомления о новых главах, комментариях и ответах на
              жалобы
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => setLoginModalOpen(true)} className="rounded-xl cursor-pointer">
                Войти
              </Button>
              <Button
                variant="outline"
                onClick={() => setRegisterModalOpen(true)}
                className="rounded-xl cursor-pointer"
              >
                Регистрация
              </Button>
            </div>
          </div>
        </main>
        <Footer />

        {/* Modals */}
        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onSwitchToRegister={() => {
            setLoginModalOpen(false);
            setRegisterModalOpen(true);
          }}
          onAuthSuccess={handleAuthSuccess}
        />
        <RegisterModal
          isOpen={registerModalOpen}
          onClose={() => setRegisterModalOpen(false)}
          onSwitchToLogin={() => {
            setRegisterModalOpen(false);
            setLoginModalOpen(true);
          }}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--background)]">
        <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-10">
          {/* Заголовок */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight truncate">
                Уведомления
              </h1>
              {unreadCount > 0 && (
                <span
                  className="flex-shrink-0 min-w-[1.5rem] h-7 px-2 flex items-center justify-center text-xs font-bold rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] tabular-nums shadow-sm"
                  aria-label={`Непрочитанных: ${unreadCount}`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-xl h-9 px-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/80"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">Прочитать все</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  setSelectedIds(new Set());
                }}
                className={`h-9 rounded-xl px-3 text-sm font-medium ${selectionMode ? "bg-[var(--primary)]/12 text-[var(--primary)] ring-1 ring-[var(--primary)]/25" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/80"}`}
              >
                {selectionMode ? "Готово" : "Выбрать"}
              </Button>
            </div>
          </div>

          {/* Фильтры по типу */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory min-h-10 mb-5 -mx-1 px-1">
            {filterConfig.map(({ key, label, icon: Icon }) => {
              const count = typeCounts[key as keyof typeof typeCounts];
              const isActive = activeFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFilter(key)}
                  className={`
                    snap-start flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium
                    transition-all whitespace-nowrap shrink-0
                    ${
                      isActive
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md shadow-[var(--primary)]/20"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/90 hover:text-[var(--foreground)] border border-transparent hover:border-[var(--border)]"
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                  <span className="hidden min-[380px]:inline">{label}</span>
                  {count > 0 && (
                    <span
                      className={`text-xs ${isActive ? "opacity-90" : "text-[var(--muted-foreground)]"}`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Показ: все / только новые */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm font-medium text-[var(--muted-foreground)] shrink-0">
              Показывать
            </span>
            <div className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setShowRead(true)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${
                    showRead
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/70"
                  }
                `}
              >
                <Eye className="w-4 h-4 flex-shrink-0" />
                <span>Все</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRead(false)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${
                    !showRead
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/70"
                  }
                `}
              >
                <EyeOff className="w-4 h-4 flex-shrink-0" />
                <span>Только новые</span>
              </button>
            </div>
          </div>

          {/* Панель массовых действий */}
          {selectionMode && selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 py-3.5 px-4 mb-5 rounded-2xl bg-[var(--primary)]/[0.06] border border-[var(--primary)]/20 shadow-sm animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  {filteredNotifications.every(n => selectedIds.has(n._id)) ? (
                    <>
                      <Square className="w-4 h-4" /> Снять
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4" /> Всё
                    </>
                  )}
                </button>
                <span className="text-sm text-[var(--muted-foreground)]">{selectedIds.size}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  className="rounded-lg h-8"
                >
                  Отмена
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="gap-1.5 rounded-lg h-8"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить
                </Button>
              </div>
            </div>
          )}

          {/* Список уведомлений */}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 sm:h-24 rounded-xl bg-[var(--muted)]/50 animate-pulse"
                />
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-8">
              {groupedNotifications.today.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-3 px-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                      Сегодня
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-[var(--border)] to-transparent" />
                  </div>
                  <div className="space-y-3">
                    {renderNotificationRows(groupedNotifications.today)}
                  </div>
                </section>
              )}
              {groupedNotifications.yesterday.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-3 px-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                      Вчера
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-[var(--border)] to-transparent" />
                  </div>
                  <div className="space-y-3">
                    {renderNotificationRows(groupedNotifications.yesterday)}
                  </div>
                </section>
              )}
              {groupedNotifications.thisWeek.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-3 px-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                      На этой неделе
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-[var(--border)] to-transparent" />
                  </div>
                  <div className="space-y-3">
                    {renderNotificationRows(groupedNotifications.thisWeek)}
                  </div>
                </section>
              )}
              {groupedNotifications.earlier.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-3 px-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                      Ранее
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-[var(--border)] to-transparent" />
                  </div>
                  <div className="space-y-3">
                    {renderNotificationRows(groupedNotifications.earlier)}
                  </div>
                </section>
              )}

              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-1 pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isFetching}
                    className="h-10 w-10 p-0 rounded-xl border-[var(--border)]"
                    aria-label="Предыдущая страница"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="min-w-[5rem] text-center text-sm font-medium tabular-nums text-[var(--muted-foreground)] px-3">
                    {page} / {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasMorePages || isFetching}
                    className="h-10 w-10 p-0 rounded-xl border-[var(--border)]"
                    aria-label="Следующая страница"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 rounded-2xl bg-[var(--muted)]/60 flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-10 h-10 text-[var(--muted-foreground)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">
                {activeFilter === "all" ? "Пока пусто" : "Ничего не найдено"}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] max-w-xs mx-auto mb-6">
                {activeFilter === "all"
                  ? "Здесь будут уведомления о новых главах и ответах."
                  : `В категории «${filterConfig.find(f => f.key === activeFilter)?.label}» пока нет записей.`}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {!showRead && notificationsData.some(n => n.isRead) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRead(true)}
                    className="rounded-lg"
                  >
                    Показать прочитанные
                  </Button>
                )}
                {activeFilter !== "all" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveFilter("all")}
                    className="rounded-lg"
                  >
                    Все уведомления
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
