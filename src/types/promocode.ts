/** Типы наград промокода */
export type PromoCodeRewardType = 
  | "balance"        // Монеты на баланс
  | "decoration"     // Декорация (аватар, рамка, фон, карточка)
  | "premium";       // Премиум-статус на N дней

/** Награда промокода */
export interface PromoCodeReward {
  type: PromoCodeRewardType;
  /** Для balance — количество монет, для premium — количество дней */
  amount?: number;
  /** Для decoration — ID декорации */
  decorationId?: string;
  /** Название награды для отображения */
  displayName?: string;
}

/** Статус промокода */
export type PromoCodeStatus = "active" | "inactive" | "expired" | "exhausted";

/** Промокод */
export interface PromoCode {
  id: string;
  /** Уникальный код (например, "WELCOME2024") */
  code: string;
  /** Описание промокода */
  description?: string;
  /** Награды при активации */
  rewards: PromoCodeReward[];
  /** Максимальное количество использований (null = безлимит) */
  maxUses: number | null;
  /** Текущее количество использований */
  usedCount: number;
  /** Максимум использований одним пользователем */
  maxUsesPerUser: number;
  /** Дата начала действия */
  startsAt?: string;
  /** Дата окончания действия */
  expiresAt?: string;
  /** Статус */
  status: PromoCodeStatus;
  /** Только для новых пользователей (зарегистрированных в последние N дней) */
  newUsersOnly?: boolean;
  /** Минимальный уровень для активации */
  minLevel?: number;
  /** Дата создания */
  createdAt: string;
  /** Дата обновления */
  updatedAt: string;
  /** Кто создал */
  createdBy?: string;
}

/** Запись об использовании промокода */
export interface PromoCodeUsage {
  id: string;
  promoCodeId: string;
  promoCode?: string;
  userId: string;
  username?: string;
  usedAt: string;
  rewardsGranted: PromoCodeReward[];
}

/** DTO для создания промокода */
export interface CreatePromoCodeDto {
  code: string;
  description?: string;
  rewards: PromoCodeReward[];
  maxUses?: number | null;
  maxUsesPerUser?: number;
  startsAt?: string;
  expiresAt?: string;
  status?: PromoCodeStatus;
  newUsersOnly?: boolean;
  minLevel?: number;
}

/** DTO для обновления промокода */
export interface UpdatePromoCodeDto {
  code?: string;
  description?: string;
  rewards?: PromoCodeReward[];
  maxUses?: number | null;
  maxUsesPerUser?: number;
  startsAt?: string;
  expiresAt?: string;
  status?: PromoCodeStatus;
  newUsersOnly?: boolean;
  minLevel?: number;
}

/** Результат активации промокода */
export interface RedeemPromoCodeResult {
  success: boolean;
  message: string;
  rewards?: PromoCodeReward[];
  newBalance?: number;
}
