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
