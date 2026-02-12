"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useGetUnreadCountQuery } from "@/store/api/notificationsApi";

export function NotificationButton() {
  const { data: unreadCountResponse } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 120000, // Обновлять каждые 2 минуты
  });

  const notificationCount = unreadCountResponse?.data?.count || 0;

  return (
    <Link href="/notifications" className="relative">
      <button
        type="button"
        className="flex items-center justify-center min-h-[40px] min-w-[40px] p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 cursor-pointer"
        aria-label={
          notificationCount > 0 ? `Уведомления (${notificationCount} новых)` : "Уведомления"
        }
      >
        <Bell className="w-4 h-4 xs:w-5 xs:h-5" />

        {/* Бейдж с анимацией появления */}
        <span
          className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full transition-all duration-300 ${
            notificationCount > 0 ? "px-1 opacity-100 scale-100" : "w-0 opacity-0 scale-50"
          }`}
        >
          {notificationCount > 99 ? "99+" : notificationCount}
        </span>
      </button>
    </Link>
  );
}

export default NotificationButton;
