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
    <Link href="/notifications" className="relative inline-flex" aria-label={notificationCount > 0 ? `Уведомления (${notificationCount} новых)` : "Уведомления"}>
      <span
        className={`
          flex items-center justify-center min-h-[40px] min-w-[40px] p-2 rounded-xl
          border border-[var(--border)] text-[var(--muted-foreground)]
          hover:bg-[var(--accent)] hover:text-[var(--foreground)] hover:border-[var(--border)]
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2
          active:scale-95 cursor-pointer
          ${notificationCount > 0 ? "bg-[var(--primary)]/5 border-[var(--primary)]/30" : "bg-[var(--card)]"}
        `}
      >
        <Bell className="w-4 h-4 xs:w-5 xs:h-5" />

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
      </span>
      {notificationCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--destructive)] animate-ping opacity-75"
          aria-hidden
        />
      )}
    </Link>
  );
}

export default NotificationButton;
