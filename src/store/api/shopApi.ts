import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Decoration } from "@/api/shop";
import type { ApiResponse } from "@/api/shop";
import type { CreateDecorationDto, UpdateDecorationDto } from "@/api/shop";

const SHOP_TAG = "Shop" as const;

/** Нормализует ответ API к массиву Decoration — поддерживает разные форматы бэкенда */
function parseDecorationsResponse(response: unknown): Decoration[] {
  if (!response || typeof response !== "object") return [];

  const r = response as Record<string, unknown>;

  // { data: Decoration[] } или { success: true, data: Decoration[] }
  const data = r.data;
  if (Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === "object") {
    return data as Decoration[];
  }
  if (Array.isArray(data)) return data as Decoration[];

  // { decorations: Decoration[] }
  const decorations = r.decorations;
  if (Array.isArray(decorations)) return decorations as Decoration[];

  // Вложенная структура { data: { data: [...] } } или { data: { decorations: [...] } }
  if (data && typeof data === "object") {
    const inner = data as Record<string, unknown>;
    const arr = (inner.data ?? inner.decorations) as unknown;
    if (Array.isArray(arr)) return arr as Decoration[];
  }

  return [];
}

export const shopApi = createApi({
  reducerPath: "shopApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    credentials: "include",
    prepareHeaders: headers => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("tomilo_lib_token");
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: [SHOP_TAG],
  endpoints: builder => ({
    getDecorations: builder.query<Decoration[], void>({
      query: () => "/shop/decorations",
      transformResponse: parseDecorationsResponse,
      providesTags: result =>
        Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: SHOP_TAG, id })),
              { type: SHOP_TAG, id: "LIST" },
            ]
          : [{ type: SHOP_TAG, id: "LIST" }],
    }),

    getDecorationsByType: builder.query<
      Decoration[],
      { type: "avatar" | "background" | "card" }
    >({
      query: ({ type }) => `/shop/decorations/${type}`,
      transformResponse: parseDecorationsResponse,
      providesTags: result =>
        Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: SHOP_TAG, id })),
              { type: SHOP_TAG, id: "LIST" },
            ]
          : [{ type: SHOP_TAG, id: "LIST" }],
    }),

    createDecoration: builder.mutation<Decoration, CreateDecorationDto>({
      query: body => ({
        url: "/shop/admin/decorations",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: SHOP_TAG, id: "LIST" }],
    }),

    /** Создание украшения с загрузкой файла изображения (multipart/form-data).
     * Тот же URL, что и createDecoration — бэкенд по Content-Type может принимать и JSON, и FormData. */
    createDecorationWithImage: builder.mutation<
      Decoration,
      { name: string; description: string; price: number; type: CreateDecorationDto["type"]; image: File }
    >({
      query: ({ name, description, price, type, image }) => {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("price", String(price));
        formData.append("type", type);
        formData.append("image", image);
        return {
          url: "/shop/admin/decorations",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [{ type: SHOP_TAG, id: "LIST" }],
    }),

    updateDecoration: builder.mutation<
      Decoration,
      { id: string; dto: UpdateDecorationDto }
    >({
      query: ({ id, dto }) => ({
        url: `/shop/admin/decorations/${id}`,
        method: "PATCH",
        body: dto,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: SHOP_TAG, id },
        { type: SHOP_TAG, id: "LIST" },
      ],
    }),

    /** Обновление украшения с загрузкой нового файла изображения (multipart/form-data).
     * Тот же URL, что и updateDecoration — бэкенд по Content-Type может принимать и JSON, и FormData. */
    updateDecorationWithImage: builder.mutation<
      Decoration,
      {
        id: string;
        name?: string;
        description?: string;
        price?: number;
        type?: UpdateDecorationDto["type"];
        image: File;
      }
    >({
      query: ({ id, name, description, price, type, image }) => {
        const formData = new FormData();
        if (name !== undefined) formData.append("name", name);
        if (description !== undefined) formData.append("description", description);
        if (price !== undefined) formData.append("price", String(price));
        if (type !== undefined) formData.append("type", type);
        formData.append("image", image);
        return {
          url: `/shop/admin/decorations/${id}`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: SHOP_TAG, id },
        { type: SHOP_TAG, id: "LIST" },
      ],
    }),

    deleteDecoration: builder.mutation<{ message: string }, string>({
      query: id => ({
        url: `/shop/admin/decorations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: SHOP_TAG, id },
        { type: SHOP_TAG, id: "LIST" },
      ],
    }),

    /** Декорации пользователя (инвентарь) */
    getUserProfileDecorations: builder.query<Decoration[], void>({
      query: () => "/shop/profile/decorations",
      transformResponse: parseDecorationsResponse,
      providesTags: [{ type: SHOP_TAG, id: "PROFILE" }],
    }),

    equipDecoration: builder.mutation<
      { message: string; decorationId?: string },
      { type: "avatar" | "background" | "card"; decorationId: string }
    >({
      query: ({ type, decorationId }) => ({
        url: `/shop/equip/${type}/${decorationId}`,
        method: "PUT",
      }),
      invalidatesTags: [{ type: SHOP_TAG, id: "PROFILE" }, { type: SHOP_TAG, id: "LIST" }],
    }),

    unequipDecoration: builder.mutation<
      { message: string },
      { type: "avatar" | "background" | "card" }
    >({
      query: ({ type }) => ({
        url: `/shop/equip/${type}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: SHOP_TAG, id: "PROFILE" }, { type: SHOP_TAG, id: "LIST" }],
    }),
  }),
});

export const {
  useGetDecorationsQuery,
  useGetDecorationsByTypeQuery,
  useGetUserProfileDecorationsQuery,
  useCreateDecorationMutation,
  useCreateDecorationWithImageMutation,
  useUpdateDecorationMutation,
  useUpdateDecorationWithImageMutation,
  useDeleteDecorationMutation,
  useEquipDecorationMutation,
  useUnequipDecorationMutation,
} = shopApi;
