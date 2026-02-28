"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useGetUnreadCountQuery } from "@/store/api/notificationsApi";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 минут — не спамить сервер

export function NotificationButton() {
  const [isTabVisible, setIsTabVisible] = useState(
    () => (typeof document !== "undefined" ? document.visibilityState === "visible" : true)
  );

  useEffect(() => {
    const handler = () => setIsTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const { data: unreadCountResponse } = useGetUnreadCountQuery(undefined, {
    pollingInterval: isTabVisible ? POLL_INTERVAL_MS : 0,
    refetchOnMountOrArgChange: 90,
  });

  const notificationCount = unreadCountResponse?.data?.count || 0;

  return (
    <Link
      href="/notifications"
      className={`relative inline-flex header-icon-btn !overflow-visible ${notificationCount > 0 ? "bg-[var(--primary)]/5 border-[var(--primary)]/30 text-[var(--foreground)]" : ""}`}
      aria-label={notificationCount > 0 ? `Уведомления (${notificationCount} новых)` : "Уведомления"}
    >
      <Bell className="w-5 h-5" />

      {notificationCount > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 min-w-5 rounded-full bg-[var(--destructive)] animate-ping opacity-75 z-10"
          aria-hidden
        />
      )}
      {notificationCount > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-5 h-5 px-1.5
            bg-[var(--destructive)] text-white text-xs font-bold rounded-full
            animate-in zoom-in-50 duration-300
            ring-2 ring-[var(--background)] z-10"
        >
          {notificationCount > 99 ? "99+" : notificationCount}
        </span>
      )}
    </Link>
  );
}

export default NotificationButton;
