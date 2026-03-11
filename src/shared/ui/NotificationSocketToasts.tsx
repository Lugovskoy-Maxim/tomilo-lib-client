"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useToast } from "@/hooks/useToast";
import { subscribeNotification } from "@/lib/notificationsSocket";
import { notificationsApi } from "@/store/api/notificationsApi";
import type { AppDispatch } from "@/store";

/**
 * Подписка на новые уведомления по WebSocket (новая глава, ответ на комментарий и т.д.) и показ тоста.
 * Инвалидирует кеш уведомлений, чтобы список на /notifications обновлялся без перезагрузки.
 * Рендерить внутри ToastProvider.
 */
export default function NotificationSocketToasts() {
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const unsubscribe = subscribeNotification(payload => {
      const title = payload?.title ?? "Уведомление";
      const message = payload?.message ?? "";
      const text = message ? `${title}: ${message}` : title;
      toast.info(text, 6000);
      dispatch(
        notificationsApi.util.invalidateTags(["Notifications", "UnreadCount"]),
      );
    });
    return unsubscribe;
  }, [toast, dispatch]);

  return null;
}
