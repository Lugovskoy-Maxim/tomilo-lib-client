"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useGetUnreadCountQuery } from "@/store/api/notificationsApi";

export function NotificationButton() {
  const { data: unreadCountResponse } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 120000,
  });

  const notificationCount = unreadCountResponse?.data?.count || 0;

  return (
    <Link
      href="/notifications"
      className={`relative inline-flex header-icon-btn ${notificationCount > 0 ? "bg-[var(--primary)]/5 border-[var(--primary)]/30 text-[var(--foreground)]" : ""}`}
      aria-label={notificationCount > 0 ? `Уведомления (${notificationCount} новых)` : "Уведомления"}
    >
      <Bell className="w-5 h-5" />

      {notificationCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--destructive)] animate-ping opacity-75"
          aria-hidden
        />
      )}
      {notificationCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-5 px-1.5
            bg-[var(--destructive)] text-white text-xs font-medium rounded-full
            animate-in zoom-in-50 duration-300
            ring-2 ring-[var(--background)]"
        >
          {notificationCount > 99 ? "99+" : notificationCount}
        </span>
      )}
    </Link>
  );
}

export default NotificationButton;
