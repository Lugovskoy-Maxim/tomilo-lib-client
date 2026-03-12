import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import type { ApiResponseDto } from "@/types/api";
import type { GameItemType, GameItemRarity } from "@/types/games";
import type { CardDeck, CardStageRank } from "@/types/games";

export interface GameItemAdmin {
  _id: string;
  id: string;
  name: string;
  description: string;
  icon: string;
  type: GameItemType;
  rarity: GameItemRarity;
  stackable: boolean;
  maxStack: number;
  usedInRecipes: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface GameItemCreateRequest {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  type: GameItemType;
  rarity: GameItemRarity;
  stackable?: boolean;
  maxStack?: number;
  usedInRecipes?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ReadingDropRule {
  _id: string;
  itemId: string;
  chance: number;
  minChaptersToday: number;
  maxDropsPerDay: number;
  isActive: boolean;
}

export interface DailyQuestItemReward {
  _id: string;
  questType: string;
  itemId: string;
  countMin: number;
  countMax: number;
  chance: number;
  sortOrder: number;
  isActive: boolean;
}

export interface LeaderboardReward {
  _id: string;
  category: string;
  period: string;
  rankMin: number;
  rankMax: number;
  itemId?: string;
  itemCount: number;
  coins: number;
  isActive: boolean;
}

export interface DisciplesConfig {
  rerollCostCoins: number;
  trainCostCoins: number;
  maxDisciples: number;
  maxBattlesPerDay: number;
  statRanges: Record<string, number>;
  cpFormula: Record<string, number>;
  winChanceK: number;
  statCap: number;
  rerollCandidateTtlMinutes: number;
  characterPool: string;
}

export interface AlchemyRecipeAdmin {
  _id: string;
  name: string;
  description: string;
  icon: string;
  coinCost: number;
  ingredients: { itemId: string; count: number }[];
  resultType: string;
  qualityWeights: { common: number; quality: number; legendary: number };
  isActive: boolean;
  sortOrder: number;
}

export interface WheelSegmentAdmin {
  rewardType: string;
  weight: number;
  param?: number | { itemId: string; count: number } | Record<string, unknown>;
  label: string;
}

export interface WheelConfig {
  spinCostCoins: number;
  segments: WheelSegmentAdmin[];
}

export interface UserGameData {
  userId: string;
  inventory: { itemId: string; count: number; name?: string; icon?: string }[];
  achievements: { achievementId: string; level: number; unlockedAt: string; progress: number }[];
  disciples: unknown[];
  combatRating: number;
  element: string | null;
}

export interface CharacterCardStageAdmin {
  rank: CardStageRank;
  imageUrl: string;
  requiredLevel: number;
  upgradeCoins: number;
  upgradeItemId?: string;
  upgradeItemCount?: number;
  upgradeSuccessChance?: number;
}

export interface CharacterCardAdmin {
  _id: string;
  name: string;
  description?: string;
  imageUrl: string;
  price: number;
  rarity: string;
  isAvailable: boolean;
  quantity?: number;
  characterId?: { _id: string; name?: string; avatar?: string } | string | null;
  titleId?: { _id: string; title?: string; name?: string } | string | null;
  stages: CharacterCardStageAdmin[];
}

export const gameItemsAdminApi = createApi({
  reducerPath: "gameItemsAdminApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["GameItems", "ReadingDrops", "DailyQuestRewards", "LeaderboardRewards", "DisciplesConfig", "Recipes", "WheelConfig", "UserGameData", "CharacterCards", "CardDecks"],
  endpoints: builder => ({
    listGameItems: builder.query<
      ApiResponseDto<{ items: GameItemAdmin[]; pagination: { total: number; page: number; limit: number; pages: number } }>,
      { search?: string; type?: string; rarity?: string; isActive?: string; page?: number; limit?: number }
    >({
      query: (params = {}) => {
        const sp = new URLSearchParams();
        if (params.search) sp.set("search", params.search);
        if (params.type) sp.set("type", params.type);
        if (params.rarity) sp.set("rarity", params.rarity);
        if (params.isActive !== undefined) sp.set("isActive", params.isActive);
        sp.set("page", String(params.page ?? 1));
        sp.set("limit", String(params.limit ?? 50));
        return { url: `/game-items/admin?${sp.toString()}` };
      },
      providesTags: ["GameItems"],
    }),

    getGameItem: builder.query<ApiResponseDto<GameItemAdmin>, string>({
      query: id => ({ url: `/game-items/admin/item/${id}` }),
      providesTags: (_, __, id) => [{ type: "GameItems", id }],
    }),

    uploadGameItemIcon: builder.mutation<ApiResponseDto<{ url: string }>, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file, file.name || "image");
        return {
          url: "/game-items/admin/upload-icon",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [],
    }),

    createGameItem: builder.mutation<ApiResponseDto<GameItemAdmin>, GameItemCreateRequest>({
      query: body => ({ url: "/game-items/admin", method: "POST", body }),
      invalidatesTags: ["GameItems"],
    }),

    updateGameItem: builder.mutation<ApiResponseDto<GameItemAdmin>, { id: string; body: Partial<GameItemCreateRequest> }>({
      query: ({ id, body }) => ({ url: `/game-items/admin/item/${id}`, method: "PATCH", body }),
      invalidatesTags: ["GameItems"],
    }),

    deleteGameItem: builder.mutation<ApiResponseDto<{ message: string }>, string>({
      query: id => ({ url: `/game-items/admin/item/${id}`, method: "DELETE" }),
      invalidatesTags: ["GameItems"],
    }),

    grantItem: builder.mutation<ApiResponseDto<unknown>, { userId: string; itemId: string; count: number }>({
      query: body => ({ url: "/game-items/admin/grant", method: "POST", body }),
      invalidatesTags: ["GameItems", "UserGameData"],
    }),

    getUserGameData: builder.query<ApiResponseDto<UserGameData>, string>({
      query: userId => ({ url: `/game-items/admin/users/${userId}/game-data` }),
      providesTags: (_, __, userId) => [{ type: "UserGameData", id: userId }],
    }),

    setUserInventory: builder.mutation<
      ApiResponseDto<{ userId: string; inventory: { itemId: string; count: number }[] }>,
      { userId: string; items: { itemId: string; count: number }[] }
    >({
      query: ({ userId, items }) => ({
        url: `/game-items/admin/users/${userId}/inventory`,
        method: "PUT",
        body: { items },
      }),
      invalidatesTags: (_, __, { userId }) => [{ type: "UserGameData", id: userId }],
    }),

    listReadingDrops: builder.query<ApiResponseDto<{ rules: ReadingDropRule[] }>, void>({
      query: () => ({ url: "/game-items/admin/drops/reading" }),
      providesTags: ["ReadingDrops"],
    }),

    createReadingDrop: builder.mutation<ApiResponseDto<ReadingDropRule>, Partial<ReadingDropRule> & { itemId: string; chance: number; maxDropsPerDay: number }>({
      query: body => ({ url: "/game-items/admin/drops/reading", method: "POST", body }),
      invalidatesTags: ["ReadingDrops"],
    }),

    updateReadingDrop: builder.mutation<ApiResponseDto<ReadingDropRule>, { id: string; body: Partial<ReadingDropRule> }>({
      query: ({ id, body }) => ({ url: `/game-items/admin/drops/reading/${id}`, method: "PATCH", body }),
      invalidatesTags: ["ReadingDrops"],
    }),

    deleteReadingDrop: builder.mutation<ApiResponseDto<{ message: string }>, string>({
      query: id => ({ url: `/game-items/admin/drops/reading/${id}`, method: "DELETE" }),
      invalidatesTags: ["ReadingDrops"],
    }),

    listDailyQuestRewards: builder.query<ApiResponseDto<{ rewards: DailyQuestItemReward[] }>, void>({
      query: () => ({ url: "/game-items/admin/drops/daily-quest" }),
      providesTags: ["DailyQuestRewards"],
    }),

    createDailyQuestReward: builder.mutation<ApiResponseDto<DailyQuestItemReward>, Partial<DailyQuestItemReward> & { questType: string; itemId: string; countMin: number; countMax: number }>({
      query: body => ({ url: "/game-items/admin/drops/daily-quest", method: "POST", body }),
      invalidatesTags: ["DailyQuestRewards"],
    }),

    updateDailyQuestReward: builder.mutation<ApiResponseDto<DailyQuestItemReward>, { id: string; body: Partial<DailyQuestItemReward> }>({
      query: ({ id, body }) => ({ url: `/game-items/admin/drops/daily-quest/${id}`, method: "PATCH", body }),
      invalidatesTags: ["DailyQuestRewards"],
    }),

    deleteDailyQuestReward: builder.mutation<ApiResponseDto<{ message: string }>, string>({
      query: id => ({ url: `/game-items/admin/drops/daily-quest/${id}`, method: "DELETE" }),
      invalidatesTags: ["DailyQuestRewards"],
    }),

    listLeaderboardRewards: builder.query<ApiResponseDto<{ rewards: LeaderboardReward[] }>, { category?: string; period?: string }>({
      query: (params = {}) => {
        const sp = new URLSearchParams();
        if (params.category) sp.set("category", params.category);
        if (params.period) sp.set("period", params.period);
        return { url: `/game-items/admin/rewards/leaderboard?${sp.toString()}` };
      },
      providesTags: ["LeaderboardRewards"],
    }),

    createLeaderboardReward: builder.mutation<ApiResponseDto<LeaderboardReward>, Partial<LeaderboardReward> & { category: string; period: string; rankMin: number; rankMax: number }>({
      query: body => ({ url: "/game-items/admin/rewards/leaderboard", method: "POST", body }),
      invalidatesTags: ["LeaderboardRewards"],
    }),

    updateLeaderboardReward: builder.mutation<ApiResponseDto<LeaderboardReward>, { id: string; body: Partial<LeaderboardReward> }>({
      query: ({ id, body }) => ({ url: `/game-items/admin/rewards/leaderboard/${id}`, method: "PATCH", body }),
      invalidatesTags: ["LeaderboardRewards"],
    }),

    deleteLeaderboardReward: builder.mutation<ApiResponseDto<{ message: string }>, string>({
      query: id => ({ url: `/game-items/admin/rewards/leaderboard/${id}`, method: "DELETE" }),
      invalidatesTags: ["LeaderboardRewards"],
    }),

    getDisciplesConfig: builder.query<ApiResponseDto<DisciplesConfig>, void>({
      query: () => ({ url: "/game-items/admin/config/disciples" }),
      providesTags: ["DisciplesConfig"],
    }),

    updateDisciplesConfig: builder.mutation<ApiResponseDto<DisciplesConfig>, Partial<DisciplesConfig>>({
      query: body => ({ url: "/game-items/admin/config/disciples", method: "PUT", body }),
      invalidatesTags: ["DisciplesConfig"],
    }),

    listRecipes: builder.query<ApiResponseDto<{ recipes: AlchemyRecipeAdmin[] }>, void>({
      query: () => ({ url: "/game-items/admin/recipes" }),
      providesTags: ["Recipes"],
    }),

    getRecipe: builder.query<ApiResponseDto<AlchemyRecipeAdmin>, string>({
      query: id => ({ url: `/game-items/admin/recipes/${id}` }),
      providesTags: (_, __, id) => [{ type: "Recipes", id }],
    }),

    createRecipe: builder.mutation<ApiResponseDto<AlchemyRecipeAdmin>, Partial<AlchemyRecipeAdmin> & { name: string }>({
      query: body => ({ url: "/game-items/admin/recipes", method: "POST", body }),
      invalidatesTags: ["Recipes"],
    }),

    updateRecipe: builder.mutation<ApiResponseDto<AlchemyRecipeAdmin>, { id: string; body: Partial<AlchemyRecipeAdmin> }>({
      query: ({ id, body }) => ({ url: `/game-items/admin/recipes/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Recipes"],
    }),

    deleteRecipe: builder.mutation<ApiResponseDto<{ message: string }>, string>({
      query: id => ({ url: `/game-items/admin/recipes/${id}`, method: "DELETE" }),
      invalidatesTags: ["Recipes"],
    }),

    getWheelConfig: builder.query<ApiResponseDto<WheelConfig>, void>({
      query: () => ({ url: "/game-items/admin/config/wheel" }),
      providesTags: ["WheelConfig"],
    }),

    updateWheelConfig: builder.mutation<ApiResponseDto<WheelConfig>, Partial<WheelConfig>>({
      query: body => ({ url: "/game-items/admin/config/wheel", method: "PUT", body }),
      invalidatesTags: ["WheelConfig"],
    }),

    listCharacterCards: builder.query<ApiResponseDto<{ cards: CharacterCardAdmin[] }>, void>({
      query: () => ({ url: "/game-items/admin/cards" }),
      providesTags: ["CharacterCards"],
    }),

    createCharacterCard: builder.mutation<ApiResponseDto<CharacterCardAdmin>, {
      name: string;
      description?: string;
      price?: number;
      imageUrl?: string;
      rarity?: string;
      isAvailable?: boolean;
      quantity?: number | null;
      characterId: string;
      stages: CharacterCardStageAdmin[];
    }>({
      query: body => ({ url: "/game-items/admin/cards", method: "POST", body }),
      invalidatesTags: ["CharacterCards"],
    }),

    updateCharacterCard: builder.mutation<ApiResponseDto<CharacterCardAdmin>, {
      id: string;
      body: Partial<{
        name: string;
        description: string;
        price: number;
        imageUrl: string;
        rarity: string;
        isAvailable: boolean;
        quantity: number | null;
        characterId: string;
        stages: CharacterCardStageAdmin[];
      }>;
    }>({
      query: ({ id, body }) => ({ url: `/game-items/admin/cards/${id}`, method: "PATCH", body }),
      invalidatesTags: ["CharacterCards"],
    }),

    deleteCharacterCard: builder.mutation<ApiResponseDto<{ message: string }>, string>({
      query: id => ({ url: `/game-items/admin/cards/${id}`, method: "DELETE" }),
      invalidatesTags: ["CharacterCards"],
    }),

    listCardDecks: builder.query<ApiResponseDto<{ decks: CardDeck[] }>, void>({
      query: () => ({ url: "/game-items/admin/card-decks" }),
      providesTags: ["CardDecks"],
    }),

    createCardDeck: builder.mutation<ApiResponseDto<CardDeck>, Partial<CardDeck> & { name: string; imageUrl: string }>({
      query: body => ({ url: "/game-items/admin/card-decks", method: "POST", body }),
      invalidatesTags: ["CardDecks"],
    }),

    updateCardDeck: builder.mutation<ApiResponseDto<CardDeck>, { id: string; body: Partial<CardDeck> & { quantity?: number | null; titleId?: string | null } }>({
      query: ({ id, body }) => ({ url: `/game-items/admin/card-decks/${id}`, method: "PATCH", body }),
      invalidatesTags: ["CardDecks"],
    }),

    deleteCardDeck: builder.mutation<ApiResponseDto<{ message: string }>, string>({
      query: id => ({ url: `/game-items/admin/card-decks/${id}`, method: "DELETE" }),
      invalidatesTags: ["CardDecks"],
    }),
  }),
});

export const {
  useListGameItemsQuery,
  useGetGameItemQuery,
  useUploadGameItemIconMutation,
  useCreateGameItemMutation,
  useUpdateGameItemMutation,
  useDeleteGameItemMutation,
  useGrantItemMutation,
  useGetUserGameDataQuery,
  useSetUserInventoryMutation,
  useListReadingDropsQuery,
  useCreateReadingDropMutation,
  useUpdateReadingDropMutation,
  useDeleteReadingDropMutation,
  useListDailyQuestRewardsQuery,
  useCreateDailyQuestRewardMutation,
  useUpdateDailyQuestRewardMutation,
  useDeleteDailyQuestRewardMutation,
  useListLeaderboardRewardsQuery,
  useCreateLeaderboardRewardMutation,
  useUpdateLeaderboardRewardMutation,
  useDeleteLeaderboardRewardMutation,
  useGetDisciplesConfigQuery,
  useUpdateDisciplesConfigMutation,
  useListRecipesQuery,
  useGetRecipeQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
  useGetWheelConfigQuery,
  useUpdateWheelConfigMutation,
  useListCharacterCardsQuery,
  useCreateCharacterCardMutation,
  useUpdateCharacterCardMutation,
  useDeleteCharacterCardMutation,
  useListCardDecksQuery,
  useCreateCardDeckMutation,
  useUpdateCardDeckMutation,
  useDeleteCardDeckMutation,
} = gameItemsAdminApi;
