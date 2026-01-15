"use client";
import { useState, useEffect } from "react";
import { Bell, CheckCheck, Filter } from "lucide-react";
import { Header, Footer } from "@/widgets";
import { pageTitle } from "@/lib/page-title";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import NotificationCard from "@/shared/notification-card/NotificationCard";
import { Button } from "@/shared/ui/button";
import { useGetNotificationsQuery, useMarkAllAsReadMutation } from "@/store/api/notificationsApi";
import { Notification } from "@/types/notifications";

type NotificationFilter = "all" | "updates" | "users" | "system";

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [showRead, setShowRead] = useState(false);

  const { isAuthenticated } = useAuth();
  const { data: notificationsResponse, isLoading } = useGetNotificationsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notifications = notificationsResponse?.data?.notifications || [];

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

  const filteredNotifications = notifications.filter((notification: Notification) => {
    // Фильтр по типу
    if (activeFilter !== "all" && notification.type !== activeFilter) {
      return false;
    }

    // Фильтр по прочитанным
    if (!showRead && notification.isRead) {
      return false;
    }

    return true;
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="flex flex-col items-center justify-center gap-6">
          <div className="w-full max-w-4xl mx-auto px-4 py-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/4"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded"></div>
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
        <main className="flex flex-col items-center justify-center gap-6 min-h-[50vh]">
          <div className="text-center">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Уведомления</h1>
            <p className="text-muted-foreground">Войдите в аккаунт, чтобы видеть уведомления</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center gap-6">
        <div className="w-full max-w-4xl mx-auto px-4 py-6">
          {/* Заголовок и кнопка "Прочитать все" */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6" />
              <h1 className="text-2xl font-bold">Уведомления</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Прочитать все
              </Button>
            )}
          </div>

          {/* Фильтры и переключатель */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-card rounded-lg border">
            {/* Фильтры */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1">
                {[
                  { key: "all" as const, label: "Все" },
                  { key: "updates" as const, label: "Обновления" },
                  { key: "users" as const, label: "Пользователи" },
                  { key: "system" as const, label: "Система" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      activeFilter === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Переключатель прочитанных */}
            <div className="flex items-center gap-2">
              <label htmlFor="show-read" className="text-sm text-muted-foreground">
                Показывать прочитанные
              </label>
              <input
                id="show-read"
                type="checkbox"
                checked={showRead}
                onChange={e => setShowRead(e.target.checked)}
                className="rounded"
              />
            </div>
          </div>

          {/* Список уведомлений */}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-2">
              {filteredNotifications.map((notification: Notification) => (
                <NotificationCard key={notification._id} notification={notification} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Нет уведомлений</h3>
              <p className="text-muted-foreground">
                {activeFilter === "all"
                  ? "У вас пока нет уведомлений"
                  : `Нет уведомлений типа "${activeFilter === "updates" ? "Обновления" : activeFilter === "users" ? "Пользователи" : "Система"}"`}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
