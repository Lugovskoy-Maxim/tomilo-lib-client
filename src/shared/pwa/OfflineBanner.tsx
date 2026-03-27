"use client";

import { useEffect, useState } from "react";
import { useServiceWorkerRegistration } from "./ServiceWorkerRegistration";
import {
  getOfflineQueueSnapshot,
  subscribeOfflineQueue,
  type OfflineQueueSnapshot,
} from "@/lib/offlineMutationQueue";

export function OfflineBanner() {
  const { isOnline } = useServiceWorkerRegistration();
  const [snapshot, setSnapshot] = useState<OfflineQueueSnapshot>(() => getOfflineQueueSnapshot());

  useEffect(() => subscribeOfflineQueue(setSnapshot), []);

  if (isOnline && snapshot.pendingCount === 0 && !snapshot.isSyncing) return null;

  const statusText = !isOnline
    ? `Нет соединения. Действия сохраняются оффлайн${snapshot.pendingCount > 0 ? ` (${snapshot.pendingCount})` : ""}.`
    : snapshot.isSyncing
      ? "Синхронизация оффлайн-действий..."
      : snapshot.pendingCount > 0
        ? `Ожидает синхронизации: ${snapshot.pendingCount}.`
        : "Сеть восстановлена. Оффлайн-очередь синхронизирована.";

  const bannerColor = !isOnline
    ? "bg-amber-600"
    : snapshot.pendingCount > 0 || snapshot.isSyncing
      ? "bg-sky-600"
      : "bg-emerald-600";

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[var(--z-toast)] ${bannerColor} text-white text-center py-2 px-4 text-sm font-medium`}
      role="status"
      aria-live="polite"
    >
      {statusText}
    </div>
  );
}
