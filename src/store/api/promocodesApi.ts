import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import type {
  PromoCode,
  PromoCodeUsage,
  CreatePromoCodeDto,
  UpdatePromoCodeDto,
  RedeemPromoCodeResult,
} from "@/types/promocode";

const PROMO_TAG = "PromoCodes" as const;

interface PromoCodesListResponse {
  data: PromoCode[];
  total: number;
  page: number;
  limit: number;
}

interface PromoCodeUsageResponse {
  data: PromoCodeUsage[];
  total: number;
  page: number;
  limit: number;
}

function normalizePromoCode(item: Record<string, unknown>): PromoCode {
  const id = (item.id ?? item._id) as string;
  return {
    id,
    code: (item.code as string) ?? "",
    description: item.description as string | undefined,
    rewards: (item.rewards as PromoCode["rewards"]) ?? [],
    maxUses: item.maxUses as number | null,
    usedCount: (item.usedCount as number) ?? 0,
    maxUsesPerUser: (item.maxUsesPerUser as number) ?? 1,
    startsAt: item.startsAt as string | undefined,
    expiresAt: item.expiresAt as string | undefined,
    status: (item.status as PromoCode["status"]) ?? "active",
    newUsersOnly: item.newUsersOnly as boolean | undefined,
    minLevel: item.minLevel as number | undefined,
    createdAt: (item.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (item.updatedAt as string) ?? new Date().toISOString(),
    createdBy: item.createdBy as string | undefined,
  };
}

function parsePromoCodesResponse(response: unknown): PromoCode[] {
  if (!response || typeof response !== "object") return [];
  
  const r = response as Record<string, unknown>;
  const data = r.data ?? r.promoCodes ?? r.items ?? response;
  
  if (Array.isArray(data)) {
    return data
      .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
      .map(normalizePromoCode);
  }
  
  return [];
}

export const promocodesApi = createApi({
  reducerPath: "promocodesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [PROMO_TAG],
  endpoints: builder => ({
    /** Получить все промокоды (админ) */
    getPromoCodes: builder.query<
      PromoCodesListResponse,
      { page?: number; limit?: number; status?: string; search?: string }
    >({
      query: ({ page = 1, limit = 20, status, search }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (status) params.set("status", status);
        if (search) params.set("search", search);
        return `/promocodes/admin?${params.toString()}`;
      },
      transformResponse: (response: unknown) => {
        if (!response || typeof response !== "object") {
          return { data: [], total: 0, page: 1, limit: 20 };
        }
        const r = response as Record<string, unknown>;
        const data = parsePromoCodesResponse(response);
        return {
          data,
          total: (r.total as number) ?? data.length,
          page: (r.page as number) ?? 1,
          limit: (r.limit as number) ?? 20,
        };
      },
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: PROMO_TAG, id })),
              { type: PROMO_TAG, id: "LIST" },
            ]
          : [{ type: PROMO_TAG, id: "LIST" }],
    }),

    /** Получить промокод по ID (админ) */
    getPromoCodeById: builder.query<PromoCode, string>({
      query: id => `/promocodes/admin/${id}`,
      transformResponse: (response: unknown) => {
        if (!response || typeof response !== "object") {
          throw new Error("Invalid response");
        }
        const r = response as Record<string, unknown>;
        const data = (r.data ?? response) as Record<string, unknown>;
        return normalizePromoCode(data);
      },
      providesTags: (_result, _error, id) => [{ type: PROMO_TAG, id }],
    }),

    /** Создать промокод (админ) */
    createPromoCode: builder.mutation<PromoCode, CreatePromoCodeDto>({
      query: body => ({
        url: "/promocodes/admin",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) => {
        const r = response as Record<string, unknown>;
        const data = (r.data ?? response) as Record<string, unknown>;
        return normalizePromoCode(data);
      },
      invalidatesTags: [{ type: PROMO_TAG, id: "LIST" }],
    }),

    /** Обновить промокод (админ) */
    updatePromoCode: builder.mutation<PromoCode, { id: string; dto: UpdatePromoCodeDto }>({
      query: ({ id, dto }) => ({
        url: `/promocodes/admin/${id}`,
        method: "PATCH",
        body: dto,
      }),
      transformResponse: (response: unknown) => {
        const r = response as Record<string, unknown>;
        const data = (r.data ?? response) as Record<string, unknown>;
        return normalizePromoCode(data);
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: PROMO_TAG, id },
        { type: PROMO_TAG, id: "LIST" },
      ],
    }),

    /** Удалить промокод (админ) */
    deletePromoCode: builder.mutation<{ message: string }, string>({
      query: id => ({
        url: `/promocodes/admin/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: PROMO_TAG, id },
        { type: PROMO_TAG, id: "LIST" },
      ],
    }),

    /** Получить историю использования промокода (админ) */
    getPromoCodeUsage: builder.query<
      PromoCodeUsageResponse,
      { promoCodeId: string; page?: number; limit?: number }
    >({
      query: ({ promoCodeId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        return `/promocodes/admin/${promoCodeId}/usage?${params.toString()}`;
      },
      transformResponse: (response: unknown) => {
        if (!response || typeof response !== "object") {
          return { data: [], total: 0, page: 1, limit: 20 };
        }
        const r = response as Record<string, unknown>;
        const rawData = (r.data ?? r.usage ?? r.items ?? []) as unknown[];
        const data: PromoCodeUsage[] = Array.isArray(rawData)
          ? rawData.map((item: unknown) => {
              const i = item as Record<string, unknown>;
              return {
                id: (i.id ?? i._id) as string,
                promoCodeId: i.promoCodeId as string,
                promoCode: i.promoCode as string | undefined,
                userId: i.userId as string,
                username: i.username as string | undefined,
                usedAt: (i.usedAt ?? i.createdAt) as string,
                rewardsGranted: (i.rewardsGranted ?? i.rewards ?? []) as PromoCodeUsage["rewardsGranted"],
              };
            })
          : [];
        return {
          data,
          total: (r.total as number) ?? data.length,
          page: (r.page as number) ?? 1,
          limit: (r.limit as number) ?? 20,
        };
      },
    }),

    /** Активировать промокод (пользователь) */
    redeemPromoCode: builder.mutation<RedeemPromoCodeResult, { code: string }>({
      query: ({ code }) => ({
        url: "/promocodes/redeem",
        method: "POST",
        body: { code },
      }),
      transformResponse: (response: unknown) => {
        const r = response as Record<string, unknown>;
        return {
          success: (r.success as boolean) ?? true,
          message: (r.message as string) ?? "Промокод активирован",
          rewards: r.rewards as RedeemPromoCodeResult["rewards"],
          newBalance: r.newBalance as number | undefined,
        };
      },
      invalidatesTags: [{ type: PROMO_TAG, id: "LIST" }],
    }),

    /** Проверить промокод без активации (пользователь) */
    checkPromoCode: builder.query<
      { valid: boolean; rewards?: PromoCode["rewards"]; message?: string },
      string
    >({
      query: code => `/promocodes/check/${encodeURIComponent(code)}`,
      transformResponse: (response: unknown) => {
        const r = response as Record<string, unknown>;
        return {
          valid: (r.valid as boolean) ?? false,
          rewards: r.rewards as PromoCode["rewards"] | undefined,
          message: r.message as string | undefined,
        };
      },
    }),

    /** Сгенерировать случайный код (админ) */
    generatePromoCode: builder.query<{ code: string }, { length?: number; prefix?: string }>({
      query: ({ length = 8, prefix = "" }) => {
        const params = new URLSearchParams();
        params.set("length", String(length));
        if (prefix) params.set("prefix", prefix);
        return `/promocodes/admin/generate?${params.toString()}`;
      },
    }),
  }),
});

export const {
  useGetPromoCodesQuery,
  useGetPromoCodeByIdQuery,
  useCreatePromoCodeMutation,
  useUpdatePromoCodeMutation,
  useDeletePromoCodeMutation,
  useGetPromoCodeUsageQuery,
  useRedeemPromoCodeMutation,
  useCheckPromoCodeQuery,
  useLazyCheckPromoCodeQuery,
  useLazyGeneratePromoCodeQuery,
} = promocodesApi;
