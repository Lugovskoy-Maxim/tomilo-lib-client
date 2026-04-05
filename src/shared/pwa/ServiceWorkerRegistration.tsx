"use client";

import { useEffect, useState } from "react";
import { OFFLINE_FEATURES_ENABLED } from "@/config/offlineFeatures";

export function useServiceWorkerRegistration() {
  const [isRegistered, setIsRegistered] = useState(false);
  // Always start as true so SSR and first client paint match (avoids hydration mismatch).
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    if (!OFFLINE_FEATURES_ENABLED) {
      navigator.serviceWorker
        .getRegistrations()
        .then(regs => {
          void Promise.all(regs.map(r => r.unregister()));
        })
        .catch(() => {});
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(reg => {
        setIsRegistered(true);
        reg.update().catch(() => {});
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return { isRegistered, isOnline };
}

export default function ServiceWorkerRegistration() {
  useServiceWorkerRegistration();
  return null;
}
