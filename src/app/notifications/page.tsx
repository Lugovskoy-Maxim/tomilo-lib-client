"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Bell, 
  CheckCheck, 
  Filter, 
  Trash2, 
  Loader2, 
  Inbox, 
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square
} from "lucide-react";
import { Header, Footer } from "@/widgets";
import { pageTitle } from "@/lib/page-title";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import NotificationCard from "@/shared/notification-card/NotificationCard";
import { Button } from "@/shared/ui/button";
import { useGetNotificationsQuery, useMarkAllAsReadMutation, useDeleteNotificationMutation } from "@/store/api/notificationsApi";
import { Notification } from "@/types/notifications";
import LoginModal from "@/shared/modal/LoginModal";
import RegisterModal from "@/shared/modal/RegisterModal";

type NotificationFilter = "all" | "new_chapter" | "update" | "user" | "system";

const filterConfig = [
  { key: "all" as const, label: "Все", color: "bg-gray-500" },
  { key: "new_chapter" as const, label: "Новые главы", color: "bg-blue-500" },
  { key: "update" as const, label: "Обновления", color: "bg-purple-500" },
  { key: "user" as const, label: "Пользователи", color: "bg-green-500" },
  { key: "system" as const, label: "Система", color: "bg-orange-500" },
];

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [showRead, setShowRead] = useState(true);
  const [page, setPage] = useState(1);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const { isAuthenticated, login } = useAuth();
  const { data: notificationsResponse, isLoading, isFetching } = useGetNotificationsQuery(
    { page, limit: 20 },
    { skip: !isAuthenticated }
  );
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = notificationsResponse?.data?.notifications || [];
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
    pageTitle.setTitlePage("Уведомления - Tomilo-lib.ru");
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification: Notification) => {
      if (activeFilter !== "all" && notification.type !== activeFilter) {
        return false;
      }
      if (!showRead && notification.isRead) {
        return false;
      }
      return true;
    });
  }, [notifications, activeFilter, showRead]);

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

  const unreadCount = useMemo(() => 
    notifications.filter((n: Notification) => !n.isRead).length,
    [notifications]
  );

  const typeCounts = useMemo(() => {
    const counts = {
      all: notifications.length,
      new_chapter: 0,
      update: 0,
      user: 0,
      system: 0,
    };
    notifications.forEach(n => {
      if (n.type in counts) {
        counts[n.type as keyof typeof counts]++;
      }
    });
    return counts;
  }, [notifications]);

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

  const groupedNotifications = useMemo(() => 
    groupByDate(filteredNotifications),
    [filteredNotifications]
  );

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
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3">Уведомления</h1>
            <p className="text-[var(--muted-foreground)] mb-6 max-w-sm">
              Войдите в аккаунт, чтобы видеть уведомления о новых главах и обновлениях
            </p>
            <div className="flex justify-center gap-3">
              <Button 
                onClick={() => setLoginModalOpen(true)}
                className="rounded-xl cursor-pointer text-[var(--chart-1)] border hover:border-[var(--chart-1)] hover:text-[var(--primary)] hover:bg-[var(--chart-1)] transition-all"
              >
                Войти
              </Button>
              <Button 
                variant="outline"
                onClick={() => setRegisterModalOpen(true)}
                className="rounded-xl cursor-pointer text-[var(--chart-1)] border hover:border-[var(--chart-1)] hover:text-[var(--primary)] hover:bg-[var(--chart-1)] transition-all"
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
      <main className="min-h-screen bg-background">
        <div className="w-full max-w-5xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--foreground)]">Уведомления</h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {unreadCount > 0 ? (
                    <span className="text-primary font-medium">{unreadCount} непрочитанных</span>
                  ) : (
                    "Все уведомления прочитаны"
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl"
                >
                  <CheckCheck className="w-4 h-4" />
                  Прочитать все
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  setSelectedIds(new Set());
                }}
                className={`rounded-xl ${selectionMode ? "bg-primary/10 text-primary" : ""}`}
              >
                {selectionMode ? "Готово" : "Выбрать"}
              </Button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-card rounded-2xl border shadow-sm p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                {filterConfig.map(({ key, label, color }) => {
                  const count = typeCounts[key as keyof typeof typeCounts];
                  const isActive = activeFilter === key;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveFilter(key)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                        transition-all duration-200 whitespace-nowrap
                        ${isActive 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "bg-muted/50 text-[var(--muted-foreground)] hover:bg-muted hover:text-[var(--foreground)]"
                        }
                      `}
                    >
                      <span className={`w-2 h-2 rounded-full ${color}`} />
                      {label}
                      {count > 0 && (
                        <span className={`
                          ml-1 px-1.5 py-0.5 text-xs rounded-full
                          ${isActive ? "bg-primary-foreground/20" : "bg-background"}
                        `}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Toggle Show Read */}
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 rounded-xl">
                <label 
                  htmlFor="show-read" 
                  className="text-sm text-[var(--muted-foreground)] cursor-pointer select-none"
                >
                  Показывать прочитанные
                </label>
                <div className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-input">
                  <input
                    id="show-read"
                    type="checkbox"
                    checked={showRead}
                    onChange={e => setShowRead(e.target.checked)}
                    className="sr-only"
                  />
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${showRead ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectionMode && selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-4 mb-6 bg-primary/5 border border-primary/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  {filteredNotifications.every(n => selectedIds.has(n._id)) ? (
                    <><Square className="w-4 h-4" /> Снять выделение</>
                  ) : (
                    <><CheckSquare className="w-4 h-4" /> Выбрать все</>
                  )}
                </button>
                <span className="text-sm text-[var(--muted-foreground)]">
                  Выбрано: <span className="font-medium text-[var(--foreground)]">{selectedIds.size}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="rounded-xl"
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                className="gap-2 rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </Button>

              </div>
            </div>
          )}

          {/* Notifications List */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-8">
              {/* Today */}
              {groupedNotifications.today.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Сегодня
                    <span className="text-xs font-normal text-[var(--muted-foreground)]/60">
                      {groupedNotifications.today.length}
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {groupedNotifications.today.map((notification: Notification) => (
                      <NotificationCard 
                        key={notification._id} 
                        notification={notification}
                        isSelected={selectedIds.has(notification._id)}
                        onSelect={handleSelect}
                        selectionMode={selectionMode}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Yesterday */}
              {groupedNotifications.yesterday.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                    Вчера
                    <span className="text-xs font-normal text-[var(--muted-foreground)]/60">
                      {groupedNotifications.yesterday.length}
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {groupedNotifications.yesterday.map((notification: Notification) => (
                      <NotificationCard 
                        key={notification._id} 
                        notification={notification}
                        isSelected={selectedIds.has(notification._id)}
                        onSelect={handleSelect}
                        selectionMode={selectionMode}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* This Week */}
              {groupedNotifications.thisWeek.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                    На этой неделе
                    <span className="text-xs font-normal text-[var(--muted-foreground)]/60">
                      {groupedNotifications.thisWeek.length}
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {groupedNotifications.thisWeek.map((notification: Notification) => (
                      <NotificationCard 
                        key={notification._id} 
                        notification={notification}
                        isSelected={selectedIds.has(notification._id)}
                        onSelect={handleSelect}
                        selectionMode={selectionMode}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Earlier */}
              {groupedNotifications.earlier.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    Ранее
                    <span className="text-xs font-normal text-[var(--muted-foreground)]/60">
                      {groupedNotifications.earlier.length}
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {groupedNotifications.earlier.map((notification: Notification) => (
                      <NotificationCard 
                        key={notification._id} 
                        notification={notification}
                        isSelected={selectedIds.has(notification._id)}
                        onSelect={handleSelect}
                        selectionMode={selectionMode}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isFetching}
                    className="gap-2 rounded-xl"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Назад
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === page;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`
                            w-9 h-9 rounded-lg text-sm font-medium transition-all
                            ${isActive 
                              ? "bg-primary text-primary-foreground" 
                              : "hover:bg-muted text-[var(--muted-foreground)]"
                            }
                          `}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {pagination.pages > 5 && (
                      <span className="px-2 text-[var(--muted-foreground)]">...</span>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasMorePages || isFetching}
                    className="gap-2 rounded-xl"
                  >
                    Вперед
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 animate-in fade-in">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Inbox className="w-12 h-12 text-[var(--muted-foreground)]/50" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                {activeFilter === "all" ? "Нет уведомлений" : "Ничего не найдено"}
              </h3>
              <p className="text-[var(--muted-foreground)] max-w-sm mx-auto mb-6">
                {activeFilter === "all"
                  ? "У вас пока нет уведомлений. Они появятся, когда выйдут новые главы или произойдут другие события."
                  : `Нет уведомлений типа "${filterConfig.find(f => f.key === activeFilter)?.label}". Попробуйте выбрать другой фильтр.`}
              </p>
              {!showRead && notifications.some(n => n.isRead) && (
                <Button
                  variant="outline"
                  onClick={() => setShowRead(true)}
                  className="rounded-xl"
                >
                  Показать прочитанные
                </Button>
              )}
              {activeFilter !== "all" && (
                <Button
                  variant="outline"
                  onClick={() => setActiveFilter("all")}
                  className="ml-2 rounded-xl"
                >
                  Показать все
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
