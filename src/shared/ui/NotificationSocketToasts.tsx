"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useToast } from "@/hooks/useToast";
import { subscribeNotification } from "@/lib/notificationsSocket";
import { getHrefForCommentNotificationFromSocket } from "@/lib/notification-navigation";
import { notificationsApi } from "@/store/api/notificationsApi";
import type { AppDispatch } from "@/store";

/**
 * Подписка на новые уведомления по WebSocket (новая глава, ответ на комментарий и т.д.) и показ тоста.
 * Инвалидирует кеш уведомлений, чтобы список на /notifications обновлялся без перезагрузки.
 * Для ответов на комментарии и реакций — кнопка «Перейти» к тайтлу/главе с якорем комментария.
 * Рендерить внутри ToastProvider.
 */
export default function NotificationSocketToasts() {
  const toast = useToast();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const unsubscribe = subscribeNotification(payload => {
      const title = payload?.title ?? "Уведомление";
      const message = payload?.message ?? "";
      const text = message ? `${title}: ${message}` : title;

      const href = getHrefForCommentNotificationFromSocket(payload);

      toast.info(text, href ? 8000 : 6000, href ? { actionLabel: "Перейти", onAction: () => router.push(href) } : undefined);
      dispatch(
        notificationsApi.util.invalidateTags(["Notifications", "UnreadCount"]),
      );
    });
    return unsubscribe;
  }, [toast, dispatch, router]);

  return null;
}
