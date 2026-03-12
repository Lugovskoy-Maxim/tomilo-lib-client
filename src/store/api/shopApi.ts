import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import type { Decoration } from "@/api/shop";
import { normalizeRarity } from "@/api/shop";
import type { CreateDecorationDto, UpdateDecorationDto } from "@/api/shop";
import type { CardDeck } from "@/types/games";

const SHOP_TAG = "Shop" as const;
const SHOP_DECKS_TAG = "ShopDecks" as const;

type DecorationType = "avatar" | "frame" | "background" | "card";

/** Предложенное пользователем украшение (голосование). Карточки в UI пока выключены. */
export interface SuggestedDecoration {
  id: string;
  type: "avatar" | "frame" | "background" | "card";
  name: string;
  description: string;
  imageUrl: string;
  authorId?: string;
  authorUsername?: string;
  authorLevel?: number;
  votesCount: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  userHasVoted?: boolean;
}

/** Извлекает authorId, authorUsername, authorLevel из authorId (populate) или полей author_* */
function getAuthorFromItem(item: Record<string, unknown>): {
  authorId?: string;
  authorUsername?: string;
  authorLevel?: number;
} {
  const raw = item.authorId ?? item.author_id;
  if (raw && typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    const id = (o.id ?? o._id) as string | undefined;
    const username = (o.username ?? o.userName) as string | undefined;
    const level = (o.level ?? o.userLevel) as number | undefined;
    return {
      authorId: id ?? (typeof raw === "object" && "_id" in (raw as object) ? String((raw as { _id?: unknown })._id) : undefined),
      authorUsername: username,
      authorLevel: level != null ? Number(level) : undefined,
    };
  }
  if (typeof raw === "string") {
    return { authorId: raw };
  }
  const username = (item.authorUsername ?? item.author_username) as string | undefined;
  const level = (item.authorLevel ?? item.author_level) as number | undefined;
  if (username || level != null) {
    return {
      authorUsername: username,
      authorLevel: level != null ? Number(level) : undefined,
    };
  }
  return {};
}

/** Нормализует элемент: _id → id, добавляет type если передан массив по типу */
function normalizeDecoration(item: Record<string, unknown>, type?: DecorationType): Decoration {
  const id = (item.id ?? item._id) as string;
  const stock = (item.stock ?? item.quantity_remaining) as number | undefined;
  const isSoldOut = (item.isSoldOut ?? item.is_sold_out ?? item.sold_out) as boolean | undefined;
  const author = getAuthorFromItem(item);
  return {
    id,
    name: (item.name as string) ?? "",
    description: (item.description as string) ?? "",
    price: (item.price as number) ?? 0,
    imageUrl: ((item.imageUrl ?? item.image_url) as string) ?? "",
    type: (type ?? item.type) as DecorationType,
    rarity: normalizeRarity(item.rarity ?? item.rarity_level),
    isAvailable: item.isAvailable as boolean | undefined,
    isEquipped: (item.isEquipped ?? item.is_equipped) as boolean | undefined,
    stock: stock != null ? Number(stock) : undefined,
    isSoldOut: isSoldOut ?? (stock != null && Number(stock) <= 0),
    subscriptionPrice: (item.subscriptionPrice ?? item.subscription_price) as number | undefined,
    onlyWithSubscription: (item.onlyWithSubscription ?? item.only_with_subscription) as
      | boolean
      | undefined,
    bonus: (item.bonus as number | undefined) ?? undefined,
    authorId: author.authorId,
    authorUsername: author.authorUsername,
    authorLevel: author.authorLevel,
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
      const withType = (arr: unknown[], type: DecorationType): Decoration[] =>
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
  tagTypes: [SHOP_TAG, SHOP_DECKS_TAG],
  endpoints: builder => ({
    /** Админский список украшений (может включать недоступные в магазине). */
    getAdminDecorations: builder.query<Decoration[], void>({
      query: () => "/shop/admin/decorations",
      transformResponse: parseDecorationsResponse,
      providesTags: result =>
        Array.isArray(result)
          ? [...result.map(({ id }) => ({ type: SHOP_TAG, id })), { type: SHOP_TAG, id: "LIST" }]
          : [{ type: SHOP_TAG, id: "LIST" }],
    }),

    getDecorations: builder.query<Decoration[], void>({
      query: () => "/shop/decorations",
      transformResponse: parseDecorationsResponse,
      providesTags: result =>
        Array.isArray(result)
          ? [...result.map(({ id }) => ({ type: SHOP_TAG, id })), { type: SHOP_TAG, id: "LIST" }]
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
          ? [...result.map(({ id }) => ({ type: SHOP_TAG, id })), { type: SHOP_TAG, id: "LIST" }]
          : [{ type: SHOP_TAG, id: "LIST" }],
    }),

    getCardDecks: builder.query<{ decks: CardDeck[] }, void>({
      query: () => "/shop/decks",
      transformResponse: (response: { data?: { decks?: Record<string, unknown>[] } }) => ({
        decks: Array.isArray(response?.data?.decks)
          ? response.data.decks.map((deck) => ({
              _id: String(deck._id ?? ""),
              id: String(deck._id ?? deck.id ?? ""),
              name: String(deck.name ?? ""),
              description: String(deck.description ?? ""),
              imageUrl: String(deck.imageUrl ?? ""),
              price: Number(deck.price ?? 0),
              isAvailable: Boolean(deck.isAvailable ?? true),
              quantity:
                deck.quantity == null ? undefined : Number(deck.quantity),
              titleId:
                typeof deck.titleId === "string"
                  ? deck.titleId
                  : typeof deck.titleId === "object" && deck.titleId
                    ? String((deck.titleId as { _id?: unknown })._id ?? "")
                    : null,
              titleName:
                typeof deck.titleId === "object" && deck.titleId
                  ? String(
                      (deck.titleId as { title?: unknown; name?: unknown }).title ??
                        (deck.titleId as { name?: unknown }).name ??
                        "",
                    )
                  : "",
              cardsPerOpen: Number(deck.cardsPerOpen ?? 3),
              titleFocusChance: Number(deck.titleFocusChance ?? 0.75),
              isTitleDeck: Boolean(deck.isTitleDeck ?? deck.titleId),
              isPremium: Boolean(deck.isPremium ?? deck.titleId),
              pityThreshold: Number(deck.pityThreshold ?? 0),
              pityTargetRarity: String(deck.pityTargetRarity ?? ""),
              pityProgress: Number(deck.pityProgress ?? 0),
              pityRemaining: Number(deck.pityRemaining ?? 0),
            }))
          : [],
      }),
      providesTags: [{ type: SHOP_DECKS_TAG, id: "LIST" }],
    }),

    openCardDeck: builder.mutation<
      {
        deck: CardDeck;
        openedCards: { isNew: boolean; shardsGained: number; card: unknown }[];
        balance: number;
        pity?: {
          triggered: boolean;
          hitTarget: boolean;
          threshold: number;
          targetRarity: string;
          progress: number;
          remaining: number;
        };
      },
      string
    >({
      query: deckId => ({
        url: `/shop/decks/${deckId}/open`,
        method: "POST",
      }),
      transformResponse: (response: { data?: any }) => response.data,
      invalidatesTags: [
        { type: SHOP_DECKS_TAG, id: "LIST" },
        { type: SHOP_TAG, id: "PROFILE" },
      ],
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
        // Backend expects "file" (multer). Use explicit filename so server recognizes the part.
        formData.append("file", file, file.name || "image");
        formData.append("type", type);
        if (name !== undefined && name !== "") formData.append("name", name);
        if (description !== undefined && description !== "")
          formData.append("description", description);
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

    updateDecoration: builder.mutation<Decoration, { id: string; dto: UpdateDecorationDto }>({
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
        // Backend expects "file" (multer). Use explicit filename so server recognizes the part.
        formData.append("file", file, file.name || "image");
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
      invalidatesTags: [
        { type: SHOP_TAG, id: "PROFILE" },
        { type: SHOP_TAG, id: "LIST" },
      ],
    }),

    unequipDecoration: builder.mutation<
      { message: string },
      { type: "avatar" | "frame" | "background" | "card" }
    >({
      query: ({ type }) => ({
        url: `/shop/equip/${type}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: SHOP_TAG, id: "PROFILE" },
        { type: SHOP_TAG, id: "LIST" },
      ],
    }),

    /** Предложенные пользователями украшения (голосование). */
    getSuggestions: builder.query<SuggestedDecoration[], void>({
      query: () => "/shop/suggestions",
      transformResponse: (response: unknown) => {
        const r = response as { data?: unknown };
        const data = r?.data;
        if (!Array.isArray(data)) return [];
        return (data as Record<string, unknown>[]).map((item) => {
          const author = getAuthorFromItem(item);
          return {
            id: String(item.id ?? item._id ?? ""),
            type: (item.type as SuggestedDecoration["type"]) ?? "avatar",
            name: String(item.name ?? ""),
            description: String(item.description ?? ""),
            imageUrl: String(item.imageUrl ?? item.image_url ?? ""),
            authorId: author.authorId,
            authorUsername: author.authorUsername,
            authorLevel: author.authorLevel,
            votesCount: Number(item.votesCount ?? item.votes_count ?? 0),
            status: (item.status as SuggestedDecoration["status"]) ?? "pending",
            createdAt: String(item.createdAt ?? item.created_at ?? ""),
            userHasVoted: Boolean(item.userHasVoted ?? item.user_has_voted),
          } as SuggestedDecoration;
        });
      },
      providesTags: [{ type: SHOP_TAG, id: "SUGGESTIONS" }],
    }),

    /** Загрузить изображение для предложения. Возвращает { imageUrl }. */
    uploadSuggestionImage: builder.mutation<{ imageUrl: string }, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file, file.name || "image");
        return {
          url: "/shop/upload-suggestion",
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: unknown) => {
        const r = response as { data?: { imageUrl?: string } };
        return { imageUrl: r?.data?.imageUrl ?? "" };
      },
    }),

    createSuggestion: builder.mutation<
      SuggestedDecoration,
      {
        type: "avatar" | "frame" | "background" | "card";
        name: string;
        description?: string;
        imageUrl: string;
      }
    >({
      query: (body) => ({
        url: "/shop/suggestions",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: SHOP_TAG, id: "SUGGESTIONS" }],
    }),

    voteSuggestion: builder.mutation<
      { votesCount: number; userHasVoted: boolean },
      string
    >({
      query: (id) => ({
        url: `/shop/suggestions/${id}/vote`,
        method: "POST",
      }),
      invalidatesTags: [{ type: SHOP_TAG, id: "SUGGESTIONS" }],
    }),

    /** Редактировать предложение (только автор, в течение 1 часа). */
    updateSuggestion: builder.mutation<
      SuggestedDecoration,
      { id: string; name?: string; description?: string; imageUrl?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/shop/suggestions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: SHOP_TAG, id: "SUGGESTIONS" }],
    }),

    /** Удалить предложение (только админ). */
    deleteSuggestion: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/shop/suggestions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: SHOP_TAG, id: "SUGGESTIONS" }],
    }),
  }),
});

export const {
  useGetAdminDecorationsQuery,
  useGetDecorationsQuery,
  useGetDecorationsByTypeQuery,
  useGetCardDecksQuery,
  useOpenCardDeckMutation,
  useGetUserProfileDecorationsQuery,
  useCreateDecorationMutation,
  useCreateDecorationWithImageMutation,
  useUpdateDecorationMutation,
  useUpdateDecorationWithImageMutation,
  useDeleteDecorationMutation,
  useEquipDecorationMutation,
  useUnequipDecorationMutation,
  useGetSuggestionsQuery,
  useUploadSuggestionImageMutation,
  useCreateSuggestionMutation,
  useVoteSuggestionMutation,
  useUpdateSuggestionMutation,
  useDeleteSuggestionMutation,
} = shopApi;
