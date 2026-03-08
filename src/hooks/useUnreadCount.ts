"use client";

import { useEffect, useState } from "react";
import type { AnyAction } from "redux";
import {
  useGetUnreadCountQuery,
  notificationsApi,
} from "@/store/api/notificationsApi";
import { useAppDispatch } from "@/store";
import {
  subscribeNotifications,
  isNotificationsSocketConnected,
} from "@/lib/notificationsSocket";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 минут, когда WebSocket недоступен

/**
 * Единый хук для счётчика непрочитанных уведомлений:
 * - при наличии подписчиков открывает WebSocket уведомлений (одно соединение на приложение);
 * - при событии unread_count обновляет кэш RTK Query;
 * - при отсутствии WS использует polling REST getUnreadCount.
 * Использовать в NotificationButton и Footer вместо прямого useGetUnreadCountQuery.
 */
export function useUnreadCount(options?: { tabVisible?: boolean; skip?: boolean }) {
  const tabVisible = options?.tabVisible ?? true;
  const skip = options?.skip ?? false;
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const dispatch = useAppDispatch();

  const { data: unreadCountResponse } = useGetUnreadCountQuery(undefined, {
    skip,
    pollingInterval:
      !skip && tabVisible && !isSocketConnected ? POLL_INTERVAL_MS : 0,
    refetchOnMountOrArgChange: 90,
  });

  const count = unreadCountResponse?.data?.count ?? 0;

  useEffect(() => {
    if (skip) return;

    const listener = (event: { count?: number; connected?: boolean }) => {
      if (typeof event.connected === "boolean") {
        setIsSocketConnected(event.connected);
      }
      const newCount = event.count;
      if (typeof newCount === "number") {
        dispatch(
          notificationsApi.util.updateQueryData(
            "getUnreadCount",
            undefined,
            draft => {
              if (draft?.data) draft.data.count = newCount;
            },
          ) as unknown as AnyAction,
        );
      }
    };

    const unsubscribe = subscribeNotifications(listener);
    setIsSocketConnected(isNotificationsSocketConnected());

    return unsubscribe;
  }, [dispatch, skip]);

  return { count, isSocketConnected };
}
