// src/shared/notification-button/notification-button.tsx
"use client";

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

export function NotificationButton() {
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    // Логика загрузки уведомлений
    const loadNotifications = async () => {
      try {
        const mockCount = 1;
        setNotificationCount(mockCount);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
  }, []);

  return (
    <button
      type="button"
      className="relative flex items-center justify-center p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg transition-colors"
      aria-label={notificationCount > 0 ? `Уведомления (${notificationCount} новых)` : 'Уведомления'}
    >
      <Bell className="w-5 h-5" />
      
      {/* Бейдж с анимацией появления */}
      <span 
        className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full transition-all duration-300 ${
          notificationCount > 0 
            ? 'px-1 opacity-100 scale-100' 
            : 'w-0 opacity-0 scale-50'
        }`}
      >
        {notificationCount > 99 ? '99+' : notificationCount}
      </span>
    </button>
  );
}

export default NotificationButton;