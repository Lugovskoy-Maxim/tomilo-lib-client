"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  useListGameItemsQuery,
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
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
  useGetWheelConfigQuery,
  useUpdateWheelConfigMutation,
  type GameItemAdmin,
  useListCharacterCardsQuery,
  useCreateCharacterCardMutation,
  useUpdateCharacterCardMutation,
  useDeleteCharacterCardMutation,
  useListCardDecksQuery,
  useCreateCardDeckMutation,
  useUpdateCardDeckMutation,
  useDeleteCardDeckMutation,
  type CharacterCardAdmin,
  type CharacterCardStageAdmin,
  type AlchemyRecipeAdmin,
} from "@/store/api/gameItemsAdminApi";
import { useGetCharactersQuery } from "@/store/api/charactersApi";
import { useGetTitlesQuery } from "@/store/api/titlesApi";
import type { CardDeck, CardStageRank, GameItemType, GameItemRarity } from "@/types/games";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/utils";
import { AdminCard } from "./ui";
import { GAME_ITEMS_LORE } from "@/constants/gameItemsLore";
import { Gamepad2, Trash2, RefreshCw, BookOpen, Pencil, Plus, X, Coins, Sparkles, Gift, CircleOff, Percent, RotateCcw } from "lucide-react";

const GAME_ITEM_TYPE_LABELS: Record<GameItemType, string> = {
  material: "Материал",
  consumable: "Расходник",
  special: "Особый",
};

const GAME_ITEM_RARITY_LABELS: Record<GameItemRarity, string> = {
  common: "Обычный",
  uncommon: "Необычный",
  rare: "Редкий",
  epic: "Эпический",
  legendary: "Легендарный",
};

/** Цвета редкости: левая граница карточки и бейдж */
const GAME_ITEM_RARITY_STYLES: Record<GameItemRarity, { border: string; badge: string }> = {
  common: { border: "border-l-slate-500", badge: "bg-slate-500/20 text-slate-700 dark:text-slate-300" },
  uncommon: { border: "border-l-green-600", badge: "bg-green-600/20 text-green-800 dark:text-green-300" },
  rare: { border: "border-l-blue-600", badge: "bg-blue-600/20 text-blue-800 dark:text-blue-300" },
  epic: { border: "border-l-violet-600", badge: "bg-violet-600/20 text-violet-800 dark:text-violet-300" },
  legendary: { border: "border-l-amber-500", badge: "bg-amber-500/25 text-amber-900 dark:text-amber-200" },
};

/** Базовые настройки дропа за чтение по редкости (шанс 0–1, макс. дропов/день) */
const READING_DROP_DEFAULTS_BY_RARITY: Record<GameItemRarity, { chance: number; minChaptersToday: number; maxDropsPerDay: number }> = {
  common: { chance: 0.12, minChaptersToday: 1, maxDropsPerDay: 5 },
  uncommon: { chance: 0.07, minChaptersToday: 1, maxDropsPerDay: 3 },
  rare: { chance: 0.04, minChaptersToday: 2, maxDropsPerDay: 2 },
  epic: { chance: 0.02, minChaptersToday: 3, maxDropsPerDay: 1 },
  legendary: { chance: 0.01, minChaptersToday: 5, maxDropsPerDay: 1 },
};

const CARD_STAGE_RANKS: CardStageRank[] = ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"];

const WHEEL_REWARD_TYPE_LABELS: Record<string, string> = {
  coins: "Монеты",
  xp: "Опыт",
  item: "Предмет",
  empty: "Пусто",
  element_bonus: "Бонус стихии",
};

const createEmptyWheelSegment = (rewardType: "coins" | "xp" | "item" | "empty" | "element_bonus" = "coins") => ({
  rewardType,
  label:
    rewardType === "coins"
      ? "Монеты"
      : rewardType === "xp"
        ? "Опыт"
        : rewardType === "item"
          ? "Предмет"
          : rewardType === "empty"
            ? "Пусто"
            : "Бонус стихии",
  weight: rewardType === "empty" ? 5 : 10,
  paramType: rewardType === "item" ? "item" as const : "number" as const,
  paramNumber: rewardType === "coins" ? "10" : rewardType === "xp" ? "5" : rewardType === "element_bonus" ? "5" : "0",
  itemId: "",
  itemCount: "1",
});

const createEmptyCardStages = (): CharacterCardStageAdmin[] =>
  CARD_STAGE_RANKS.map((rank, index) => ({
    rank,
    imageUrl: "",
    requiredLevel: Math.max(1, 1 + index * 4),
    upgradeCoins: index === 0 ? 0 : index * 20,
    upgradeItemId: "",
    upgradeItemCount: 0,
    upgradeSuccessChance: 1,
  }));

type GamesSubTab =
  | "items"
  | "drops-reading"
  | "drops-quest"
  | "rewards-lb"
  | "config-disciples"
  | "cards"
  | "card-decks"
  | "recipes"
  | "config-wheel"
  | "grant"
  | "user-data";

export function GamesManagementSection() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [subTab, setSubTab] = useState<GamesSubTab>("items");
  const [grantUserId, setGrantUserId] = useState("");
  const [grantItemId, setGrantItemId] = useState("");
  const [grantCount, setGrantCount] = useState(1);
  const [userDataUserId, setUserDataUserId] = useState("");
  const [inventoryEdit, setInventoryEdit] = useState<{ itemId: string; count: number }[]>([]);
  const [newItem, setNewItem] = useState({ id: "", name: "", type: "material" as GameItemType, rarity: "common" as GameItemRarity, description: "", icon: "" });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!iconFile) {
      if (iconPreviewUrl) {
        URL.revokeObjectURL(iconPreviewUrl);
        setIconPreviewUrl(null);
      }
      return;
    }
    const url = URL.createObjectURL(iconFile);
    setIconPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [iconFile]);
  const [newDrop, setNewDrop] = useState({ itemId: "", chance: 0.05, minChaptersToday: 1, maxDropsPerDay: 3 });
  const [editingQuestRewardId, setEditingQuestRewardId] = useState<string | null>(null);
  const [questRewardForm, setQuestRewardForm] = useState({
    questType: "read_chapters",
    itemId: "",
    countMin: 1,
    countMax: 1,
    chance: 0.5,
    sortOrder: 0,
    isActive: true,
  });
  const [editingLbRewardId, setEditingLbRewardId] = useState<string | null>(null);
  const [lbRewardForm, setLbRewardForm] = useState({
    category: "weekly_pvp",
    period: "weekly",
    rankMin: 1,
    rankMax: 1,
    itemId: "",
    itemCount: 1,
    coins: 0,
    isActive: true,
  });
  const [disciplesForm, setDisciplesForm] = useState({ rerollCostCoins: 50, trainCostCoins: 15, maxDisciples: 5, maxBattlesPerDay: 5, rerollCandidateTtlMinutes: 10 });
  const [recipeEditingId, setRecipeEditingId] = useState<string | null>(null);
  const [recipeForm, setRecipeForm] = useState<{
    name: string;
    description: string;
    icon: string;
    coinCost: number;
    resultType: string;
    element: "" | "fire" | "water" | "earth" | "wood" | "metal";
    mishapChancePercent: number;
    sortOrder: number;
    isActive: boolean;
    ingredients: { itemId: string; count: number }[];
    qualityWeights: { common: number; quality: number; legendary: number };
  }>({
    name: "",
    description: "",
    icon: "",
    coinCost: 0,
    resultType: "pill_common",
    element: "",
    mishapChancePercent: 8,
    sortOrder: 0,
    isActive: true,
    ingredients: [{ itemId: "", count: 1 }],
    qualityWeights: { common: 70, quality: 25, legendary: 5 },
  });
  const [wheelForm, setWheelForm] = useState({
    spinCostCoins: 20,
    segments: [] as {
      rewardType: string;
      label: string;
      weight: number;
      paramType: "number" | "item";
      paramNumber: string;
      itemId: string;
      itemCount: string;
    }[],
  });
  const [editingCharacterCardId, setEditingCharacterCardId] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState<{
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    rarity: string;
    isAvailable: boolean;
    quantity: string;
    characterId: string;
    stages: CharacterCardStageAdmin[];
  }>({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    rarity: "common",
    isAvailable: true,
    quantity: "",
    characterId: "",
    stages: createEmptyCardStages(),
  });
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [deckForm, setDeckForm] = useState<{
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    quantity: string;
    titleId: string;
    cardsPerOpen: number;
    titleFocusChance: number;
    pityThreshold: number;
    pityTargetRarity: string;
    isAvailable: boolean;
  }>({
    name: "",
    description: "",
    imageUrl: "",
    price: 0,
    quantity: "",
    titleId: "",
    cardsPerOpen: 3,
    titleFocusChance: 0.75,
    pityThreshold: 8,
    pityTargetRarity: "rare",
    isAvailable: true,
  });

  const { data: itemsData, isLoading: itemsLoading, isError: itemsError, refetch: refetchItems } = useListGameItemsQuery({ page: 1, limit: 100 });
  const [uploadIcon, { isLoading: isUploadingIcon }] = useUploadGameItemIconMutation();
  const [createItem, { isLoading: isCreatingItem }] = useCreateGameItemMutation();
  const [updateItem, { isLoading: isUpdatingItem }] = useUpdateGameItemMutation();
  const [deleteItem] = useDeleteGameItemMutation();
  const [grantItem] = useGrantItemMutation();
  const items = Array.isArray(itemsData?.data?.items) ? itemsData.data.items : [];
  const [itemsFilterType, setItemsFilterType] = useState<GameItemType | "">("");
  const [itemsFilterRarity, setItemsFilterRarity] = useState<GameItemRarity | "">("");
  const filteredItems = useMemo(() => {
    return items.filter((item: GameItemAdmin) => {
      if (itemsFilterType && item.type !== itemsFilterType) return false;
      if (itemsFilterRarity && item.rarity !== itemsFilterRarity) return false;
      return true;
    });
  }, [items, itemsFilterType, itemsFilterRarity]);
  const [isSeedingLore, setIsSeedingLore] = useState(false);
  const [isCreateItemFormOpen, setIsCreateItemFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; type: GameItemType; rarity: GameItemRarity; description: string; icon: string }>({ name: "", type: "material", rarity: "common", description: "", icon: "" });
  const [editIconFile, setEditIconFile] = useState<File | null>(null);
  const [editIconPreviewUrl, setEditIconPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!editIconFile) {
      if (editIconPreviewUrl) {
        URL.revokeObjectURL(editIconPreviewUrl);
        setEditIconPreviewUrl(null);
      }
      return;
    }
    const url = URL.createObjectURL(editIconFile);
    setEditIconPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [editIconFile]);

  const { data: userGameData, isError: userGameDataError, refetch: refetchUserGameData } = useGetUserGameDataQuery(userDataUserId, { skip: !userDataUserId });
  const [setInventory] = useSetUserInventoryMutation();

  const { data: readingDropsData, isError: dropsError, refetch: refetchDrops } = useListReadingDropsQuery();
  const [createReadingDrop, { isLoading: isCreatingDrop }] = useCreateReadingDropMutation();
  const [updateReadingDrop] = useUpdateReadingDropMutation();
  const [deleteReadingDrop] = useDeleteReadingDropMutation();
  const readingRules = Array.isArray(readingDropsData?.data?.rules) ? readingDropsData.data.rules : [];
  const [isAddingMissingDrops, setIsAddingMissingDrops] = useState(false);

  const { data: questRewardsData, isError: questRewardsError, refetch: refetchQuestRewards } = useListDailyQuestRewardsQuery();
  const [createQuestReward, { isLoading: isSavingQuestReward }] = useCreateDailyQuestRewardMutation();
  const [updateQuestReward] = useUpdateDailyQuestRewardMutation();
  const [deleteQuestReward] = useDeleteDailyQuestRewardMutation();
  const questRewards = Array.isArray(questRewardsData?.data?.rewards) ? questRewardsData.data.rewards : [];

  const { data: lbRewardsData, isError: lbError, refetch: refetchLb } = useListLeaderboardRewardsQuery({});
  const [createLbReward, { isLoading: isSavingLbReward }] = useCreateLeaderboardRewardMutation();
  const [updateLbReward] = useUpdateLeaderboardRewardMutation();
  const [deleteLbReward] = useDeleteLeaderboardRewardMutation();
  const lbRewards = Array.isArray(lbRewardsData?.data?.rewards) ? lbRewardsData.data.rewards : [];

  const { data: disciplesConfigData, isError: disciplesConfigError, refetch: refetchDisciplesConfig } = useGetDisciplesConfigQuery();
  const disciplesConfig = disciplesConfigData?.data;
  const [updateDisciplesConfig, { isLoading: isSavingDisciples }] = useUpdateDisciplesConfigMutation();

  const { data: recipesData, isError: recipesError, refetch: refetchRecipes } = useListRecipesQuery();
  const recipes = Array.isArray(recipesData?.data?.recipes) ? recipesData.data.recipes : [];
  const [createRecipe, { isLoading: isSavingRecipe }] = useCreateRecipeMutation();
  const [updateRecipe] = useUpdateRecipeMutation();
  const [deleteRecipe] = useDeleteRecipeMutation();

  const { data: wheelData, isError: wheelConfigError, refetch: refetchWheelConfig } = useGetWheelConfigQuery();
  const wheelConfig = wheelData?.data;
  const [updateWheelConfig, { isLoading: isSavingWheel }] = useUpdateWheelConfigMutation();
  const { data: charactersData } = useGetCharactersQuery({ page: 1, limit: 200 });
  const characters = Array.isArray(charactersData?.characters) ? charactersData.characters : [];
  const { data: characterCardsData, refetch: refetchCharacterCards } = useListCharacterCardsQuery();
  const characterCards = Array.isArray(characterCardsData?.data?.cards) ? characterCardsData.data.cards : [];
  const [createCharacterCard, { isLoading: isCreatingCharacterCard }] = useCreateCharacterCardMutation();
  const [updateCharacterCard, { isLoading: isUpdatingCharacterCard }] = useUpdateCharacterCardMutation();
  const [deleteCharacterCard] = useDeleteCharacterCardMutation();
  const { data: cardDecksData, refetch: refetchCardDecks } = useListCardDecksQuery();
  const cardDecks = Array.isArray(cardDecksData?.data?.decks) ? cardDecksData.data.decks : [];
  const [createCardDeck, { isLoading: isCreatingDeck }] = useCreateCardDeckMutation();
  const [updateCardDeck, { isLoading: isUpdatingDeck }] = useUpdateCardDeckMutation();
  const [deleteCardDeck] = useDeleteCardDeckMutation();
  const { data: titlesData } = useGetTitlesQuery();
  const titleOptions = Array.isArray(titlesData?.data?.titles) ? titlesData.data.titles : [];
  const titleNameById = useMemo(
    () =>
      new Map(
        titleOptions.map((title) => {
          const rawTitle = title as { _id?: string; id?: string; title?: string; name?: string };
          return [
            String(rawTitle._id ?? rawTitle.id ?? ""),
            String(rawTitle.title ?? rawTitle.name ?? ""),
          ];
        }),
      ),
    [titleOptions],
  );

  useEffect(() => {
    const gamesTab = searchParams.get("gamesTab");
    const presetCharacterId = searchParams.get("characterId");
    const presetCharacterName = searchParams.get("characterName");

    if (gamesTab === "cards") {
      setSubTab("cards");
    }

    if (!presetCharacterId) return;

    setCardForm(prev => ({
      ...prev,
      characterId: presetCharacterId,
      name: prev.name || presetCharacterName || prev.name,
    }));
  }, [searchParams]);

  useEffect(() => {
    if (disciplesConfig) {
      setDisciplesForm({
        rerollCostCoins: disciplesConfig.rerollCostCoins ?? 50,
        trainCostCoins: disciplesConfig.trainCostCoins ?? 15,
        maxDisciples: disciplesConfig.maxDisciples ?? 5,
        maxBattlesPerDay: disciplesConfig.maxBattlesPerDay ?? 5,
        rerollCandidateTtlMinutes: disciplesConfig.rerollCandidateTtlMinutes ?? 10,
      });
    }
  }, [disciplesConfig]);
  useEffect(() => {
    if (wheelConfig) {
      setWheelForm({
        spinCostCoins: wheelConfig.spinCostCoins ?? 20,
        segments: (wheelConfig.segments ?? []).map(segment => ({
          rewardType: segment.rewardType ?? "coins",
          label: segment.label ?? "",
          weight: Number(segment.weight ?? 1),
          paramType:
            segment.rewardType === "item" &&
            segment.param &&
            typeof segment.param === "object" &&
            "itemId" in segment.param
              ? "item"
              : "number",
          paramNumber:
            typeof segment.param === "number"
              ? String(segment.param)
              : segment.rewardType === "coins" || segment.rewardType === "xp"
                ? String(Number((segment.param as number | undefined) ?? 0))
                : "",
          itemId:
            segment.rewardType === "item" &&
            segment.param &&
            typeof segment.param === "object" &&
            "itemId" in segment.param
              ? String(segment.param.itemId ?? "")
              : "",
          itemCount:
            segment.rewardType === "item" &&
            segment.param &&
            typeof segment.param === "object" &&
            "count" in segment.param
              ? String(segment.param.count ?? 1)
              : "1",
        })),
      });
    }
  }, [wheelConfig]);

  const anyApiError = itemsError || dropsError || questRewardsError || lbError || disciplesConfigError || recipesError || wheelConfigError;
  const refetchAll = () => {
    refetchItems();
    refetchDrops();
    refetchQuestRewards();
    refetchLb();
    refetchDisciplesConfig();
    refetchRecipes();
    refetchWheelConfig();
    refetchCharacterCards();
    refetchCardDecks();
  };

  const resetCardForm = () => {
    setEditingCharacterCardId(null);
    setCardForm({
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      rarity: "common",
      isAvailable: true,
      quantity: "",
      characterId: "",
      stages: createEmptyCardStages(),
    });
  };

  const resetDeckForm = () => {
    setEditingDeckId(null);
    setDeckForm({
      name: "",
      description: "",
      imageUrl: "",
      price: 0,
      quantity: "",
      titleId: "",
      cardsPerOpen: 3,
      titleFocusChance: 0.75,
      pityThreshold: 8,
      pityTargetRarity: "rare",
      isAvailable: true,
    });
  };

  const resetQuestRewardForm = () => {
    setEditingQuestRewardId(null);
    setQuestRewardForm({
      questType: "read_chapters",
      itemId: "",
      countMin: 1,
      countMax: 1,
      chance: 0.5,
      sortOrder: 0,
      isActive: true,
    });
  };

  const resetLbRewardForm = () => {
    setEditingLbRewardId(null);
    setLbRewardForm({
      category: "weekly_pvp",
      period: "weekly",
      rankMin: 1,
      rankMax: 1,
      itemId: "",
      itemCount: 1,
      coins: 0,
      isActive: true,
    });
  };

  const resetRecipeForm = () => {
    setRecipeEditingId(null);
    setRecipeForm({
      name: "",
      description: "",
      icon: "",
      coinCost: 0,
      resultType: "pill_common",
      element: "",
      mishapChancePercent: 8,
      sortOrder: 0,
      isActive: true,
      ingredients: [{ itemId: "", count: 1 }],
      qualityWeights: { common: 70, quality: 25, legendary: 5 },
    });
  };

  const uploadStageImage = async (rank: CardStageRank, file: File) => {
    const res = await uploadIcon(file).unwrap();
    const url = res?.data?.url ?? "";
    setCardForm(prev => ({
      ...prev,
      imageUrl: rank === "F" && !prev.imageUrl ? url : prev.imageUrl,
      stages: prev.stages.map(stage => stage.rank === rank ? { ...stage, imageUrl: url } : stage),
    }));
    toast.success(`Изображение для ранга ${rank} загружено`);
  };

  const subTabs: { id: GamesSubTab; label: string }[] = [
    { id: "items", label: "Предметы" },
    { id: "drops-reading", label: "Дропы за чтение" },
    { id: "drops-quest", label: "Награды квестов" },
    { id: "rewards-lb", label: "Награды лидерборда" },
    { id: "config-disciples", label: "Конфиг учеников" },
    { id: "cards", label: "Карточки" },
    { id: "card-decks", label: "Колоды" },
    { id: "recipes", label: "Рецепты алхимии" },
    { id: "config-wheel", label: "Колесо судьбы" },
    { id: "grant", label: "Выдать предмет" },
    { id: "user-data", label: "Игровые данные пользователя" },
  ];

  const wheelTotalWeight = useMemo(
    () => wheelForm.segments.reduce((sum, segment) => sum + Math.max(0, Number(segment.weight) || 0), 0),
    [wheelForm.segments],
  );

  const wheelValidationError = useMemo(() => {
    if (wheelForm.segments.length === 0) return "Добавьте хотя бы один сегмент.";
    for (const [index, segment] of wheelForm.segments.entries()) {
      if (!segment.label.trim()) return `Сегмент #${index + 1}: укажите подпись.`;
      if ((Number(segment.weight) || 0) <= 0) return `Сегмент #${index + 1}: вес должен быть больше 0.`;
      if (segment.rewardType === "item" && !segment.itemId) return `Сегмент #${index + 1}: выберите предмет.`;
    }
    return null;
  }, [wheelForm.segments]);

  return (
    <div className="space-y-6">
      {anyApiError && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-red-600 dark:text-red-400 text-sm">
            Не удалось загрузить данные мини-игр. Проверьте, что бэкенд доступен по адресу API и вы авторизованы как администратор.
          </p>
          <button type="button" onClick={refetchAll} className="admin-btn admin-btn-secondary inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Повторить
          </button>
        </div>
      )}
      <AdminCard title="Мини-игры" icon={<Gamepad2 className="w-5 h-5" />}>
        <div className="flex flex-wrap gap-2 mb-4">
          {subTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                subTab === t.id ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {subTab === "items" && (
          <div className="space-y-4">
            {!isCreateItemFormOpen ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateItemFormOpen(true)}
                  className="admin-btn admin-btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" aria-hidden />
                  Добавить предмет
                </button>
                <button
                  type="button"
                  disabled={isSeedingLore || itemsLoading}
                  className="admin-btn admin-btn-secondary inline-flex items-center gap-2"
                  onClick={async () => {
                    setIsSeedingLore(true);
                    const existingIds = new Set(items.map((i: GameItemAdmin) => i.id));
                    let created = 0;
                    let skipped = 0;
                    for (const entry of GAME_ITEMS_LORE) {
                      if (existingIds.has(entry.id)) {
                        skipped++;
                        continue;
                      }
                      try {
                        await createItem({
                          id: entry.id,
                          name: entry.name,
                          type: entry.type,
                          rarity: entry.rarity,
                          description: entry.description ?? undefined,
                          icon: undefined,
                        }).unwrap();
                        existingIds.add(entry.id);
                        created++;
                      } catch (e) {
                        const msg = getErrorMessage(e, "");
                        if (msg.toLowerCase().includes("уже") || msg.toLowerCase().includes("exists") || msg.toLowerCase().includes("duplicate")) {
                          skipped++;
                          existingIds.add(entry.id);
                        } else {
                          toast.error(`${entry.name}: ${msg}`);
                        }
                      }
                    }
                    await refetchItems();
                    setIsSeedingLore(false);
                    if (created > 0) toast.success(`Добавлено примеров: ${created}${skipped > 0 ? `, пропущено (уже есть): ${skipped}` : ""}`);
                    else if (skipped === GAME_ITEMS_LORE.length) toast.info("Все примеры уже есть на сервере");
                  }}
                >
                  <BookOpen className="w-4 h-4" aria-hidden />
                  {isSeedingLore ? "Добавление…" : "Создать примеры из лора (без картинок)"}
                </button>
              </div>
            ) : (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Создать предмет</h4>
                <button
                  type="button"
                  onClick={() => setIsCreateItemFormOpen(false)}
                  className="p-1.5 rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  title="Закрыть"
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">ID (латиница, подчёркивания)</label>
                  <input type="text" value={newItem.id} onChange={(e) => setNewItem(prev => ({ ...prev, id: e.target.value }))} placeholder="mysterious_fragment" className="admin-input w-full" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Название</label>
                  <input type="text" value={newItem.name} onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))} placeholder="Таинственный осколок" className="admin-input w-full" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Тип</label>
                  <select value={newItem.type} onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value as GameItemType }))} className="admin-input w-full">
                    {(Object.entries(GAME_ITEM_TYPE_LABELS) as [GameItemType, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Редкость</label>
                  <select value={newItem.rarity} onChange={(e) => setNewItem(prev => ({ ...prev, rarity: e.target.value as GameItemRarity }))} className="admin-input w-full">
                    {(Object.entries(GAME_ITEM_RARITY_LABELS) as [GameItemRarity, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Описание (необяз.)</label>
                  <input type="text" value={newItem.description} onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))} className="admin-input w-full" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Картинка (загрузить на сервер)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="admin-input w-full file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[var(--primary)] file:text-[var(--primary-foreground)]"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setIconFile(f ?? null);
                      if (!f) setNewItem((prev) => ({ ...prev, icon: "" }));
                    }}
                  />
                  {(iconPreviewUrl || newItem.icon) && (
                    <img
                      src={iconPreviewUrl || newItem.icon}
                      alt=""
                      className="mt-1 h-16 w-16 object-contain rounded border border-[var(--border)]"
                    />
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={!newItem.id.trim() || !newItem.name.trim() || isCreatingItem || isUploadingIcon}
                className="admin-btn admin-btn-primary mt-3"
                onClick={async () => {
                  try {
                    let iconUrl: string | undefined = newItem.icon || undefined;
                    if (iconFile) {
                      const res = await uploadIcon(iconFile).unwrap();
                      iconUrl = res?.data?.url;
                    }
                    await createItem({ id: newItem.id.trim(), name: newItem.name.trim(), type: newItem.type, rarity: newItem.rarity, description: newItem.description || undefined, icon: iconUrl }).unwrap();
                    toast.success("Предмет создан");
                    setNewItem({ id: "", name: "", type: "material", rarity: "common", description: "", icon: "" });
                    setIconFile(null);
                    setIsCreateItemFormOpen(false);
                    refetchItems();
                  } catch (e) {
                    toast.error(getErrorMessage(e, "Ошибка создания предмета"));
                  }
                }}
              >
                {isUploadingIcon ? "Загрузка картинки…" : isCreatingItem ? "Создание…" : "Создать предмет"}
              </button>
            </div>
            )}
            {editingItemId && (() => {
              const item = items.find((i: GameItemAdmin) => i.id === editingItemId);
              if (!item) return null;
              return (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                  <h4 className="text-sm font-semibold mb-3">Редактировать: {item.id}</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">Название</label>
                      <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="admin-input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">Тип</label>
                      <select value={editForm.type} onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as GameItemType }))} className="admin-input w-full">
                        {(Object.entries(GAME_ITEM_TYPE_LABELS) as [GameItemType, string][]).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">Редкость</label>
                      <select value={editForm.rarity} onChange={(e) => setEditForm((f) => ({ ...f, rarity: e.target.value as GameItemRarity }))} className="admin-input w-full">
                        {(Object.entries(GAME_ITEM_RARITY_LABELS) as [GameItemRarity, string][]).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">Описание (необяз.)</label>
                      <input type="text" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="admin-input w-full" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">Картинка (заменить)</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="admin-input w-full file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[var(--primary)] file:text-[var(--primary-foreground)]"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          setEditIconFile(f ?? null);
                        }}
                      />
                      {(editIconPreviewUrl || editForm.icon) && (
                        <img src={editIconPreviewUrl || editForm.icon} alt="" className="mt-1 h-16 w-16 object-contain rounded border border-[var(--border)]" />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      disabled={!editForm.name.trim() || isUpdatingItem || isUploadingIcon}
                      className="admin-btn admin-btn-primary"
                      onClick={async () => {
                        try {
                          let iconUrl: string | undefined = editForm.icon || undefined;
                          if (editIconFile) {
                            const res = await uploadIcon(editIconFile).unwrap();
                            iconUrl = res?.data?.url;
                          }
                          await updateItem({
                            id: editingItemId,
                            body: { name: editForm.name.trim(), type: editForm.type, rarity: editForm.rarity, description: editForm.description || undefined, icon: iconUrl },
                          }).unwrap();
                          toast.success("Предмет обновлён");
                          setEditingItemId(null);
                          setEditIconFile(null);
                          refetchItems();
                        } catch (e) {
                          toast.error(getErrorMessage(e, "Ошибка обновления предмета"));
                        }
                      }}
                    >
                      {isUploadingIcon ? "Загрузка…" : isUpdatingItem ? "Сохранение…" : "Сохранить"}
                    </button>
                    <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setEditingItemId(null); setEditIconFile(null); }}>
                      Отмена
                    </button>
                  </div>
                </div>
              );
            })()}

            {itemsLoading ? (
              <p className="text-sm text-[var(--muted-foreground)]">Загрузка предметов...</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-sm text-[var(--muted-foreground)]">Всего: {items.length}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-[var(--muted-foreground)]">Тип:</label>
                    <select
                      value={itemsFilterType}
                      onChange={(e) => setItemsFilterType((e.target.value || "") as GameItemType | "")}
                      className="admin-input text-sm py-1.5 pr-7"
                    >
                      <option value="">Все</option>
                      {(Object.entries(GAME_ITEM_TYPE_LABELS) as [GameItemType, string][]).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-[var(--muted-foreground)]">Редкость:</label>
                    <select
                      value={itemsFilterRarity}
                      onChange={(e) => setItemsFilterRarity((e.target.value || "") as GameItemRarity | "")}
                      className="admin-input text-sm py-1.5 pr-7"
                    >
                      <option value="">Все</option>
                      {(Object.entries(GAME_ITEM_RARITY_LABELS) as [GameItemRarity, string][]).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  {(itemsFilterType || itemsFilterRarity) && (
                    <span className="text-xs text-[var(--muted-foreground)]">Показано: {filteredItems.length}</span>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map((item: GameItemAdmin) => {
                    const rarity = (item.rarity as GameItemRarity) || "common";
                    const styles = GAME_ITEM_RARITY_STYLES[rarity] ?? GAME_ITEM_RARITY_STYLES.common;
                    return (
                    <div
                      key={item.id}
                      className={`rounded-lg border border-[var(--border)] border-l-4 ${styles.border} bg-[var(--card)] flex min-h-[100px] overflow-hidden`}
                    >
                      <div className="shrink-0 h-full aspect-square min-w-0 rounded-l-lg border-r border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-center overflow-hidden">
                        {item.icon ? (
                          <img src={item.icon} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-[var(--muted-foreground)] text-center px-0.5">нет</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col p-3">
                        <div className="font-semibold text-sm truncate" title={item.name}>{item.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)] truncate" title={item.id}>{item.id}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                            {GAME_ITEM_TYPE_LABELS[item.type as GameItemType] ?? item.type}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${styles.badge}`}>
                            {GAME_ITEM_RARITY_LABELS[rarity] ?? item.rarity}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2 flex-1 min-h-0" title={item.description}>{item.description}</p>
                        )}
                        <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-[var(--border)]">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItemId(item.id);
                            setEditForm({
                              name: item.name,
                              type: (item.type as GameItemType) || "material",
                              rarity: (item.rarity as GameItemRarity) || "common",
                              description: item.description ?? "",
                              icon: item.icon ?? "",
                            });
                            setEditIconFile(null);
                          }}
                          className="p-1.5 rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                          title="Редактировать"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await deleteItem(item.id).unwrap();
                              toast.success("Предмет отключён");
                              refetchItems();
                            } catch (e) {
                              toast.error(getErrorMessage(e, "Ошибка отключения предмета"));
                            }
                          }}
                          className="p-1.5 rounded text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {subTab === "grant" && (
          <div className="max-w-md space-y-3">
            <input type="text" placeholder="User ID" value={grantUserId} onChange={(e) => setGrantUserId(e.target.value)} className="admin-input w-full" />
            <select value={grantItemId} onChange={(e) => setGrantItemId(e.target.value)} className="admin-input w-full">
              <option value="">— Выберите предмет —</option>
              {items.map((i: GameItemAdmin) => <option key={i.id} value={i.id}>{i.name} ({i.id})</option>)}
            </select>
            <input type="number" min={1} value={grantCount} onChange={(e) => setGrantCount(Number(e.target.value) || 1)} className="admin-input w-full" />
            <button
              type="button"
              onClick={async () => {
                if (!grantUserId || !grantItemId) return;
                try {
                  await grantItem({ userId: grantUserId, itemId: grantItemId, count: grantCount }).unwrap();
                  toast.success("Предмет выдан");
                  refetchItems();
                } catch (e) {
                  toast.error(getErrorMessage(e, "Ошибка выдачи предмета"));
                }
              }}
              className="admin-btn admin-btn-primary"
            >
              Выдать
            </button>
          </div>
        )}

        {subTab === "user-data" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input type="text" placeholder="User ID" value={userDataUserId} onChange={(e) => setUserDataUserId(e.target.value)} className="admin-input flex-1" />
              <button type="button" onClick={() => refetchUserGameData()} className="admin-btn admin-btn-secondary">Загрузить</button>
            </div>
            {userDataUserId && userGameDataError && (
              <p className="text-sm text-red-600 dark:text-red-400">Не удалось загрузить данные пользователя. Проверьте ID и права доступа.</p>
            )}
            {userGameData?.data && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
                <p><strong>Инвентарь</strong> ({userGameData.data.inventory?.length ?? 0})</p>
                <ul className="text-sm space-y-1">
                  {(userGameData.data.inventory ?? []).map((e: { itemId: string; count: number; name?: string }, i: number) => (
                    <li key={i}>{e.name ?? e.itemId} × {e.count}</li>
                  ))}
                </ul>
                <p><strong>Достижения</strong>: {userGameData.data.achievements?.length ?? 0}</p>
                <p><strong>Ученики</strong>: {userGameData.data.disciples?.length ?? 0}, рейтинг {userGameData.data.combatRating}</p>
                <div>
                  <label className="text-sm block mb-1">Установить инвентарь (JSON массив {`{ itemId, count }`})</label>
                  <textarea
                    className="admin-input w-full h-24 font-mono text-sm"
                    value={JSON.stringify(inventoryEdit.length ? inventoryEdit : (userGameData.data.inventory ?? []).map((e: { itemId: string; count: number }) => ({ itemId: e.itemId, count: e.count })), null, 2)}
                    onChange={(e) => { try { setInventoryEdit(JSON.parse(e.target.value)); } catch {} }}
                  />
                  <button
                    type="button"
                    className="admin-btn-primary mt-2"
                    onClick={async () => {
                      try {
                        const list = inventoryEdit.length ? inventoryEdit : (userGameData.data.inventory ?? []).map((e: { itemId: string; count: number }) => ({ itemId: e.itemId, count: e.count }));
                        await setInventory({ userId: userDataUserId, items: list }).unwrap();
                        toast.success("Инвентарь обновлён");
                        refetchUserGameData();
                      } catch (e) {
                        toast.error(getErrorMessage(e, "Ошибка сохранения инвентаря"));
                      }
                    }}
                  >
                    Сохранить инвентарь
                  </button>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">Достижения: выдача/снятие во вкладке «Достижения» (grant/revoke по userId).</p>
              </div>
            )}
          </div>
        )}

        {subTab === "drops-reading" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={itemsLoading || isAddingMissingDrops || items.length === 0}
                className="admin-btn admin-btn-primary"
                onClick={async () => {
                  const itemsById = new Map(items.map((i: GameItemAdmin) => [i.id, i]));
                  const existingItemIds = new Set(readingRules.map((r: { itemId: string }) => r.itemId));
                  const missing = items.filter((i: GameItemAdmin) => !existingItemIds.has(i.id));
                  if (readingRules.length === 0 && missing.length === 0) {
                    toast.info("Нет предметов и правил для настройки");
                    return;
                  }
                  setIsAddingMissingDrops(true);
                  let updated = 0;
                  let added = 0;
                  let failed = 0;
                  for (const r of readingRules as { _id: string; itemId: string }[]) {
                    const item = itemsById.get(r.itemId);
                    const rarity = (item?.rarity as GameItemRarity) || "common";
                    const def = READING_DROP_DEFAULTS_BY_RARITY[rarity] ?? READING_DROP_DEFAULTS_BY_RARITY.common;
                    try {
                      await updateReadingDrop({
                        id: String(r._id),
                        body: {
                          chance: def.chance,
                          minChaptersToday: def.minChaptersToday,
                          maxDropsPerDay: def.maxDropsPerDay,
                        },
                      }).unwrap();
                      updated++;
                    } catch (e) {
                      failed++;
                      toast.error(getErrorMessage(e, `Ошибка обновления ${r.itemId}`));
                    }
                  }
                  for (const item of missing) {
                    const rarity = (item.rarity as GameItemRarity) || "common";
                    const def = READING_DROP_DEFAULTS_BY_RARITY[rarity] ?? READING_DROP_DEFAULTS_BY_RARITY.common;
                    try {
                      await createReadingDrop({
                        itemId: item.id,
                        chance: def.chance,
                        minChaptersToday: def.minChaptersToday,
                        maxDropsPerDay: def.maxDropsPerDay,
                      }).unwrap();
                      added++;
                    } catch (e) {
                      failed++;
                      toast.error(getErrorMessage(e, `Ошибка для ${item.name}`));
                    }
                  }
                  await refetchDrops();
                  setIsAddingMissingDrops(false);
                  if (updated > 0 || added > 0) {
                    const parts = [];
                    if (updated > 0) parts.push(`обновлено: ${updated}`);
                    if (added > 0) parts.push(`добавлено: ${added}`);
                    toast.success(parts.join(", ") + (failed > 0 ? `; ошибок: ${failed}` : ""));
                  }
                }}
              >
                {isAddingMissingDrops ? "Настройка…" : "Настроить дропы по редкости"}
              </button>
              <span className="text-xs text-[var(--muted-foreground)]">
                Обновит шансы и лимиты у всех правил по редкости; добавит правила для предметов без дропа.
              </span>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <h4 className="text-sm font-semibold mb-3">Добавить правило дропа за чтение</h4>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Предмет</label>
                  <select value={newDrop.itemId} onChange={(e) => setNewDrop(prev => ({ ...prev, itemId: e.target.value }))} className="admin-input min-w-[180px]">
                    <option value="">— Выберите —</option>
                    {items.map((i: GameItemAdmin) => <option key={i.id} value={i.id}>{i.name} ({i.id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Шанс (0–1)</label>
                  <input type="number" min={0} max={1} step={0.01} value={newDrop.chance} onChange={(e) => setNewDrop(prev => ({ ...prev, chance: Number(e.target.value) || 0 }))} className="admin-input w-24" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Мин. глав сегодня</label>
                  <input type="number" min={0} value={newDrop.minChaptersToday} onChange={(e) => setNewDrop(prev => ({ ...prev, minChaptersToday: Number(e.target.value) || 0 }))} className="admin-input w-28" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Макс. дропов/день</label>
                  <input type="number" min={1} value={newDrop.maxDropsPerDay} onChange={(e) => setNewDrop(prev => ({ ...prev, maxDropsPerDay: Number(e.target.value) || 1 }))} className="admin-input w-28" />
                </div>
                <button
                  type="button"
                  disabled={!newDrop.itemId || isCreatingDrop}
                  className="admin-btn admin-btn-primary"
                  onClick={async () => {
                    try {
                      await createReadingDrop({ itemId: newDrop.itemId, chance: newDrop.chance, minChaptersToday: newDrop.minChaptersToday, maxDropsPerDay: newDrop.maxDropsPerDay }).unwrap();
                      toast.success("Правило добавлено");
                      setNewDrop(prev => ({ ...prev, itemId: "" }));
                      refetchDrops();
                    } catch (e) {
                      toast.error(getErrorMessage(e, "Ошибка добавления правила"));
                    }
                  }}
                >
                  {isCreatingDrop ? "Добавление…" : "Добавить"}
                </button>
              </div>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">Правил: {readingRules.length}</p>
            <ul className="space-y-1 text-sm">
              {readingRules.map((r: { _id: string; itemId: string; chance: number; maxDropsPerDay: number }) => (
                <li key={r._id} className="flex justify-between">
                  {r.itemId} — шанс {r.chance}, макс/день {r.maxDropsPerDay}
                  <button type="button" onClick={async () => { try { await deleteReadingDrop(r._id).unwrap(); toast.success("Удалено"); refetchDrops(); } catch (e) { toast.error(getErrorMessage(e, "Ошибка удаления")); } }} className="text-[var(--destructive)]">Удалить</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {subTab === "drops-quest" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="text-sm font-semibold">
                  {editingQuestRewardId ? "Редактировать награду квеста" : "Создать награду квеста"}
                </h4>
                {editingQuestRewardId ? (
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={resetQuestRewardForm}>
                    Сбросить
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  value={questRewardForm.questType}
                  onChange={(e) => setQuestRewardForm(prev => ({ ...prev, questType: e.target.value }))}
                  className="admin-input w-full"
                  placeholder="Тип квеста"
                />
                <select
                  value={questRewardForm.itemId}
                  onChange={(e) => setQuestRewardForm(prev => ({ ...prev, itemId: e.target.value }))}
                  className="admin-input w-full"
                >
                  <option value="">— Предмет —</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.id}
                    </option>
                  ))}
                </select>
                <input type="number" min={1} value={questRewardForm.countMin} onChange={(e) => setQuestRewardForm(prev => ({ ...prev, countMin: Number(e.target.value) || 1 }))} className="admin-input w-full" placeholder="Мин. количество" />
                <input type="number" min={1} value={questRewardForm.countMax} onChange={(e) => setQuestRewardForm(prev => ({ ...prev, countMax: Number(e.target.value) || 1 }))} className="admin-input w-full" placeholder="Макс. количество" />
                <input type="number" min={0} max={1} step={0.05} value={questRewardForm.chance} onChange={(e) => setQuestRewardForm(prev => ({ ...prev, chance: Number(e.target.value) || 0 }))} className="admin-input w-full" placeholder="Шанс" />
                <input type="number" min={0} value={questRewardForm.sortOrder} onChange={(e) => setQuestRewardForm(prev => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))} className="admin-input w-full" placeholder="Порядок" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm mt-3">
                <input type="checkbox" checked={questRewardForm.isActive} onChange={(e) => setQuestRewardForm(prev => ({ ...prev, isActive: e.target.checked }))} />
                Активно
              </label>
              <button
                type="button"
                disabled={!questRewardForm.questType.trim() || !questRewardForm.itemId || isSavingQuestReward}
                className="admin-btn admin-btn-primary mt-3"
                onClick={async () => {
                  if (questRewardForm.countMax < questRewardForm.countMin) {
                    toast.error("Максимум не может быть меньше минимума");
                    return;
                  }
                  const payload = {
                    ...questRewardForm,
                    questType: questRewardForm.questType.trim(),
                    itemId: questRewardForm.itemId,
                  };
                  try {
                    if (editingQuestRewardId) {
                      await updateQuestReward({ id: editingQuestRewardId, body: payload }).unwrap();
                      toast.success("Награда квеста обновлена");
                    } else {
                      await createQuestReward(payload).unwrap();
                      toast.success("Награда квеста создана");
                    }
                    resetQuestRewardForm();
                    refetchQuestRewards();
                  } catch (e) {
                    toast.error(getErrorMessage(e, "Не удалось сохранить награду квеста"));
                  }
                }}
              >
                {isSavingQuestReward ? "Сохранение…" : editingQuestRewardId ? "Сохранить награду" : "Создать награду"}
              </button>
            </div>

            <p className="text-sm text-[var(--muted-foreground)] mb-2">Наград за квесты: {questRewards.length}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {questRewards.map((r: { _id: string; questType: string; itemId: string; countMin: number; countMax: number; chance?: number; sortOrder?: number; isActive?: boolean }) => (
                <div key={r._id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm">
                      <div className="font-medium">{r.questType}</div>
                      <div className="text-[var(--muted-foreground)]">
                        {r.itemId} ×{r.countMin}-{r.countMax} · шанс {Math.round((r.chance ?? 1) * 100)}%
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="p-1.5 rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                        onClick={() => {
                          setEditingQuestRewardId(r._id);
                          setQuestRewardForm({
                            questType: r.questType,
                            itemId: r.itemId,
                            countMin: r.countMin,
                            countMax: r.countMax,
                            chance: Number(r.chance ?? 1),
                            sortOrder: Number(r.sortOrder ?? 0),
                            isActive: r.isActive !== false,
                          });
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={async () => { try { await deleteQuestReward(r._id).unwrap(); toast.success("Удалено"); refetchQuestRewards(); } catch (e) { toast.error(getErrorMessage(e, "Ошибка удаления")); } }} className="p-1.5 rounded text-[var(--destructive)] hover:bg-[var(--destructive)]/10">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 text-xs">
                    <span className="px-2 py-1 rounded bg-[var(--muted)]">{r.isActive === false ? "Отключено" : "Активно"}</span>
                    <span className="px-2 py-1 rounded bg-[var(--muted)]">sort {r.sortOrder ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subTab === "rewards-lb" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="text-sm font-semibold">
                  {editingLbRewardId ? "Редактировать награду лидерборда" : "Создать награду лидерборда"}
                </h4>
                {editingLbRewardId ? (
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={resetLbRewardForm}>
                    Сбросить
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="text" value={lbRewardForm.category} onChange={(e) => setLbRewardForm(prev => ({ ...prev, category: e.target.value }))} className="admin-input w-full" placeholder="Категория" />
                <input type="text" value={lbRewardForm.period} onChange={(e) => setLbRewardForm(prev => ({ ...prev, period: e.target.value }))} className="admin-input w-full" placeholder="Период" />
                <input type="number" min={1} value={lbRewardForm.rankMin} onChange={(e) => setLbRewardForm(prev => ({ ...prev, rankMin: Number(e.target.value) || 1 }))} className="admin-input w-full" placeholder="Место от" />
                <input type="number" min={1} value={lbRewardForm.rankMax} onChange={(e) => setLbRewardForm(prev => ({ ...prev, rankMax: Number(e.target.value) || 1 }))} className="admin-input w-full" placeholder="Место до" />
                <select value={lbRewardForm.itemId} onChange={(e) => setLbRewardForm(prev => ({ ...prev, itemId: e.target.value }))} className="admin-input w-full">
                  <option value="">Без предмета</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.id}
                    </option>
                  ))}
                </select>
                <input type="number" min={0} value={lbRewardForm.itemCount} onChange={(e) => setLbRewardForm(prev => ({ ...prev, itemCount: Number(e.target.value) || 0 }))} className="admin-input w-full" placeholder="Кол-во предмета" />
                <input type="number" min={0} value={lbRewardForm.coins} onChange={(e) => setLbRewardForm(prev => ({ ...prev, coins: Number(e.target.value) || 0 }))} className="admin-input w-full" placeholder="Монеты" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm mt-3">
                <input type="checkbox" checked={lbRewardForm.isActive} onChange={(e) => setLbRewardForm(prev => ({ ...prev, isActive: e.target.checked }))} />
                Активно
              </label>
              <button
                type="button"
                disabled={!lbRewardForm.category.trim() || !lbRewardForm.period.trim() || isSavingLbReward}
                className="admin-btn admin-btn-primary mt-3"
                onClick={async () => {
                  if (lbRewardForm.rankMax < lbRewardForm.rankMin) {
                    toast.error("rankMax не может быть меньше rankMin");
                    return;
                  }
                  const payload = {
                    ...lbRewardForm,
                    category: lbRewardForm.category.trim(),
                    period: lbRewardForm.period.trim(),
                    itemId: lbRewardForm.itemId || undefined,
                  };
                  try {
                    if (editingLbRewardId) {
                      await updateLbReward({ id: editingLbRewardId, body: payload }).unwrap();
                      toast.success("Награда лидерборда обновлена");
                    } else {
                      await createLbReward(payload).unwrap();
                      toast.success("Награда лидерборда создана");
                    }
                    resetLbRewardForm();
                    refetchLb();
                  } catch (e) {
                    toast.error(getErrorMessage(e, "Не удалось сохранить награду лидерборда"));
                  }
                }}
              >
                {isSavingLbReward ? "Сохранение…" : editingLbRewardId ? "Сохранить награду" : "Создать награду"}
              </button>
            </div>

            <p className="text-sm text-[var(--muted-foreground)] mb-2">Наград лидерборда: {lbRewards.length}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {lbRewards.map((r: { _id: string; category: string; period: string; rankMin: number; rankMax: number; itemId?: string; itemCount: number; coins: number; isActive?: boolean }) => (
                <div key={r._id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{r.category} / {r.period}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">
                        Места {r.rankMin}-{r.rankMax}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="p-1.5 rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                        onClick={() => {
                          setEditingLbRewardId(r._id);
                          setLbRewardForm({
                            category: r.category,
                            period: r.period,
                            rankMin: r.rankMin,
                            rankMax: r.rankMax,
                            itemId: r.itemId ?? "",
                            itemCount: Number(r.itemCount ?? 0),
                            coins: Number(r.coins ?? 0),
                            isActive: r.isActive !== false,
                          });
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={async () => { try { await deleteLbReward(r._id).unwrap(); toast.success("Удалено"); refetchLb(); } catch (e) { toast.error(getErrorMessage(e, "Ошибка удаления")); } }} className="p-1.5 rounded text-[var(--destructive)] hover:bg-[var(--destructive)]/10">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 text-xs">
                    {r.itemId ? <span className="px-2 py-1 rounded bg-[var(--muted)]">{r.itemId} ×{r.itemCount}</span> : null}
                    {r.coins ? <span className="px-2 py-1 rounded bg-[var(--muted)]">Монеты: {r.coins}</span> : null}
                    <span className="px-2 py-1 rounded bg-[var(--muted)]">{r.isActive === false ? "Отключено" : "Активно"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subTab === "config-disciples" && (
          <div className="space-y-4 max-w-lg">
            {disciplesConfigError && <p className="text-red-600 dark:text-red-400 text-sm">Не удалось загрузить конфиг. Нажмите «Повторить» выше.</p>}
            {disciplesConfig && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <h4 className="text-sm font-semibold mb-3">Настройки учеников</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Стоимость реролла (монет)</label>
                    <input type="number" min={0} value={disciplesForm.rerollCostCoins} onChange={(e) => setDisciplesForm(prev => ({ ...prev, rerollCostCoins: Number(e.target.value) || 0 }))} className="admin-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Стоимость тренировки (монет)</label>
                    <input type="number" min={0} value={disciplesForm.trainCostCoins} onChange={(e) => setDisciplesForm(prev => ({ ...prev, trainCostCoins: Number(e.target.value) || 0 }))} className="admin-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Макс. учеников</label>
                    <input type="number" min={1} value={disciplesForm.maxDisciples} onChange={(e) => setDisciplesForm(prev => ({ ...prev, maxDisciples: Number(e.target.value) || 1 }))} className="admin-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Боёв в день</label>
                    <input type="number" min={0} value={disciplesForm.maxBattlesPerDay} onChange={(e) => setDisciplesForm(prev => ({ ...prev, maxBattlesPerDay: Number(e.target.value) || 0 }))} className="admin-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Время жизни кандидата (мин)</label>
                    <input type="number" min={1} value={disciplesForm.rerollCandidateTtlMinutes} onChange={(e) => setDisciplesForm(prev => ({ ...prev, rerollCandidateTtlMinutes: Number(e.target.value) || 10 }))} className="admin-input w-full" />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSavingDisciples}
                  className="admin-btn admin-btn-primary mt-3"
                  onClick={async () => {
                    try {
                      await updateDisciplesConfig(disciplesForm).unwrap();
                      toast.success("Конфиг сохранён");
                      refetchDisciplesConfig();
                    } catch (e) {
                      toast.error(getErrorMessage(e, "Ошибка сохранения"));
                    }
                  }}
                >
                  {isSavingDisciples ? "Сохранение…" : "Сохранить конфиг"}
                </button>
              </div>
            )}
          </div>
        )}

        {subTab === "cards" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="text-sm font-semibold">
                  {editingCharacterCardId ? "Редактировать карточку персонажа" : "Создать карточку персонажа"}
                </h4>
                {editingCharacterCardId ? (
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={resetCardForm}>
                    Сбросить
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Персонаж</label>
                  <select
                    value={cardForm.characterId}
                    onChange={(e) => {
                      const nextCharacterId = e.target.value;
                      const character = characters.find((entry) => entry._id === nextCharacterId);
                      setCardForm(prev => ({
                        ...prev,
                        characterId: nextCharacterId,
                        name: prev.name || character?.name || "",
                      }));
                    }}
                    className="admin-input w-full"
                  >
                    <option value="">— Выберите персонажа —</option>
                    {characters.map((character) => (
                      <option key={character._id} value={character._id}>
                        {character.name}{" "}
                        {character.titleId
                          ? `· ${titleNameById.get(character.titleId) ?? character.titleId}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Название карточки</label>
                  <input
                    type="text"
                    value={cardForm.name}
                    onChange={(e) => setCardForm(prev => ({ ...prev, name: e.target.value }))}
                    className="admin-input w-full"
                    placeholder="Карточка персонажа"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Цена</label>
                  <input
                    type="number"
                    min={0}
                    value={cardForm.price}
                    onChange={(e) => setCardForm(prev => ({ ...prev, price: Number(e.target.value) || 0 }))}
                    className="admin-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Редкость</label>
                  <select
                    value={cardForm.rarity}
                    onChange={(e) => setCardForm(prev => ({ ...prev, rarity: e.target.value }))}
                    className="admin-input w-full"
                  >
                    <option value="common">Обычная</option>
                    <option value="rare">Редкая</option>
                    <option value="epic">Эпическая</option>
                    <option value="legendary">Легендарная</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Описание</label>
                  <textarea
                    value={cardForm.description}
                    onChange={(e) => setCardForm(prev => ({ ...prev, description: e.target.value }))}
                    className="admin-input w-full min-h-24"
                    placeholder="Что даёт эта карточка и чем она отличается"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">URL базовой картинки</label>
                  <input
                    type="text"
                    value={cardForm.imageUrl}
                    onChange={(e) => setCardForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="admin-input w-full"
                    placeholder="/uploads/game-items/..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Лимит в магазине</label>
                  <input
                    type="number"
                    min={0}
                    value={cardForm.quantity}
                    onChange={(e) => setCardForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className="admin-input w-full"
                    placeholder="пусто = без лимита"
                  />
                </div>
              </div>
              <label className="mt-3 inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={cardForm.isAvailable}
                  onChange={(e) => setCardForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                />
                Доступно игрокам
              </label>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h5 className="text-sm font-semibold">Этапы прокачки F → SSS</h5>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Если у следующего этапа нет изображения, апгрейд будет заблокирован.
                  </p>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  {cardForm.stages.map((stage) => (
                    <div key={stage.rank} className="rounded-lg border border-[var(--border)] p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <strong>{stage.rank}</strong>
                        <span className={`text-xs ${stage.imageUrl ? "text-emerald-600" : "text-amber-600"}`}>
                          {stage.imageUrl ? "готово" : "нет картинки"}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={stage.imageUrl}
                        onChange={(e) => setCardForm(prev => ({
                          ...prev,
                          stages: prev.stages.map(item => item.rank === stage.rank ? { ...item, imageUrl: e.target.value } : item),
                        }))}
                        className="admin-input w-full"
                        placeholder="URL изображения этапа"
                      />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="admin-input w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-[var(--primary)] file:text-[var(--primary-foreground)]"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            await uploadStageImage(stage.rank, file);
                          } catch (error) {
                            toast.error(getErrorMessage(error, "Не удалось загрузить изображение этапа"));
                          } finally {
                            e.target.value = "";
                          }
                        }}
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="number"
                          min={1}
                          value={stage.requiredLevel}
                          onChange={(e) => setCardForm(prev => ({
                            ...prev,
                            stages: prev.stages.map(item => item.rank === stage.rank ? { ...item, requiredLevel: Number(e.target.value) || 1 } : item),
                          }))}
                          className="admin-input w-full"
                          placeholder="Ур. ученика"
                        />
                        <input
                          type="number"
                          min={0}
                          value={stage.upgradeCoins}
                          onChange={(e) => setCardForm(prev => ({
                            ...prev,
                            stages: prev.stages.map(item => item.rank === stage.rank ? { ...item, upgradeCoins: Number(e.target.value) || 0 } : item),
                          }))}
                          className="admin-input w-full"
                          placeholder="Монеты"
                        />
                        <input
                          type="text"
                          value={stage.upgradeItemId ?? ""}
                          onChange={(e) => setCardForm(prev => ({
                            ...prev,
                            stages: prev.stages.map(item => item.rank === stage.rank ? { ...item, upgradeItemId: e.target.value } : item),
                          }))}
                          className="admin-input w-full"
                          placeholder="ID предмета"
                        />
                        <input
                          type="number"
                          min={0}
                          value={stage.upgradeItemCount ?? 0}
                          onChange={(e) => setCardForm(prev => ({
                            ...prev,
                            stages: prev.stages.map(item => item.rank === stage.rank ? { ...item, upgradeItemCount: Number(e.target.value) || 0 } : item),
                          }))}
                          className="admin-input w-full"
                          placeholder="Кол-во предмета"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--muted-foreground)] mb-1">Шанс улучшения (0–1)</label>
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          value={stage.upgradeSuccessChance ?? 1}
                          onChange={(e) => setCardForm(prev => ({
                            ...prev,
                            stages: prev.stages.map(item => item.rank === stage.rank ? { ...item, upgradeSuccessChance: Number(e.target.value) || 0 } : item),
                          }))}
                          className="admin-input w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!cardForm.characterId || !cardForm.name.trim() || isCreatingCharacterCard || isUpdatingCharacterCard}
                  className="admin-btn admin-btn-primary"
                  onClick={async () => {
                    const payload = {
                      name: cardForm.name.trim(),
                      description: cardForm.description.trim(),
                      price: cardForm.price,
                      imageUrl: cardForm.imageUrl.trim() || undefined,
                      rarity: cardForm.rarity,
                      isAvailable: cardForm.isAvailable,
                      quantity: cardForm.quantity.trim() === "" ? null : Number(cardForm.quantity),
                      characterId: cardForm.characterId,
                      stages: cardForm.stages,
                    };
                    try {
                      if (editingCharacterCardId) {
                        await updateCharacterCard({ id: editingCharacterCardId, body: payload }).unwrap();
                        toast.success("Карточка обновлена");
                      } else {
                        await createCharacterCard(payload).unwrap();
                        toast.success("Карточка создана");
                      }
                      resetCardForm();
                      refetchCharacterCards();
                    } catch (error) {
                      toast.error(getErrorMessage(error, "Не удалось сохранить карточку"));
                    }
                  }}
                >
                  {isCreatingCharacterCard || isUpdatingCharacterCard ? "Сохранение…" : editingCharacterCardId ? "Сохранить карточку" : "Создать карточку"}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-[var(--muted-foreground)]">Карточек: {characterCards.length}</p>
              <div className="grid gap-3 lg:grid-cols-2">
                {characterCards.map((card: CharacterCardAdmin) => {
                  const characterId = typeof card.characterId === "string" ? card.characterId : card.characterId?._id ?? "";
                  const titleName = typeof card.titleId === "string" ? "" : card.titleId?.title ?? card.titleId?.name ?? "";
                  return (
                    <div key={card._id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h5 className="font-semibold">{card.name}</h5>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {typeof card.characterId === "string" ? card.characterId : card.characterId?.name ?? "Без персонажа"}
                            {titleName ? ` · ${titleName}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="p-1.5 rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                            onClick={() => {
                              setEditingCharacterCardId(card._id);
                              setCardForm({
                                name: card.name ?? "",
                                description: card.description ?? "",
                                price: Number(card.price ?? 0),
                                imageUrl: card.imageUrl ?? "",
                                rarity: card.rarity ?? "common",
                                isAvailable: card.isAvailable ?? true,
                                quantity: card.quantity == null ? "" : String(card.quantity),
                                characterId,
                                stages: createEmptyCardStages().map((stage) => card.stages?.find((item) => item.rank === stage.rank) ?? stage),
                              });
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                            onClick={async () => {
                              try {
                                await deleteCharacterCard(card._id).unwrap();
                                toast.success("Карточка удалена");
                                refetchCharacterCards();
                                if (editingCharacterCardId === card._id) resetCardForm();
                              } catch (error) {
                                toast.error(getErrorMessage(error, "Не удалось удалить карточку"));
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {CARD_STAGE_RANKS.map((rank) => {
                          const stage = card.stages?.find((item) => item.rank === rank);
                          return (
                            <span key={rank} className={`px-2 py-1 rounded ${stage?.imageUrl ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                              {rank}: {stage?.imageUrl ? "ok" : "no image"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {subTab === "card-decks" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="text-sm font-semibold">
                  {editingDeckId ? "Редактировать колоду" : "Создать колоду"}
                </h4>
                {editingDeckId ? (
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={resetDeckForm}>
                    Сбросить
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="text" value={deckForm.name} onChange={(e) => setDeckForm(prev => ({ ...prev, name: e.target.value }))} className="admin-input w-full" placeholder="Название колоды" />
                <input type="number" min={0} value={deckForm.price} onChange={(e) => setDeckForm(prev => ({ ...prev, price: Number(e.target.value) || 0 }))} className="admin-input w-full" placeholder="Цена" />
                <input type="text" value={deckForm.imageUrl} onChange={(e) => setDeckForm(prev => ({ ...prev, imageUrl: e.target.value }))} className="admin-input w-full" placeholder="URL картинки" />
                <input type="number" min={1} value={deckForm.cardsPerOpen} onChange={(e) => setDeckForm(prev => ({ ...prev, cardsPerOpen: Number(e.target.value) || 1 }))} className="admin-input w-full" placeholder="Карточек за открытие" />
                <input type="number" min={0} max={1} step={0.05} value={deckForm.titleFocusChance} onChange={(e) => setDeckForm(prev => ({ ...prev, titleFocusChance: Number(e.target.value) || 0 }))} className="admin-input w-full" placeholder="Шанс тайтл-пула" />
                <input type="number" min={0} value={deckForm.pityThreshold} onChange={(e) => setDeckForm(prev => ({ ...prev, pityThreshold: Number(e.target.value) || 0 }))} className="admin-input w-full" placeholder="Порог pity" />
                <select value={deckForm.pityTargetRarity} onChange={(e) => setDeckForm(prev => ({ ...prev, pityTargetRarity: e.target.value }))} className="admin-input w-full">
                  <option value="rare">Pity: rare</option>
                  <option value="epic">Pity: epic</option>
                  <option value="legendary">Pity: legendary</option>
                </select>
                <input type="number" min={0} value={deckForm.quantity} onChange={(e) => setDeckForm(prev => ({ ...prev, quantity: e.target.value }))} className="admin-input w-full" placeholder="Лимит (пусто = без лимита)" />
                <select value={deckForm.titleId} onChange={(e) => setDeckForm(prev => ({ ...prev, titleId: e.target.value }))} className="admin-input w-full">
                  <option value="">Общий пул</option>
                  {Array.from(new Set(characters.map((character) => character.titleId).filter(Boolean))).map((titleId) => (
                    <option key={titleId} value={titleId}>
                      {titleNameById.get(titleId) ?? titleId}
                    </option>
                  ))}
                </select>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={deckForm.isAvailable} onChange={(e) => setDeckForm(prev => ({ ...prev, isAvailable: e.target.checked }))} />
                  Доступно игрокам
                </label>
                <textarea value={deckForm.description} onChange={(e) => setDeckForm(prev => ({ ...prev, description: e.target.value }))} className="admin-input w-full md:col-span-2 min-h-24" placeholder="Описание колоды" />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-3">
                Если выбран тайтл, колода станет `title deck`: в магазине она будет выделена как premium и получит усиленный пул по выбранному тайтлу.
              </p>
              <button
                type="button"
                disabled={!deckForm.name.trim() || !deckForm.imageUrl.trim() || isCreatingDeck || isUpdatingDeck}
                className="admin-btn admin-btn-primary mt-3"
                onClick={async () => {
                  const payload = {
                    name: deckForm.name.trim(),
                    description: deckForm.description.trim(),
                    imageUrl: deckForm.imageUrl.trim(),
                    price: deckForm.price,
                    quantity: deckForm.quantity.trim() === "" ? null : Number(deckForm.quantity),
                    titleId: deckForm.titleId || null,
                    cardsPerOpen: deckForm.cardsPerOpen,
                    titleFocusChance: deckForm.titleFocusChance,
                    pityThreshold: deckForm.pityThreshold,
                    pityTargetRarity: deckForm.pityTargetRarity,
                    isAvailable: deckForm.isAvailable,
                  };
                  try {
                    if (editingDeckId) {
                      const updatePayload = {
                        ...payload,
                        quantity:
                          payload.quantity === null ? undefined : payload.quantity,
                        titleId: payload.titleId ?? undefined,
                        pityThreshold: payload.pityThreshold,
                        pityTargetRarity: payload.pityTargetRarity,
                      };
                      await updateCardDeck({ id: editingDeckId, body: updatePayload }).unwrap();
                      toast.success("Колода обновлена");
                    } else {
                      const createPayload = {
                        ...payload,
                        quantity:
                          payload.quantity === null ? undefined : payload.quantity,
                        titleId: payload.titleId ?? undefined,
                        pityThreshold: payload.pityThreshold,
                        pityTargetRarity: payload.pityTargetRarity,
                      };
                      await createCardDeck(createPayload).unwrap();
                      toast.success("Колода создана");
                    }
                    resetDeckForm();
                    refetchCardDecks();
                  } catch (error) {
                    toast.error(getErrorMessage(error, "Не удалось сохранить колоду"));
                  }
                }}
              >
                {isCreatingDeck || isUpdatingDeck ? "Сохранение…" : editingDeckId ? "Сохранить колоду" : "Создать колоду"}
              </button>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {cardDecks.map((deck: CardDeck) => (
                <div key={deck._id ?? deck.id ?? deck.name} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h5 className="font-semibold">{deck.name}</h5>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {deck.titleName ? `Пул: ${deck.titleName}` : "Общий пул"} · {deck.cardsPerOpen} карт
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="p-1.5 rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                        onClick={() => {
                          setEditingDeckId(deck._id ?? deck.id ?? "");
                          setDeckForm({
                            name: deck.name ?? "",
                            description: deck.description ?? "",
                            imageUrl: deck.imageUrl ?? "",
                            price: Number(deck.price ?? 0),
                            quantity: deck.quantity == null ? "" : String(deck.quantity),
                            titleId: deck.titleId ?? "",
                            cardsPerOpen: Number(deck.cardsPerOpen ?? 3),
                            titleFocusChance: Number(deck.titleFocusChance ?? 0.75),
                          pityThreshold: Number(deck.pityThreshold ?? 0),
                          pityTargetRarity: String(deck.pityTargetRarity ?? "rare"),
                            isAvailable: deck.isAvailable ?? true,
                          });
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                        onClick={async () => {
                          try {
                            await deleteCardDeck(deck._id ?? deck.id ?? "").unwrap();
                            toast.success("Колода удалена");
                            refetchCardDecks();
                            if ((deck._id ?? deck.id) === editingDeckId) resetDeckForm();
                          } catch (error) {
                            toast.error(getErrorMessage(error, "Не удалось удалить колоду"));
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                    Цена: {deck.price} · Фокус тайтла: {Math.round((deck.titleFocusChance ?? 0) * 100)}%
                    {(deck.pityThreshold ?? 0) > 0 ? ` · Pity ${deck.pityTargetRarity ?? "rare"} / ${deck.pityThreshold}` : ""}
                    {deck.quantity != null ? ` · Остаток: ${deck.quantity}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subTab === "recipes" && (
          <div className="space-y-4">
            {recipesError && <p className="text-red-600 dark:text-red-400 text-sm mb-2">Не удалось загрузить рецепты.</p>}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="text-sm font-semibold">
                  {recipeEditingId ? "Редактировать рецепт" : "Создать рецепт"}
                </h4>
                {recipeEditingId ? (
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={resetRecipeForm}>
                    Сбросить
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="text" value={recipeForm.name} onChange={(e) => setRecipeForm(prev => ({ ...prev, name: e.target.value }))} className="admin-input w-full" placeholder="Название" />
                <input type="text" value={recipeForm.icon} onChange={(e) => setRecipeForm(prev => ({ ...prev, icon: e.target.value }))} className="admin-input w-full" placeholder="URL иконки" />
                <input type="text" value={recipeForm.resultType} onChange={(e) => setRecipeForm(prev => ({ ...prev, resultType: e.target.value }))} className="admin-input w-full" placeholder="resultType" />
                <select value={recipeForm.element} onChange={(e) => setRecipeForm(prev => ({ ...prev, element: e.target.value as typeof prev.element }))} className="admin-input w-full">
                  <option value="">Без стихии</option>
                  <option value="fire">fire</option>
                  <option value="water">water</option>
                  <option value="earth">earth</option>
                  <option value="wood">wood</option>
                  <option value="metal">metal</option>
                </select>
                <input type="number" min={0} value={recipeForm.coinCost} onChange={(e) => setRecipeForm(prev => ({ ...prev, coinCost: Number(e.target.value) || 0 }))} className="admin-input w-full" placeholder="Цена в монетах" />
                <input type="number" min={0} max={100} value={recipeForm.mishapChancePercent} onChange={(e) => setRecipeForm(prev => ({ ...prev, mishapChancePercent: Number(e.target.value) || 0 }))} className="admin-input w-full" placeholder="Риск провала %" />
                <input type="number" min={0} value={recipeForm.sortOrder} onChange={(e) => setRecipeForm(prev => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))} className="admin-input w-full" placeholder="Порядок" />
                <textarea value={recipeForm.description} onChange={(e) => setRecipeForm(prev => ({ ...prev, description: e.target.value }))} className="admin-input w-full md:col-span-2 min-h-24" placeholder="Описание рецепта" />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h5 className="text-sm font-medium">Ингредиенты</h5>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setRecipeForm(prev => ({ ...prev, ingredients: [...prev.ingredients, { itemId: "", count: 1 }] }))}
                  >
                    <Plus className="w-4 h-4" /> Добавить ингредиент
                  </button>
                </div>
                <div className="space-y-2">
                  {recipeForm.ingredients.map((ingredient, index) => (
                    <div key={`${index}-${ingredient.itemId}`} className="grid gap-2 md:grid-cols-[1fr_140px_40px]">
                      <select
                        value={ingredient.itemId}
                        onChange={(e) => setRecipeForm(prev => ({
                          ...prev,
                          ingredients: prev.ingredients.map((entry, entryIndex) => entryIndex === index ? { ...entry, itemId: e.target.value } : entry),
                        }))}
                        className="admin-input w-full"
                      >
                        <option value="">— Предмет —</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} · {item.id}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={ingredient.count}
                        onChange={(e) => setRecipeForm(prev => ({
                          ...prev,
                          ingredients: prev.ingredients.map((entry, entryIndex) => entryIndex === index ? { ...entry, count: Number(e.target.value) || 1 } : entry),
                        }))}
                        className="admin-input w-full"
                        placeholder="Кол-во"
                      />
                      <button
                        type="button"
                        className="p-2 rounded bg-[var(--muted)] text-[var(--destructive)]"
                        onClick={() => setRecipeForm(prev => ({
                          ...prev,
                          ingredients: prev.ingredients.filter((_, entryIndex) => entryIndex !== index),
                        }))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3 mt-4">
                <input type="number" min={0} value={recipeForm.qualityWeights.common} onChange={(e) => setRecipeForm(prev => ({ ...prev, qualityWeights: { ...prev.qualityWeights, common: Number(e.target.value) || 0 } }))} className="admin-input w-full" placeholder="Вес common" />
                <input type="number" min={0} value={recipeForm.qualityWeights.quality} onChange={(e) => setRecipeForm(prev => ({ ...prev, qualityWeights: { ...prev.qualityWeights, quality: Number(e.target.value) || 0 } }))} className="admin-input w-full" placeholder="Вес quality" />
                <input type="number" min={0} value={recipeForm.qualityWeights.legendary} onChange={(e) => setRecipeForm(prev => ({ ...prev, qualityWeights: { ...prev.qualityWeights, legendary: Number(e.target.value) || 0 } }))} className="admin-input w-full" placeholder="Вес legendary" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm mt-3">
                <input type="checkbox" checked={recipeForm.isActive} onChange={(e) => setRecipeForm(prev => ({ ...prev, isActive: e.target.checked }))} />
                Активно
              </label>
              <button
                type="button"
                disabled={!recipeForm.name.trim() || !recipeForm.resultType.trim() || isSavingRecipe}
                className="admin-btn admin-btn-primary mt-3"
                onClick={async () => {
                  const ingredients = recipeForm.ingredients.filter((ingredient) => ingredient.itemId.trim());
                  if (ingredients.length === 0) {
                    toast.error("Добавьте хотя бы один ингредиент");
                    return;
                  }
                  const payload = {
                    name: recipeForm.name.trim(),
                    description: recipeForm.description.trim(),
                    icon: recipeForm.icon.trim(),
                    coinCost: recipeForm.coinCost,
                    resultType: recipeForm.resultType.trim(),
                    element: recipeForm.element || null,
                    mishapChancePercent: recipeForm.mishapChancePercent,
                    sortOrder: recipeForm.sortOrder,
                    isActive: recipeForm.isActive,
                    ingredients,
                    qualityWeights: recipeForm.qualityWeights,
                  };
                  try {
                    if (recipeEditingId) {
                      await updateRecipe({ id: recipeEditingId, body: payload }).unwrap();
                      toast.success("Рецепт обновлён");
                    } else {
                      await createRecipe(payload).unwrap();
                      toast.success("Рецепт создан");
                    }
                    resetRecipeForm();
                    refetchRecipes();
                  } catch (e) {
                    toast.error(getErrorMessage(e, "Не удалось сохранить рецепт"));
                  }
                }}
              >
                {isSavingRecipe ? "Сохранение…" : recipeEditingId ? "Сохранить рецепт" : "Создать рецепт"}
              </button>
            </div>

            <p className="text-sm text-[var(--muted-foreground)] mb-2">Рецептов: {recipes.length}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {recipes.map((r: AlchemyRecipeAdmin) => (
                <div key={r._id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">
                        {(r.ingredients ?? []).map((i) => `${i.itemId}×${i.count}`).join(", ")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="p-1.5 rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                        onClick={() => {
                          setRecipeEditingId(r._id);
                          setRecipeForm({
                            name: r.name ?? "",
                            description: r.description ?? "",
                            icon: r.icon ?? "",
                            coinCost: Number(r.coinCost ?? 0),
                            resultType: r.resultType ?? "pill_common",
                            element: (r.element as "" | "fire" | "water" | "earth" | "wood" | "metal" | undefined) ?? "",
                            mishapChancePercent: Number(r.mishapChancePercent ?? 8),
                            sortOrder: Number(r.sortOrder ?? 0),
                            isActive: r.isActive !== false,
                            ingredients: (r.ingredients ?? []).map((ingredient) => ({ itemId: ingredient.itemId, count: ingredient.count })),
                            qualityWeights: {
                              common: Number(r.qualityWeights?.common ?? 70),
                              quality: Number(r.qualityWeights?.quality ?? 25),
                              legendary: Number(r.qualityWeights?.legendary ?? 5),
                            },
                          });
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                        onClick={async () => {
                          try {
                            await deleteRecipe(r._id).unwrap();
                            toast.success("Рецепт удалён");
                            refetchRecipes();
                            if (recipeEditingId === r._id) resetRecipeForm();
                          } catch (e) {
                            toast.error(getErrorMessage(e, "Не удалось удалить рецепт"));
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 text-xs">
                    <span className="px-2 py-1 rounded bg-[var(--muted)]">result: {r.resultType}</span>
                    <span className="px-2 py-1 rounded bg-[var(--muted)]">риск: {r.mishapChancePercent ?? 8}%</span>
                    <span className="px-2 py-1 rounded bg-[var(--muted)]">{r.element || "без стихии"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subTab === "config-wheel" && (
          <div className="space-y-4">
            {wheelConfigError && <p className="text-red-600 dark:text-red-400 text-sm">Не удалось загрузить конфиг колеса.</p>}
            {wheelConfig && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold">Колесо судьбы</h4>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      Настройте не только цену спина, но и сами награды, их шанс и визуальную подпись для игрока.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary inline-flex items-center gap-2"
                    onClick={() => {
                      if (!wheelConfig) return;
                      setWheelForm({
                        spinCostCoins: wheelConfig.spinCostCoins ?? 20,
                        segments: (wheelConfig.segments ?? []).map((segment) => ({
                          rewardType: segment.rewardType ?? "coins",
                          label: segment.label ?? "",
                          weight: Number(segment.weight ?? 1),
                          paramType:
                            segment.rewardType === "item" &&
                            segment.param &&
                            typeof segment.param === "object" &&
                            "itemId" in segment.param
                              ? "item"
                              : "number",
                          paramNumber: typeof segment.param === "number" ? String(segment.param) : "0",
                          itemId:
                            segment.rewardType === "item" &&
                            segment.param &&
                            typeof segment.param === "object" &&
                            "itemId" in segment.param
                              ? String(segment.param.itemId ?? "")
                              : "",
                          itemCount:
                            segment.rewardType === "item" &&
                            segment.param &&
                            typeof segment.param === "object" &&
                            "count" in segment.param
                              ? String(segment.param.count ?? 1)
                              : "1",
                        })),
                      });
                    }}
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden />
                    Сбросить к текущему конфигу
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[260px_1fr] mt-4">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-4 space-y-3 h-fit">
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">Стоимость спина (монет)</label>
                      <input type="number" min={0} value={wheelForm.spinCostCoins} onChange={(e) => setWheelForm(prev => ({ ...prev, spinCostCoins: Number(e.target.value) || 0 }))} className="admin-input w-full" />
                    </div>
                    <div className="grid gap-2 text-xs">
                      <div className="flex items-center justify-between rounded-md bg-[var(--card)] px-3 py-2 border border-[var(--border)]">
                        <span>Сегментов</span>
                        <strong>{wheelForm.segments.length}</strong>
                      </div>
                      <div className="flex items-center justify-between rounded-md bg-[var(--card)] px-3 py-2 border border-[var(--border)]">
                        <span>Общий вес</span>
                        <strong>{wheelTotalWeight}</strong>
                      </div>
                      <div className="flex items-center justify-between rounded-md bg-[var(--card)] px-3 py-2 border border-[var(--border)]">
                        <span>Ошибка валидации</span>
                        <strong className={wheelValidationError ? "text-[var(--destructive)]" : "text-emerald-600"}>
                          {wheelValidationError ? "Есть" : "Нет"}
                        </strong>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-[var(--muted-foreground)]">Быстро добавить</div>
                      <div className="flex flex-wrap gap-2">
                        {(["coins", "xp", "item", "empty"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={() => setWheelForm(prev => ({
                              ...prev,
                              segments: [...prev.segments, createEmptyWheelSegment(type)],
                            }))}
                          >
                            <Plus className="w-4 h-4" aria-hidden />
                            {WHEEL_REWARD_TYPE_LABELS[type]}
                          </button>
                        ))}
                      </div>
                    </div>
                    {wheelValidationError ? (
                      <p className="text-xs text-[var(--destructive)]">{wheelValidationError}</p>
                    ) : (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Шанс сегмента для игрока считается как `вес / общий вес`.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {wheelForm.segments.map((segment, index) => {
                      const itemMeta = items.find((item) => item.id === segment.itemId);
                      const chancePercent = wheelTotalWeight > 0 ? ((Number(segment.weight) || 0) / wheelTotalWeight) * 100 : 0;
                      const previewIcon =
                        segment.rewardType === "coins" ? <Coins className="w-4 h-4" aria-hidden /> :
                        segment.rewardType === "xp" ? <Sparkles className="w-4 h-4" aria-hidden /> :
                        segment.rewardType === "item" ? <Gift className="w-4 h-4" aria-hidden /> :
                        <CircleOff className="w-4 h-4" aria-hidden />;

                      return (
                        <div key={`${index}-${segment.label}-${segment.rewardType}`} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--muted)] border border-[var(--border)]">
                                {previewIcon}
                              </span>
                              <div>
                                <div className="text-sm font-medium">{segment.label || `Сегмент #${index + 1}`}</div>
                                <div className="text-xs text-[var(--muted-foreground)]">
                                  {WHEEL_REWARD_TYPE_LABELS[segment.rewardType] ?? segment.rewardType} · шанс {chancePercent.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="p-2 rounded bg-[var(--muted)] text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                              onClick={() => setWheelForm(prev => ({
                                ...prev,
                                segments: prev.segments.filter((_, entryIndex) => entryIndex !== index),
                              }))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Тип награды</label>
                              <select
                                value={segment.rewardType}
                                onChange={(e) => setWheelForm(prev => ({
                                  ...prev,
                                  segments: prev.segments.map((entry, entryIndex) => entryIndex === index ? {
                                    ...entry,
                                    ...createEmptyWheelSegment(e.target.value as "coins" | "xp" | "item" | "empty" | "element_bonus"),
                                    label: entry.label && entry.label !== WHEEL_REWARD_TYPE_LABELS[entry.rewardType] ? entry.label : createEmptyWheelSegment(e.target.value as "coins" | "xp" | "item" | "empty" | "element_bonus").label,
                                  } : entry),
                                }))}
                                className="admin-input w-full"
                              >
                                <option value="coins">Монеты</option>
                                <option value="xp">Опыт</option>
                                <option value="item">Предмет</option>
                                <option value="empty">Пусто</option>
                                <option value="element_bonus">Бонус стихии</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Подпись игроку</label>
                              <input
                                type="text"
                                value={segment.label}
                                onChange={(e) => setWheelForm(prev => ({
                                  ...prev,
                                  segments: prev.segments.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: e.target.value } : entry),
                                }))}
                                className="admin-input w-full"
                                placeholder="Например: 50 монет"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Вес</label>
                              <input
                                type="number"
                                min={1}
                                value={segment.weight}
                                onChange={(e) => setWheelForm(prev => ({
                                  ...prev,
                                  segments: prev.segments.map((entry, entryIndex) => entryIndex === index ? { ...entry, weight: Number(e.target.value) || 1 } : entry),
                                }))}
                                className="admin-input w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Шанс</label>
                              <div className="admin-input w-full flex items-center justify-between bg-[var(--muted)]/20">
                                <span>{chancePercent.toFixed(1)}%</span>
                                <Percent className="w-4 h-4 text-[var(--muted-foreground)]" aria-hidden />
                              </div>
                            </div>
                          </div>

                          {segment.rewardType === "item" ? (
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Предмет</label>
                                <select
                                  value={segment.itemId}
                                  onChange={(e) => setWheelForm(prev => ({
                                    ...prev,
                                    segments: prev.segments.map((entry, entryIndex) => entryIndex === index ? { ...entry, itemId: e.target.value } : entry),
                                  }))}
                                  className="admin-input w-full"
                                >
                                  <option value="">— Предмет —</option>
                                  {items.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.name} · {item.id}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Количество</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={segment.itemCount}
                                  onChange={(e) => setWheelForm(prev => ({
                                    ...prev,
                                    segments: prev.segments.map((entry, entryIndex) => entryIndex === index ? { ...entry, itemCount: e.target.value } : entry),
                                  }))}
                                  className="admin-input w-full"
                                />
                              </div>
                              {itemMeta ? (
                                <div className="md:col-span-2 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/10 px-3 py-2 text-sm">
                                  {itemMeta.icon ? <img src={itemMeta.icon} alt="" className="w-6 h-6 rounded object-cover" /> : <Gift className="w-4 h-4" aria-hidden />}
                                  <span>{itemMeta.name} · {itemMeta.id}</span>
                                </div>
                              ) : null}
                            </div>
                          ) : segment.rewardType !== "empty" ? (
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Числовое значение</label>
                              <input
                                type="number"
                                min={0}
                                value={segment.paramNumber}
                                onChange={(e) => setWheelForm(prev => ({
                                  ...prev,
                                  segments: prev.segments.map((entry, entryIndex) => entryIndex === index ? { ...entry, paramNumber: e.target.value } : entry),
                                }))}
                                className="admin-input w-full md:max-w-xs"
                                placeholder="Например: 25"
                              />
                            </div>
                          ) : (
                            <div className="text-xs text-[var(--muted-foreground)]">
                              Этот сегмент ничего не выдаёт и используется как пустой результат.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSavingWheel || !!wheelValidationError}
                  className="admin-btn admin-btn-primary mt-3"
                  onClick={async () => {
                    try {
                      await updateWheelConfig({
                        spinCostCoins: wheelForm.spinCostCoins,
                        segments: wheelForm.segments.map((segment) => ({
                          rewardType: segment.rewardType,
                          label: segment.label,
                          weight: segment.weight,
                          param:
                            segment.rewardType === "item"
                              ? { itemId: segment.itemId, count: Number(segment.itemCount) || 1 }
                              : segment.rewardType === "empty"
                                ? undefined
                                : Number(segment.paramNumber) || 0,
                        })),
                      }).unwrap();
                      toast.success("Конфиг сохранён");
                      refetchWheelConfig();
                    } catch (e) {
                      toast.error(getErrorMessage(e, "Ошибка сохранения"));
                    }
                  }}
                >
                  {isSavingWheel ? "Сохранение…" : "Сохранить"}
                </button>
              </div>
            )}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
