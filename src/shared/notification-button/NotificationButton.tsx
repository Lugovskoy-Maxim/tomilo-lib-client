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
      className={`group relative inline-flex items-center justify-center min-w-11 min-h-11 p-2 rounded-xl !overflow-visible bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] transition-all duration-250 hover:border-[var(--primary)] hover:text-[var(--foreground)] hover:shadow-[0_0_20px_-5px_var(--primary)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] max-[480px]:min-w-[34px] max-[480px]:min-h-[34px] max-[480px]:p-1 max-[480px]:rounded-lg [&_svg]:max-[480px]:w-4 [&_svg]:max-[480px]:h-4 ${notificationCount > 0 ? "bg-[var(--primary)]/5 border-[var(--primary)]/30 text-[var(--foreground)]" : ""}`}
      aria-label={notificationCount > 0 ? `Уведомления (${notificationCount} новых)` : "Уведомления"}
    >
      <span className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)] opacity-0 transition-opacity duration-250 group-hover:opacity-[0.12] -z-0 rounded-xl" aria-hidden />
      <Bell className="w-5 h-5 relative z-[1] group-hover:scale-110 group-hover:-rotate-5 group-hover:text-[var(--primary)] transition-transform duration-300" />

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
