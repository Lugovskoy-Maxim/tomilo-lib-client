/** Тип предмета игры */
export type GameItemType = "material" | "consumable" | "special";

/** Редкость предмета */
export type GameItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

/** Элемент инвентаря (с полями предмета для отображения) */
export interface InventoryEntry {
  itemId: string;
  count: number;
  name?: string;
  icon?: string;
}

export type CardStageRank = "F" | "E" | "D" | "C" | "B" | "A" | "S" | "SS" | "SSS";

export interface ProfileCardStage {
  rank: CardStageRank;
  imageUrl: string;
  requiredLevel: number;
  upgradeCoins: number;
  upgradeItemId: string;
  upgradeItemCount: number;
  upgradeSuccessChance: number;
}

export interface ProfileCard {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  rarity: string;
  characterId: string | null;
  characterName: string;
  characterAvatar: string;
  titleId: string | null;
  titleName: string;
  currentStage: CardStageRank;
  copies: number;
  shards: number;
  lastUpgradedAt?: string | null;
  isFavorite?: boolean;
  stageImageUrl: string;
  stages: ProfileCardStage[];
  progression: {
    discipleLevel: number;
    nextStage: CardStageRank | null;
    nextStageImageUrl: string;
    nextStageRequiredLevel: number | null;
    nextStageUpgradeCoins: number;
    nextStageUpgradeItemId: string;
    nextStageUpgradeItemCount: number;
    nextStageShardCost?: number;
    nextStageSuccessChance: number;
    canUpgradeByLevel: boolean;
    hasNextStageImage: boolean;
    hasUpgradeMaterials: boolean;
    hasCoins: boolean;
    upgradeBlockReason?:
      | "max_stage"
      | "missing_stage_image"
      | "disciple_level_too_low"
      | "not_enough_coins"
      | "missing_upgrade_materials"
      | null;
    shardProgress?: {
      current: number;
      required: number;
      enough: boolean;
    };
    copyOverflow?: number;
    canUpgrade: boolean;
  };
}

export interface ProfileCardsResponse {
  cards: ProfileCard[];
  showcase: ProfileCard[];
  showcaseSort?: "manual" | "rarity" | "favorites" | "last_upgraded";
  stats: {
    total: number;
    uniqueTitles: number;
  };
}

export interface CardDeck {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  imageUrl: string;
  price: number;
  isAvailable?: boolean;
  quantity?: number;
  titleId?: string | null;
  titleName?: string;
  cardsPerOpen: number;
  titleFocusChance: number;
  isTitleDeck?: boolean;
  isPremium?: boolean;
  pityThreshold?: number;
  pityTargetRarity?: string;
  pityProgress?: number;
  pityRemaining?: number;
}

/** Ученик (игра «Учитель — ученики») */
export interface Disciple {
  characterId: string;
  titleId: string;
  name?: string;
  avatar?: string;
  titleName?: string;
  recruitedAt: string;
  /** Прогрессия (манхва-стиль). Поля опциональны для обратной совместимости. */
  level?: number;
  exp?: number;
  expToNext?: number;
  /** Ранг: F..S (или любой ваш текст) */
  rank?: "F" | "E" | "D" | "C" | "B" | "A" | "S" | string;
  /** Карточка персонажа для отображения */
  cardMedia?: { mediaUrl: string; mediaType: "image" | "gif"; label?: string } | null;
  /** Техники: выученные и экипированные (id) */
  techniquesLearned?: string[];
  techniquesEquipped?: string[];
  attack: number;
  defense: number;
  speed: number;
  hp: number;
  cp?: number;
  /** На складе — не участвует в боях и вылазках, не получает оттуда опыт */
  inWarehouse?: boolean;
}

export type TechniqueType = "attack" | "movement" | "heal" | "buff" | "debuff" | "ultimate";

export interface TechniqueEntry {
  id: string;
  name: string;
  description?: string;
  type: TechniqueType;
  power: number;
  cooldownTurns: number;
  requiredLevel: number;
  requiredRank: string;
  learnCostCoins: number;
  iconUrl?: string;
  /** Требуемый уровень библиотеки для изучения */
  requiredLibraryLevel?: number;
}

export interface DiscipleTechniquesEntry {
  characterId: string;
  level: number;
  rank: string;
  learned: string[];
  equipped: string[];
  available: TechniqueEntry[];
}

export interface WeeklyBattleStatus {
  /** Можно ли провести недельный бой прямо сейчас */
  canWeeklyBattle: boolean;
  /** ISO дата, когда будет доступен следующий недельный бой */
  nextWeeklyBattleAt: string | null;
  /** Недельный рейтинг/дивизион (опционально) */
  weeklyRating?: number;
  weeklyDivision?: string;
  weeklyWins?: number;
  weeklyLosses?: number;
  seasonEndsAt?: string | null;
}

/** Прогресс библиотеки (разблокировка техник) */
export interface DisciplesLibraryState {
  level: number;
  exp: number;
  expToNext: number;
}

/** Ответ профиля учеников */
export interface ProfileDisciplesResponse {
  disciples: Disciple[];
  maxDisciples: number;
  /** Основной ученик (больше доли общего опыта в играх) */
  primaryDiscipleCharacterId?: string | null;
  library?: DisciplesLibraryState;
  combatRating: number;
  canTrain: boolean;
  canBattle: boolean;
  /** Лимит аренных боёв в сутки (с сервера) */
  maxBattlesPerDay?: number;
  /** Количество проведённых боёв сегодня */
  dailyBattlesCount?: number;
  /** Роль пользователя (admin, user) */
  role?: string;
  /** Weekly PvP (1 бой/неделя). Опционально, если бэкенд ещё не обновлён */
  weekly?: WeeklyBattleStatus;
  balance: number;
  rerollCostCoins: number;
  trainCostCoins: number;
  /** Пул призыва кандидата: весь каталог или только персонажи из закладок */
  characterPool?: "all" | "bookmarks";
  lastRerollCandidate: {
    characterId: string;
    titleId: string;
    name: string;
    avatar?: string;
    titleName?: string;
    attack: number;
    defense: number;
    speed: number;
    hp: number;
  } | null;
}

/** Кандидат с реролла */
export interface RerollCandidate {
  characterId: string;
  titleId: string;
  name: string;
  avatar?: string;
  titleName?: string;
  attack: number;
  defense: number;
  speed: number;
  hp: number;
}

/** Ингредиент рецепта с наличием */
export interface RecipeIngredient {
  itemId: string;
  count: number;
  have: number;
  name?: string;
  icon?: string;
}

/** Рецепт алхимии */
export interface AlchemyRecipeEntry {
  _id: string;
  name: string;
  description: string;
  icon: string;
  coinCost: number;
  ingredients: RecipeIngredient[];
  resultType: string;
  resultPreview?: {
    common?: { itemId: string; name?: string; icon?: string };
    quality?: { itemId: string; name?: string; icon?: string };
    legendary?: { itemId: string; name?: string; icon?: string };
  };
  canCraft: boolean;
}

/** Сегмент колеса */
export interface WheelSegment {
  rewardType: string;
  label: string;
  weight?: number;
  param?: number | { itemId: string; count: number };
  icon?: string;
  rarity?: string;
  rewardMeta?: {
    kind: string;
    valueText?: string;
  };
}

/** Ответ колеса судьбы */
export interface WheelResponse {
  segments: WheelSegment[];
  spinCostCoins: number;
  canSpin: boolean;
  lastWheelSpinAt: string | null;
  nextSpinAt?: string | null;
  balance?: number;
}
