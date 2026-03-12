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
  useDeleteDailyQuestRewardMutation,
  useListLeaderboardRewardsQuery,
  useDeleteLeaderboardRewardMutation,
  useGetDisciplesConfigQuery,
  useUpdateDisciplesConfigMutation,
  useListRecipesQuery,
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
} from "@/store/api/gameItemsAdminApi";
import { useGetCharactersQuery } from "@/store/api/charactersApi";
import { useGetTitlesQuery } from "@/store/api/titlesApi";
import type { CardDeck, CardStageRank, GameItemType, GameItemRarity } from "@/types/games";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/utils";
import { AdminCard } from "./ui";
import { GAME_ITEMS_LORE } from "@/constants/gameItemsLore";
import { Gamepad2, Trash2, RefreshCw, BookOpen, Pencil, Plus, X } from "lucide-react";

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
  const [disciplesForm, setDisciplesForm] = useState({ rerollCostCoins: 50, trainCostCoins: 15, maxDisciples: 5, maxBattlesPerDay: 5, rerollCandidateTtlMinutes: 10 });
  const [wheelForm, setWheelForm] = useState({ spinCostCoins: 20 });
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
  const [deleteQuestReward] = useDeleteDailyQuestRewardMutation();
  const questRewards = Array.isArray(questRewardsData?.data?.rewards) ? questRewardsData.data.rewards : [];

  const { data: lbRewardsData, isError: lbError, refetch: refetchLb } = useListLeaderboardRewardsQuery({});
  const [deleteLbReward] = useDeleteLeaderboardRewardMutation();
  const lbRewards = Array.isArray(lbRewardsData?.data?.rewards) ? lbRewardsData.data.rewards : [];

  const { data: disciplesConfigData, isError: disciplesConfigError, refetch: refetchDisciplesConfig } = useGetDisciplesConfigQuery();
  const disciplesConfig = disciplesConfigData?.data;
  const [updateDisciplesConfig, { isLoading: isSavingDisciples }] = useUpdateDisciplesConfigMutation();

  const { data: recipesData, isError: recipesError, refetch: refetchRecipes } = useListRecipesQuery();
  const recipes = Array.isArray(recipesData?.data?.recipes) ? recipesData.data.recipes : [];

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
      setWheelForm({ spinCostCoins: wheelConfig.spinCostCoins ?? 20 });
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
          <div>
            <p className="text-sm text-[var(--muted-foreground)] mb-2">Наград за квесты: {questRewards.length}</p>
            <ul className="space-y-1 text-sm">
              {questRewards.map((r: { _id: string; questType: string; itemId: string; countMin: number; countMax: number }) => (
                <li key={r._id} className="flex justify-between">
                  {r.questType} → {r.itemId} ×{r.countMin}-{r.countMax}
                  <button type="button" onClick={async () => { try { await deleteQuestReward(r._id).unwrap(); toast.success("Удалено"); refetchQuestRewards(); } catch (e) { toast.error(getErrorMessage(e, "Ошибка удаления")); } }} className="text-[var(--destructive)]">Удалить</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {subTab === "rewards-lb" && (
          <div>
            <p className="text-sm text-[var(--muted-foreground)] mb-2">Наград лидерборда: {lbRewards.length}</p>
            <ul className="space-y-1 text-sm">
              {lbRewards.map((r: { _id: string; category: string; period: string; rankMin: number; rankMax: number; itemId?: string; itemCount: number; coins: number }) => (
                <li key={r._id} className="flex justify-between">
                  {r.category} / {r.period} места {r.rankMin}-{r.rankMax}: item {r.itemId ?? "-"} ×{r.itemCount}, coins {r.coins}
                  <button type="button" onClick={async () => { try { await deleteLbReward(r._id).unwrap(); toast.success("Удалено"); refetchLb(); } catch (e) { toast.error(getErrorMessage(e, "Ошибка удаления")); } }} className="text-[var(--destructive)]">Удалить</button>
                </li>
              ))}
            </ul>
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
          <div>
            {recipesError && <p className="text-red-600 dark:text-red-400 text-sm mb-2">Не удалось загрузить рецепты.</p>}
            <p className="text-sm text-[var(--muted-foreground)] mb-2">Рецептов: {recipes.length}</p>
            <ul className="space-y-1 text-sm">
              {recipes.map((r: { _id: string; name: string; ingredients?: { itemId: string; count: number }[] }) => (
                <li key={r._id}>{r.name} — ингредиенты: {(r.ingredients ?? []).map((i: { itemId: string; count: number }) => `${i.itemId}×${i.count}`).join(", ")}</li>
              ))}
            </ul>
          </div>
        )}

        {subTab === "config-wheel" && (
          <div className="space-y-4">
            {wheelConfigError && <p className="text-red-600 dark:text-red-400 text-sm">Не удалось загрузить конфиг колеса.</p>}
            {wheelConfig && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 max-w-md">
                <h4 className="text-sm font-semibold mb-3">Колесо судьбы</h4>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Стоимость спина (монет)</label>
                  <input type="number" min={0} value={wheelForm.spinCostCoins} onChange={(e) => setWheelForm(prev => ({ ...prev, spinCostCoins: Number(e.target.value) || 0 }))} className="admin-input w-32" />
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">Сегментов: {wheelConfig.segments?.length ?? 0}. Изменение сегментов — через API.</p>
                <button
                  type="button"
                  disabled={isSavingWheel}
                  className="admin-btn admin-btn-primary mt-3"
                  onClick={async () => {
                    try {
                      await updateWheelConfig({ spinCostCoins: wheelForm.spinCostCoins }).unwrap();
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
