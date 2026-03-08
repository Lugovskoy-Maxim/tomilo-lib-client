"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { subscribeNotification } from "@/lib/notificationsSocket";

/**
 * Подписка на новые уведомления по WebSocket (новая глава, ответ на комментарий и т.д.) и показ тоста.
 * Рендерить внутри ToastProvider.
 */
export default function NotificationSocketToasts() {
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = subscribeNotification(payload => {
      const title = payload?.title ?? "Уведомление";
      const message = payload?.message ?? "";
      const text = message ? `${title}: ${message}` : title;
      toast.info(text, 6000);
    });
    return unsubscribe;
  }, [toast]);

  return null;
}
