"use client";

import { useServiceWorkerRegistration } from "./ServiceWorkerRegistration";

export function OfflineBanner() {
  const { isOnline } = useServiceWorkerRegistration();

  if (isOnline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[var(--z-toast)] bg-amber-600 text-white text-center py-2 px-4 text-sm font-medium"
      role="status"
      aria-live="polite"
    >
      Нет соединения. Часть контента может быть недоступна.
    </div>
  );
}
