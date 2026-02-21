import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import type { BaseQueryApi } from "@reduxjs/toolkit/query/react";

const AUTH_TOKEN_KEY = "tomilo_lib_token";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/** Эндпоинт обновления токена на бэкенде (куки/refresh отправляются автоматически с credentials) */
const REFRESH_URL = `${API_BASE.replace(/\/$/, "")}/auth/refresh`;

let refreshPromise: Promise<unknown> | null = null;

/**
 * Базовый запрос с поддержкой:
 * - credentials: 'include' — отправка и сохранение cookies (access/refresh на сервере)
 * - Bearer из localStorage при наличии (для обратной совместимости и OAuth)
 * - при 401 — один раз вызывается refresh, затем повтор исходного запроса
 */
export const baseQueryWithReauth: BaseQueryFn = async (
  args,
  api: BaseQueryApi,
  extraOptions,
) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: API_BASE,
    credentials: "include",
    prepareHeaders(headers) {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  });

  let result = await baseQuery(args, api, extraOptions);

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
          const refreshResult = await fetch(REFRESH_URL, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          if (refreshResult.ok) {
            const data = await refreshResult.json().catch(() => ({}));
            const newToken = data?.data?.access_token ?? data?.access_token;
            if (newToken && typeof window !== "undefined") {
              localStorage.setItem(AUTH_TOKEN_KEY, newToken);
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

  return result;
};
