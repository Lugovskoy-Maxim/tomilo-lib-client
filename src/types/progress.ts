import { RankInfo } from "@/lib/rank-utils";
import { UserAchievement } from "./user";

export type ProgressEventType = "level_up" | "achievement" | "exp_gain";

export interface LevelUpEvent {
  id: string;
  type: "level_up";
  oldLevel: number;
  newLevel: number;
  oldRank: RankInfo;
  newRank: RankInfo;
  timestamp: string;
}

export interface AchievementEvent {
  id: string;
  type: "achievement";
  achievement: UserAchievement;
  timestamp: string;
}

export interface ExpGainEvent {
  id: string;
  type: "exp_gain";
  amount: number;
  reason: string;
  timestamp: string;
}

export type ProgressEvent = LevelUpEvent | AchievementEvent | ExpGainEvent;

export interface ProgressHistory {
  events: ProgressEvent[];
  lastUpdated: string;
}

/** Ответ от сервера при добавлении в историю чтения с прогрессом */
export interface ProgressEventFromServer {
  expGained: number;
  reason: string;
  levelUp: boolean;
  newLevel?: number;
  oldLevel?: number;
  bonusCoins?: number;
}

export interface RankInfoFromServer {
  rank: number;
  stars: number;
  name: string;
  minLevel: number;
}

export type AchievementRarityFromServer =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export type AchievementTypeFromServer =
  | "reading"
  | "collection"
  | "social"
  | "veteran"
  | "special"
  | "level";

export interface UnlockedAchievementFromServer {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AchievementTypeFromServer;
  rarity: AchievementRarityFromServer;
  level: number;
  levelName: string;
  unlockedAt: string;
  progress: number;
  maxProgress: number;
}

export interface ReadingProgressResponse {
  user: {
    _id: string;
    level: number;
    experience: number;
    balance: number;
  };
  progress?: ProgressEventFromServer;
  oldRank?: RankInfoFromServer;
  newRank?: RankInfoFromServer;
  newAchievements?: UnlockedAchievementFromServer[];
}
