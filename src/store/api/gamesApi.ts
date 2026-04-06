import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import type {
  ProfileDisciplesResponse,
  RerollCandidate,
  AlchemyRecipeEntry,
  WheelResponse,
  DiscipleTechniquesEntry,
  ProfileCardsResponse,
  InventoryEntry,
} from "@/types/games";
import type { ApiResponseDto } from "@/types/api";

export const gamesApi = createApi({
  reducerPath: "gamesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ProfileDisciples", "Alchemy", "Wheel", "ProfileInventory", "ProfileCards", "DisciplesGameShop"],
  endpoints: builder => ({
    getProfileInventory: builder.query<
      ApiResponseDto<InventoryEntry[]>,
      void
    >({
      query: () => ({ url: "/users/profile/inventory" }),
      providesTags: ["ProfileInventory"],
    }),

    getProfileDisciples: builder.query<
      ApiResponseDto<ProfileDisciplesResponse>,
      void
    >({
      query: () => ({ url: "/users/profile/disciples" }),
      providesTags: ["ProfileDisciples"],
    }),

    getProfileCards: builder.query<ApiResponseDto<ProfileCardsResponse>, void>({
      query: () => ({ url: "/users/profile/cards" }),
      providesTags: ["ProfileCards"],
    }),

    upgradeProfileCard: builder.mutation<
      ApiResponseDto<{
        success: boolean;
        card: ProfileCardsResponse["cards"][number];
        balance: number;
        consumed: { coins: number; itemId: string | null; itemCount: number };
      }>,
      string
    >({
      query: cardId => ({
        url: `/users/profile/cards/${cardId}/upgrade`,
        method: "POST",
      }),
      invalidatesTags: ["ProfileCards", "ProfileDisciples", "ProfileInventory"],
    }),

    updateProfileCardsShowcase: builder.mutation<
      ApiResponseDto<ProfileCardsResponse>,
      {
        cardIds: string[];
        sortMode?: "manual" | "rarity" | "favorites" | "last_upgraded";
      }
    >({
      query: body => ({
        url: "/users/profile/cards/showcase",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ProfileCards"],
    }),

    disciplesReroll: builder.mutation<
      ApiResponseDto<{ candidate: RerollCandidate; balance: number }>,
      void
    >({
      query: () => ({
        url: "/users/profile/disciples/reroll",
        method: "POST",
      }),
      invalidatesTags: ["ProfileDisciples"],
    }),

    disciplesRecruit: builder.mutation<
      ApiResponseDto<{ disciples: unknown[]; balance: number }>,
      string
    >({
      query: characterId => ({
        url: "/users/profile/disciples/recruit",
        method: "POST",
        body: { characterId },
      }),
      invalidatesTags: ["ProfileDisciples"],
    }),

    /** Обменять дубля кандидата на ресурсы (монеты). Кандидат сбрасывается. */
    disciplesClaimDuplicateReward: builder.mutation<
      ApiResponseDto<{ balance: number; coinsGained?: number }>,
      string
    >({
      query: characterId => ({
        url: "/users/profile/disciples/claim-duplicate-reward",
        method: "POST",
        body: { characterId },
      }),
      invalidatesTags: ["ProfileDisciples"],
    }),

    disciplesDismiss: builder.mutation<ApiResponseDto<{ ok: boolean }>, string>({
      query: characterId => ({
        url: "/users/profile/disciples/dismiss",
        method: "POST",
        body: { characterId },
      }),
      invalidatesTags: ["ProfileDisciples"],
    }),

    disciplesTrain: builder.mutation<
      ApiResponseDto<{ disciple: unknown; balance: number; outcome: "success" | "fail" }>,
      string
    >({
      query: characterId => ({
        url: "/users/profile/disciples/train",
        method: "POST",
        body: { characterId },
      }),
      invalidatesTags: ["ProfileDisciples"],
    }),

    disciplesSetPrimary: builder.mutation<
      ApiResponseDto<{ primaryDiscipleCharacterId: string }>,
      { characterId: string }
    >({
      query: body => ({
        url: "/users/profile/disciples/primary",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProfileDisciples"],
    }),

    disciplesSetWarehouse: builder.mutation<
      ApiResponseDto<{ ok: boolean }>,
      { characterId: string; inWarehouse: boolean }
    >({
      query: body => ({
        url: "/users/profile/disciples/warehouse",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProfileDisciples"],
    }),

    getDisciplesGameShop: builder.query<
      ApiResponseDto<{
        offers: Array<
          | {
              offerId: string;
              label: string;
              priceCoins: number;
              kind: "item";
              itemId: string;
              count: number;
            }
          | {
              offerId: string;
              label: string;
              priceCoins: number;
              kind: "library_exp";
              libraryExp: number;
            }
        >;
      }>,
      void
    >({
      query: () => ({ url: "/users/profile/disciples/game-shop" }),
      providesTags: ["DisciplesGameShop"],
    }),

    disciplesGameShopBuy: builder.mutation<
      ApiResponseDto<{
        balance: number;
        purchased: string;
        library?: { level: number; exp: number; expToNext?: number };
      }>,
      { offerId: string }
    >({
      query: body => ({
        url: "/users/profile/disciples/game-shop/buy",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProfileDisciples", "DisciplesGameShop", "ProfileInventory", "Alchemy"],
    }),

    disciplesBattleMatch: builder.query<
      ApiResponseDto<{
        opponent: { userId: string; username: string; avatar?: string; combatRating: number; disciples: unknown[] };
        combatRating: number;
      } | null>,
      void
    >({
      query: () => ({ url: "/users/profile/disciples/battle-match" }),
    }),

    disciplesBattle: builder.mutation<
      ApiResponseDto<{
        win: boolean;
        coinsGained: number;
        expGained?: number;
        resultScreen?: unknown;
        consumedItems?: InventoryEntry[];
        /** Если бэкенд отдаёт — показываем и форсим refetch профиля */
        combatRating?: number;
        combatRatingDelta?: number;
        ratingDelta?: number;
      }>,
      { opponentUserId: string; supportItemIds?: string[] }
    >({
      query: body => ({
        url: "/users/profile/disciples/battle",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProfileDisciples", "ProfileInventory"],
    }),

    /** Weekly PvP: 1 бой в неделю (если реализовано на бэкенде) */
    disciplesWeeklyBattleMatch: builder.query<
      ApiResponseDto<{
        opponent: { userId: string; username: string; avatar?: string; weeklyRating?: number; disciples: unknown[] };
        weekly?: { canWeeklyBattle: boolean; nextWeeklyBattleAt: string | null; weeklyRating?: number; weeklyDivision?: string };
      } | null>,
      void
    >({
      query: () => ({ url: "/users/profile/disciples/weekly-battle-match" }),
    }),

    disciplesWeeklyBattle: builder.mutation<
      ApiResponseDto<{
        win: boolean;
        coinsGained: number;
        expGained?: number;
        weeklyRatingDelta?: number;
        resultScreen?: unknown;
        consumedItems?: InventoryEntry[];
      }>,
      { opponentUserId: string; supportItemIds?: string[] }
    >({
      query: body => ({
        url: "/users/profile/disciples/weekly-battle",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProfileDisciples", "ProfileInventory"],
    }),

    getDisciplesWeeklyLeaderboard: builder.query<
      ApiResponseDto<{ username: string; avatar?: string; weeklyRating: number; weeklyWins: number; weeklyLosses: number }[]>,
      { limit?: number } | void
    >({
      query: (params) => ({
        url: "/users/profile/disciples/weekly-leaderboard",
        params: params?.limit ? { limit: params.limit } : undefined,
      }),
      providesTags: ["ProfileDisciples"],
    }),

    getDiscipleTechniques: builder.query<
      ApiResponseDto<{
        disciples: DiscipleTechniquesEntry[];
        library?: { level: number; exp: number; expToNext: number };
        balance?: number;
      }>,
      void
    >({
      query: () => ({ url: "/users/profile/disciples/techniques" }),
      providesTags: ["ProfileDisciples"],
    }),

    disciplesLearnTechnique: builder.mutation<
      ApiResponseDto<{ ok: boolean; balance: number; learned: string }>,
      { characterId: string; techniqueId: string }
    >({
      query: body => ({
        url: "/users/profile/disciples/techniques/learn",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProfileDisciples"],
    }),

    disciplesEquipTechniques: builder.mutation<
      ApiResponseDto<{ ok: boolean; equipped: string[] }>,
      { characterId: string; techniqueIds: string[] }
    >({
      query: body => ({
        url: "/users/profile/disciples/techniques/equip",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProfileDisciples"],
    }),

    getDisciplesItemExchangeRecipes: builder.query<
      ApiResponseDto<{
        recipes: Array<{
          recipeId: string;
          label: string;
          description?: string;
          canAfford: boolean;
          inputs: Array<{
            itemId: string;
            count: number;
            have: number;
            name?: string;
            icon?: string;
          }>;
          outputs: Array<{
            itemId: string;
            count: number;
            name?: string;
            icon?: string;
          }>;
        }>;
      }>,
      void
    >({
      query: () => ({ url: "/users/profile/disciples/item-exchange/recipes" }),
      providesTags: ["ProfileInventory"],
    }),

    disciplesItemExchange: builder.mutation<
      ApiResponseDto<{ ok: boolean; recipeId: string }>,
      { recipeId: string }
    >({
      query: body => ({
        url: "/users/profile/disciples/item-exchange",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProfileInventory", "ProfileDisciples", "Alchemy"],
    }),

    getDisciplesExpeditionStatus: builder.query<
      ApiResponseDto<{
        canStart: boolean;
        inProgress?: boolean;
        completesAt?: string | null;
        nextExpeditionAt: string | null;
        costs: { easy: number; normal: number; hard: number };
        lastResult: {
          at: string;
          difficulty: string;
          success: boolean;
          coinsGained: number;
          expGained: number;
          itemsGained: { itemId: string; count: number; name?: string; icon?: string }[];
          log: string[];
          ambush?: { happened: boolean; preventedByTalisman: boolean };
        } | null;
        hasDisciples: boolean;
        balance: number;
        ambushRiskPercent?: number;
      }>,
      void
    >({
      query: () => ({ url: "/users/profile/disciples/expedition" }),
      providesTags: ["ProfileDisciples"],
    }),

    disciplesStartExpedition: builder.mutation<
      ApiResponseDto<{
        started: boolean;
        completesAt: string;
        balance: number;
      }>,
      { difficulty: "easy" | "normal" | "hard" }
    >({
      query: body => ({
        url: "/users/profile/disciples/expedition/start",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProfileDisciples", "ProfileInventory"],
    }),

    getAlchemyRecipes: builder.query<
      ApiResponseDto<{ recipes: (AlchemyRecipeEntry & { element?: string | null; mishapChancePercent?: number; effectiveMishapChancePercent?: number })[] }>,
      void
    >({
      query: () => ({ url: "/users/profile/alchemy/recipes" }),
      providesTags: ["Alchemy"],
    }),

    getAlchemyStatus: builder.query<
      ApiResponseDto<{
        canCraft: boolean;
        serverNow: string;
        resetAt: string;
        lastPillCraftedAt: string | null;
        craftsPerDay: number;
        attemptsToday: number;
        attemptsLeft: number;
        alchemyLevel: number;
        alchemyExp: number;
        alchemyExpToNext: number;
        element: string | null;
        cauldronTier: number;
        stabilizers: { itemId: string; count: number };
        cauldronUpgrade: { fragmentItemId: string; have: number; need: number; canUpgrade: boolean };
      }>,
      void
    >({
      query: () => ({ url: "/users/profile/alchemy/status" }),
      providesTags: ["Alchemy"],
    }),

    alchemyCraft: builder.mutation<
      ApiResponseDto<{
        success: boolean;
        quality: "common" | "quality" | "legendary";
        rewards: { exp?: number; coins?: number };
        itemsGained?: { itemId: string; count: number; name?: string; icon?: string }[];
        balance?: number;
        rewardSummary?: {
          type: "coins" | "exp" | "item";
          label: string;
          amount?: number;
          icon?: string;
        }[];
        alchemy?: { level: number; exp: number; expToNext: number; attemptsLeft: number };
        mishap?: { happened: boolean; preventedByStabilizer?: boolean; chancePercent?: number };
      }>,
      string
    >({
      query: recipeId => ({
        url: "/users/profile/alchemy/craft",
        method: "POST",
        body: { recipeId },
      }),
      invalidatesTags: ["Alchemy", "ProfileDisciples", "ProfileInventory"],
    }),

    alchemyUpgradeCauldron: builder.mutation<ApiResponseDto<{ ok: boolean; tier: number }>, void>({
      query: () => ({
        url: "/users/profile/alchemy/cauldron/upgrade",
        method: "POST",
      }),
      invalidatesTags: ["Alchemy"],
    }),

    getAlchemyShop: builder.query<
      ApiResponseDto<{
        assortment: Array<{
          itemId: string;
          count: number;
          priceCoins: number;
          purchased: boolean;
          isDirectPurchase: boolean;
          name?: string;
          icon?: string;
        }>;
        shopDate: string;
        canRefresh: boolean;
        refreshCost: number;
      }>,
      void
    >({
      query: () => ({ url: "/users/profile/alchemy/shop" }),
      providesTags: ["Alchemy"],
    }),

    refreshAlchemyShop: builder.mutation<
      ApiResponseDto<{
        ok: boolean;
        newAssortment: Array<{
          itemId: string;
          count: number;
          priceCoins: number;
          purchased: boolean;
          isDirectPurchase: boolean;
          name?: string;
          icon?: string;
        }>;
        balance: number;
      }>,
      void
    >({
      query: () => ({
        url: "/users/profile/alchemy/shop/refresh",
        method: "POST",
      }),
      invalidatesTags: ["Alchemy"],
    }),

    buyAlchemyItem: builder.mutation<
      ApiResponseDto<{
        ok: boolean;
        itemId: string;
        count: number;
        pricePaid: number;
        balance: number;
        purchased: boolean;
      }>,
      { index: number; directPurchase?: boolean }
    >({
      query: ({ index, directPurchase }) => ({
        url: "/users/profile/alchemy/shop/buy",
        method: "POST",
        body: { index, directPurchase },
      }),
      invalidatesTags: ["Alchemy", "ProfileInventory"],
    }),

    getWheel: builder.query<ApiResponseDto<WheelResponse>, void>({
      query: () => ({ url: "/users/profile/wheel" }),
      providesTags: ["Wheel"],
    }),

    wheelSpin: builder.mutation<
      ApiResponseDto<{
        rewardType: string;
        label: string;
        expGained?: number;
        coinsGained?: number;
        itemsGained?: { itemId: string; count: number; name?: string; icon?: string }[];
        twistOfFate?: boolean;
        compensationCoins?: number;
        balance?: number;
        selectedSegmentIndex?: number;
        nextSpinAt?: string | null;
        rewardSummary?: {
          type: "coins" | "exp" | "item";
          label: string;
          amount?: number;
          icon?: string;
        }[];
      }>,
      void
    >({
      query: () => ({
        url: "/users/profile/wheel/spin",
        method: "POST",
      }),
      invalidatesTags: ["Wheel", "ProfileDisciples", "ProfileInventory"],
    }),
  }),
});

export const {
  useGetProfileInventoryQuery,
  useGetProfileDisciplesQuery,
  useGetProfileCardsQuery,
  useUpgradeProfileCardMutation,
  useUpdateProfileCardsShowcaseMutation,
  useDisciplesRerollMutation,
  useDisciplesRecruitMutation,
  useDisciplesClaimDuplicateRewardMutation,
  useDisciplesDismissMutation,
  useDisciplesTrainMutation,
  useDisciplesSetPrimaryMutation,
  useDisciplesSetWarehouseMutation,
  useGetDisciplesGameShopQuery,
  useDisciplesGameShopBuyMutation,
  useLazyDisciplesBattleMatchQuery,
  useDisciplesBattleMutation,
  useLazyDisciplesWeeklyBattleMatchQuery,
  useDisciplesWeeklyBattleMutation,
  useGetDisciplesWeeklyLeaderboardQuery,
  useGetDiscipleTechniquesQuery,
  useDisciplesLearnTechniqueMutation,
  useDisciplesEquipTechniquesMutation,
  useGetDisciplesItemExchangeRecipesQuery,
  useDisciplesItemExchangeMutation,
  useGetDisciplesExpeditionStatusQuery,
  useDisciplesStartExpeditionMutation,
  useGetAlchemyRecipesQuery,
  useGetAlchemyStatusQuery,
  useAlchemyCraftMutation,
  useAlchemyUpgradeCauldronMutation,
  useGetAlchemyShopQuery,
  useRefreshAlchemyShopMutation,
  useBuyAlchemyItemMutation,
  useGetWheelQuery,
  useWheelSpinMutation,
} = gamesApi;
