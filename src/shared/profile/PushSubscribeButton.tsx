"use client";

import { useState, useCallback, useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const VAPID_PUBLIC_KEY = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY : undefined;

export function PushSubscribeButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleSubscribe = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      toast.error("Push-уведомления не поддерживаются в этом браузере");
      return;
    }
    setIsLoading(true);
    try {
      const current = Notification.permission;
      if (current === "granted") {
        setPermission("granted");
        if (!VAPID_PUBLIC_KEY) {
          toast.success("Уведомления разрешены. Push будет доступен после настройки сервера.");
          setIsLoading(false);
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          toast.success("Подписка уже активна");
          setIsLoading(false);
          return;
        }
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY,
        });
        const res = await fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
        if (!res.ok) throw new Error("Subscribe failed");
        toast.success("Push-уведомления включены");
        setPermission("granted");
      } else if (current === "denied") {
        toast.error("Уведомления запрещены. Разрешите их в настройках браузера.");
        setPermission("denied");
      } else {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === "granted") {
          if (!VAPID_PUBLIC_KEY) {
            toast.success("Уведомления разрешены. Push будет доступен после настройки сервера.");
            setIsLoading(false);
            return;
          }
          const reg = await navigator.serviceWorker.ready;
          const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: VAPID_PUBLIC_KEY,
          });
          const res = await fetch("/api/push-subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription.toJSON()),
          });
          if (!res.ok) throw new Error("Subscribe failed");
          toast.success("Push-уведомления включены");
        } else if (result === "denied") {
          toast.error("Уведомления запрещены");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Не удалось включить push. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const isGranted = permission === "granted";
  const isDenied = permission === "denied";

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
      <div className="flex items-center gap-3 min-w-0">
        <Bell className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
        <div>
          <span className="text-sm font-semibold text-[var(--foreground)] block">
            Push в браузере
          </span>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {isGranted
              ? "Уведомления о новых главах даже при закрытой вкладке"
              : isDenied
                ? "Разрешите уведомления в настройках сайта в браузере"
                : "Уведомления о новых главах на этом устройстве"}
          </p>
        </div>
      </div>
      {!isDenied && (
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={isLoading || isGranted}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 min-w-[4.5rem] justify-center"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isGranted ? "Включено" : "Включить"}
        </button>
      )}
    </div>
  );
}
