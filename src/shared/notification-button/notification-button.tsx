"use client";
import { Bell } from "lucide-react";
import { useState } from "react";

// Компонент для отображения количества уведомлений
const NotificationBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-[var(--destructive)] text-white text-xs rounded-full h-4 min-w-4 w-max p-1 flex items-center justify-center font-medium">
      {count > 99 ? "99+" : count}
    </span>
  );
};

interface NotificationButtonProps {
  initialCount?: number;
  onNotificationsClick?: (count: number) => void;
}

export default function NotificationButton({
  initialCount = 1,
  onNotificationsClick,
}: NotificationButtonProps) {
  const [notificationCount, setNotificationCount] = useState(initialCount);

  // Функция для обработки клика по уведомлениям
  const handleClick = () => {
    if (onNotificationsClick) {
      onNotificationsClick(notificationCount);
    }
    // Сброс счетчика при клике
    setNotificationCount(0);
  };

  // // Функция для добавления уведомлений (можно вызывать извне)
  // const addNotification = (count: number = 1) => {
  //   setNotificationCount(prev => prev + count);
  // };

  // // Функция для сброса уведомлений
  // const resetNotifications = () => {
  //   setNotificationCount(0);
  // };

  return (
    <div className="relative items-end">
      <button
        type="button"
        className={`relative p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1`}
        onClick={handleClick}
        aria-label={`Уведомления (${notificationCount} новых)`}
      >
        <Bell
          className="w-5 h-5"
        />
        <NotificationBadge count={notificationCount} />
      </button>
    </div>
  );
}
