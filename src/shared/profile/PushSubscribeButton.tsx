"use client";

import { useState, useCallback, useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { AUTH_TOKEN_KEY } from "@/store/api/baseQueryWithReauth";

const VAPID_PUBLIC_KEY =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY : undefined;
const API_BASE =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
    : "";

interface PushSubscribeButtonProps {
  /** Встроенный вид: без своей карточки, для единого списка в настройках */
  embedded?: boolean;
}

export function PushSubscribeButton({ embedded }: PushSubscribeButtonProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleSubscribe = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    ) {
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
        const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
        const res = await fetch(`${API_BASE.replace(/\/$/, "")}/users/profile/push-subscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify(subscription.toJSON()),
        });
        if (res.status === 401) {
          toast.error("Войдите в аккаунт, чтобы включить push-уведомления");
          setIsLoading(false);
          return;
        }
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
          const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
          const res = await fetch(`${API_BASE.replace(/\/$/, "")}/users/profile/push-subscribe`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
            body: JSON.stringify(subscription.toJSON()),
          });
          if (res.status === 401) {
            toast.error("Войдите в аккаунт, чтобы включить push-уведомления");
            setIsLoading(false);
            return;
          }
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

  const content = (
    <>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {!embedded && <Bell className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />}
        <div className="min-w-0">
          <span className="text-sm font-semibold text-[var(--foreground)] block">
            Push в браузере
          </span>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {isGranted
              ? "Новые главы и новости даже при закрытой вкладке"
              : isDenied
                ? "Разрешите уведомления в настройках сайта в браузере"
                : "Новые главы и новости на этом устройстве"}
          </p>
        </div>
      </div>
      {!isDenied && (
        <div className="shrink-0" style={{ minWidth: 44 }}>
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={isLoading || isGranted}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 min-w-[4.5rem] justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isGranted ? (
              "Включено"
            ) : (
              "Включить"
            )}
          </button>
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div className="flex items-center justify-between gap-4 w-full min-w-0">{content}</div>;
  }

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
      {content}
    </div>
  );
}
