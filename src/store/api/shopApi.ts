import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import type { Decoration } from "@/api/shop";
import { normalizeRarity } from "@/api/shop";
import type { CreateDecorationDto, UpdateDecorationDto } from "@/api/shop";

const SHOP_TAG = "Shop" as const;

type DecorationType = "avatar" | "frame" | "background" | "card";

/** Нормализует элемент: _id → id, добавляет type если передан массив по типу */
function normalizeDecoration(
  item: Record<string, unknown>,
  type?: DecorationType,
): Decoration {
  const id = (item.id ?? item._id) as string;
  const stock = (item.stock ?? item.quantity_remaining) as number | undefined;
  const isSoldOut = (item.isSoldOut ?? item.is_sold_out ?? item.sold_out) as boolean | undefined;
  return {
    id,
    name: (item.name as string) ?? "",
    description: (item.description as string) ?? "",
    price: (item.price as number) ?? 0,
    imageUrl: (item.imageUrl ?? item.image_url) as string ?? "",
    type: (type ?? item.type) as DecorationType,
    rarity: normalizeRarity(item.rarity ?? item.rarity_level),
    isAvailable: item.isAvailable as boolean | undefined,
    isEquipped: (item.isEquipped ?? item.is_equipped) as boolean | undefined,
    stock: stock != null ? Number(stock) : undefined,
    isSoldOut: isSoldOut ?? (stock != null && Number(stock) <= 0),
  };
}

/** Нормализует ответ API к массиву Decoration — поддерживает разные форматы бэкенда */
function parseDecorationsResponse(response: unknown): Decoration[] {
  if (response == null) return [];
  // Ответ — массив на верхнем уровне
  if (Array.isArray(response)) {
    return (response as Record<string, unknown>[])
      .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
      .map(x => normalizeDecoration(x));
  }
  if (typeof response !== "object") return [];

  const r = response as Record<string, unknown>;
  const data = r.data;

  // { data: { avatars: [], frames: [], backgrounds: [], cards: [] } } — бэкенд по типам
  if (data && typeof data === "object") {
    const inner = data as Record<string, unknown>;
    const avatars = (inner.avatars as unknown[]) ?? [];
    const frames = (inner.frames as unknown[]) ?? [];
    const backgrounds = (inner.backgrounds as unknown[]) ?? [];
    const cards = (inner.cards as unknown[]) ?? [];
    if (avatars.length > 0 || frames.length > 0 || backgrounds.length > 0 || cards.length > 0) {
      const withType = (
        arr: unknown[],
        type: DecorationType,
      ): Decoration[] =>
        arr
          .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
          .map(x => normalizeDecoration(x, type));
      return [
        ...withType(avatars, "avatar"),
        ...withType(frames, "frame"),
        ...withType(backgrounds, "background"),
        ...withType(cards, "card"),
      ];
    }
  }

  // { data: Decoration[] } или { success: true, data: Decoration[] }
  if (Array.isArray(data)) {
    return (data as Record<string, unknown>[]).map(x => normalizeDecoration(x));
  }

  // { decorations: [] } | { items: [] } | { result: [] } | { payload: [] }
  const anyList = (r.decorations ?? r.items ?? r.result ?? r.payload ?? data) as unknown;
  if (Array.isArray(anyList)) {
    return (anyList as Record<string, unknown>[])
      .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
      .map(x => normalizeDecoration(x));
  }

  // Вложенная структура { data: { data: [...] } } или { data: { decorations: [...] } }
  if (data && typeof data === "object") {
    const inner = data as Record<string, unknown>;
    const arr = (inner.data ?? inner.decorations ?? inner.items) as unknown;
    if (Array.isArray(arr)) {
      return (arr as Record<string, unknown>[]).map(x => normalizeDecoration(x));
    }
  }

  return [];
}

export const shopApi = createApi({
  reducerPath: "shopApi",
  baseQuery: baseQueryWithReauth,
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
      { type: "avatar" | "frame" | "background" | "card" }
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

    /** Создание украшения через загрузку файла. POST /shop/admin/decorations/upload (multipart/form-data).
     * Поля: file (файл изображения), type, name?, price?, rarity?, description?, isAvailable?, stock? */
    createDecorationWithImage: builder.mutation<
      Decoration,
      {
        file: File;
        type: CreateDecorationDto["type"];
        name?: string;
        description?: string;
        price?: number;
        rarity?: "common" | "rare" | "epic" | "legendary";
        isAvailable?: boolean;
        stock?: number;
      }
    >({
      query: ({ file, type, name, description, price, rarity, isAvailable, stock }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        if (name !== undefined && name !== "") formData.append("name", name);
        if (description !== undefined && description !== "") formData.append("description", description);
        if (price !== undefined) formData.append("price", String(price));
        if (rarity !== undefined) formData.append("rarity", rarity);
        if (isAvailable !== undefined) formData.append("isAvailable", String(isAvailable));
        if (stock !== undefined) formData.append("stock", String(stock));
        return {
          url: "/shop/admin/decorations/upload",
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

    /** Обновление украшения с загрузкой нового файла (если бэкенд поддерживает PATCH с multipart). */
    updateDecorationWithImage: builder.mutation<
      Decoration,
      {
        id: string;
        file: File;
        name?: string;
        description?: string;
        price?: number;
        type?: UpdateDecorationDto["type"];
        rarity?: "common" | "rare" | "epic" | "legendary";
        isAvailable?: boolean;
        stock?: number;
      }
    >({
      query: ({ id, file, name, description, price, type, rarity, isAvailable, stock }) => {
        const formData = new FormData();
        formData.append("file", file);
        if (name !== undefined) formData.append("name", name);
        if (description !== undefined) formData.append("description", description);
        if (price !== undefined) formData.append("price", String(price));
        if (type !== undefined) formData.append("type", type);
        if (rarity !== undefined) formData.append("rarity", rarity);
        if (isAvailable !== undefined) formData.append("isAvailable", String(isAvailable));
        if (stock !== undefined) formData.append("stock", String(stock));
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
      { type: "avatar" | "frame" | "background" | "card"; decorationId: string }
    >({
      query: ({ type, decorationId }) => ({
        url: `/shop/equip/${type}/${decorationId}`,
        method: "PUT",
      }),
      invalidatesTags: [{ type: SHOP_TAG, id: "PROFILE" }, { type: SHOP_TAG, id: "LIST" }],
    }),

    unequipDecoration: builder.mutation<
      { message: string },
      { type: "avatar" | "frame" | "background" | "card" }
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
