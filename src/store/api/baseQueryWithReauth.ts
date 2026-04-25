import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import type { BaseQueryApi } from "@reduxjs/toolkit/query/react";
import { OFFLINE_FEATURES_ENABLED } from "@/config/offlineFeatures";
import { reconnectNotificationsSocket } from "@/lib/notificationsSocket";
import { canQueueBody, enqueueOfflineMutation } from "@/lib/offlineMutationQueue";

export const AUTH_TOKEN_KEY = "tomilo_lib_token";
export const REFRESH_TOKEN_KEY = "tomilo_lib_refresh_token";
const TOKEN_SET_AT_KEY = "tomilo_lib_token_set_at";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const OFFLINE_READ_QUERY_PARAM = "offlineRead";

/** Эндпоинт обновления токена на бэкенде (куки/refresh отправляются автоматически с credentials) */
const REFRESH_URL = `${API_BASE.replace(/\/$/, "")}/auth/refresh`;

let refreshPromise: Promise<unknown> | null = null;

// Кэш для GET-запросов (key: url, value: { data, timestamp, ttl })
const GET_CACHE = new Map<
  string,
  { data: unknown; timestamp: number; ttl: number }
>();

// Эндпоинты, которые не нужно кэшировать
const NO_CACHE_ENDPOINTS = new Set([
  "getUser",
  "getNotifications",
  "getMessages",
  "getCharacter",
  "getInventory",
  "getEquippedItems",
]);

// TTL для кэширования (в миллисекундах)
const DEFAULT_TTL = 5 * 60 * 1000; // 5 минут

/**
 * Очищает кэш для всех GET-запросов
 */
export const clearGetCache = () => {
  GET_CACHE.clear();
};

/**
 * Очищает кэш для определенных URL
 */
export const clearCacheForUrls = (urls: string[]) => {
  urls.forEach(url => GET_CACHE.delete(url));
};

/**
 * Базовый запрос с поддержкой:
 * - credentials: 'include' — отправка и сохранение cookies (access/refresh на сервере)
 * - Bearer из localStorage при наличии (для обратной совместимости и OAuth)
 * - при 401 — один раз вызывается refresh, затем повтор исходного запроса
 * - retry с exponential backoff для временных сетевых ошибок
 */
export const baseQueryWithReauth: BaseQueryFn = async (args, api: BaseQueryApi, extraOptions) => {
  // Some endpoints are intentionally public. If backend rejects invalid Bearer tokens even for public routes,
  // sending Authorization may turn a public 200 into a 401. Keep these requests token-free.
  const PUBLIC_ENDPOINTS = new Set(["getDecorations", "getDecorationsByType"]);

  // Получаем endpoint из контекста
  const endpoint = (api as { endpoint?: string } | undefined)?.endpoint;
  const isNoCacheEndpoint = endpoint ? NO_CACHE_ENDPOINTS.has(endpoint) : false;

  // Проверяем, является ли запрос GET-запросом и можно ли его кэшировать
  const getCacheKey = (): string | null => {
    if (typeof args === "string") {
      return !isNoCacheEndpoint ? args : null;
    }
    const req = args as { url: string; method?: string };
    const method = (req.method || "GET").toUpperCase();
    return method === "GET" && !isNoCacheEndpoint ? req.url : null;
  };

  // Проверяем кэш для GET-запросов
  const cacheKey = getCacheKey();
  if (cacheKey && typeof window !== "undefined") {
    const cached = GET_CACHE.get(cacheKey);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < cached.ttl) {
        // Возвращаем закэшированные данные
        return { data: cached.data };
      }
      // Удаляем устаревший кэш
      GET_CACHE.delete(cacheKey);
    }
  }

  const baseQuery = fetchBaseQuery({
    baseUrl: API_BASE,
    credentials: "include",
    timeout: 30000, // 30 seconds timeout
    prepareHeaders(headers, ctx) {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const ctxEndpoint = (ctx as { endpoint?: string } | undefined)?.endpoint;
        const shouldAttachToken = Boolean(token) && (!ctxEndpoint || !PUBLIC_ENDPOINTS.has(ctxEndpoint));
        if (shouldAttachToken && token) {
          headers.set("authorization", `Bearer ${token}`);
        }

        if (OFFLINE_FEATURES_ENABLED) {
          const isOfflineReadMode = new URLSearchParams(window.location.search).get(
            OFFLINE_READ_QUERY_PARAM,
          );
          if (isOfflineReadMode === "1") {
            headers.set("x-offline-read", "1");
          }
        }
      }
      return headers;
    },
  });

  const getRequestMeta = (): { url: string; method: string; body?: unknown } => {
    if (typeof args === "string") return { url: args, method: "GET" };
    const req = args as { url: string; method?: string; body?: unknown };
    return { url: req.url, method: (req.method || "GET").toUpperCase(), body: req.body };
  };

  const requestMeta = getRequestMeta();
  const isMutationMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(requestMeta.method);
  const isAuthEndpoint = /\/auth\//.test(requestMeta.url);

  // Retry logic с exponential backoff для временных ошибок
  const MAX_RETRIES = 3;
  let retries = 0;
  let result = await baseQuery(args, api, extraOptions);

  while (
    retries < MAX_RETRIES &&
    result.error?.status === "FETCH_ERROR" &&
    typeof result.error?.error === "string" &&
    /failed to fetch|networkerror|network request failed|load failed/i.test(result.error.error)
  ) {
    // В offline режиме для мутаций — ставим в очередь и выходим
    if (
      OFFLINE_FEATURES_ENABLED &&
      isMutationMethod &&
      !isAuthEndpoint &&
      canQueueBody(requestMeta.body)
    ) {
      enqueueOfflineMutation({
        url: requestMeta.url,
        method: requestMeta.method as "POST" | "PUT" | "PATCH" | "DELETE",
        body: requestMeta.body,
      });
      return {
        data: {
          success: true,
          queuedOffline: true,
          message: "Действие сохранено и будет отправлено при восстановлении сети.",
        },
      };
    }

    retries++;
    const delayMs = Math.min(1000 * Math.pow(2, retries - 1), 10000); // exponential backoff: 1s, 2s, 4s
    await new Promise(resolve => setTimeout(resolve, delayMs));
    result = await baseQuery(args, api, extraOptions);
  }

  // При 429 (Too Many Requests) — одна повторная попытка с задержкой (защита от DDoS)
  if (result.error?.status === 429) {
    const retryAfter =
      typeof result.meta?.response?.headers?.get === "function"
        ? result.meta.response.headers.get("Retry-After")
        : null;
    const delayMs = retryAfter ? Math.min(Number(retryAfter) * 1000, 30_000) : 2000;
    await new Promise(resolve => setTimeout(resolve, delayMs));
    result = await baseQuery(args, api, extraOptions);
  }

  if (result.error?.status === 401) {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const storedRefresh =
            typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
          const refreshResult = await fetch(REFRESH_URL, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: storedRefresh ? JSON.stringify({ refresh_token: storedRefresh }) : undefined,
          });
          if (refreshResult.ok) {
            const data = await refreshResult.json().catch(() => ({}));
            const payload = data?.data ?? data;
            const newAccess = payload?.access_token;
            const newRefresh = payload?.refresh_token;
            if (typeof window !== "undefined") {
              if (newAccess) {
                localStorage.setItem(AUTH_TOKEN_KEY, newAccess);
                localStorage.setItem(TOKEN_SET_AT_KEY, String(Date.now()));
                reconnectNotificationsSocket();
              }
              if (newRefresh) localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
            }
            return;
          }
        } finally {
          refreshPromise = null;
        }
      })();
    }
    await refreshPromise;
    result = await baseQuery(args, api, extraOptions);
  }

  // Сохраняем успешные GET-запросы в кэш
  if (result.data && cacheKey && typeof window !== "undefined") {
    GET_CACHE.set(cacheKey, {
      data: result.data,
      timestamp: Date.now(),
      ttl: DEFAULT_TTL,
    });
  }

  // Очищаем кэш при успешных мутациях (POST, PUT, PATCH, DELETE)
  if (
    isMutationMethod &&
    result.data &&
    !result.error &&
    typeof window !== "undefined"
  ) {
    // Очищаем весь кэш при мутациях, чтобы избежать устаревших данных
    GET_CACHE.clear();
  }

  return result;
};