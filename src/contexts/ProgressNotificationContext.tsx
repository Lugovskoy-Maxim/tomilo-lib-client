"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { 
  ProgressEvent, 
  LevelUpEvent, 
  AchievementEvent, 
  ExpGainEvent,
  ProgressHistory 
} from "@/types/progress";
import { RankInfo } from "@/lib/rank-utils";
import { UserAchievement } from "@/types/user";

const HISTORY_STORAGE_KEY = "progress_history";
const MAX_HISTORY_EVENTS = 100;

interface ProgressNotificationContextType {
  levelUpEvent: LevelUpEvent | null;
  achievementEvents: AchievementEvent[];
  expGainEvents: ExpGainEvent[];
  history: ProgressEvent[];
  showLevelUp: (oldLevel: number, newLevel: number, oldRank: RankInfo, newRank: RankInfo) => void;
  showAchievement: (achievement: UserAchievement) => void;
  showExpGain: (amount: number, reason: string) => void;
  dismissLevelUp: () => void;
  dismissAchievement: (id: string) => void;
  dismissExpGain: (id: string) => void;
  clearHistory: () => void;
}

const ProgressNotificationContext = createContext<ProgressNotificationContextType | undefined>(undefined);

export function useProgressNotification() {
  const context = useContext(ProgressNotificationContext);
  if (!context) {
    throw new Error("useProgressNotification must be used within a ProgressNotificationProvider");
  }
  return context;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function loadHistoryFromStorage(): ProgressEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      const parsed: ProgressHistory = JSON.parse(stored);
      return parsed.events || [];
    }
  } catch {
    // ignore
  }
  return [];
}

function saveHistoryToStorage(events: ProgressEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    const history: ProgressHistory = {
      events: events.slice(0, MAX_HISTORY_EVENTS),
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

interface ProgressNotificationProviderProps {
  children: ReactNode;
}

export function ProgressNotificationProvider({ children }: ProgressNotificationProviderProps) {
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);
  const [achievementEvents, setAchievementEvents] = useState<AchievementEvent[]>([]);
  const [expGainEvents, setExpGainEvents] = useState<ExpGainEvent[]>([]);
  const [history, setHistory] = useState<ProgressEvent[]>([]);

  useEffect(() => {
    setHistory(loadHistoryFromStorage());
  }, []);

  const addToHistory = useCallback((event: ProgressEvent) => {
    setHistory(prev => {
      const newHistory = [event, ...prev].slice(0, MAX_HISTORY_EVENTS);
      saveHistoryToStorage(newHistory);
      return newHistory;
    });
  }, []);

  const showLevelUp = useCallback((
    oldLevel: number, 
    newLevel: number, 
    oldRank: RankInfo, 
    newRank: RankInfo
  ) => {
    const event: LevelUpEvent = {
      id: generateId(),
      type: "level_up",
      oldLevel,
      newLevel,
      oldRank,
      newRank,
      timestamp: new Date().toISOString(),
    };
    setLevelUpEvent(event);
    addToHistory(event);
  }, [addToHistory]);

  const showAchievement = useCallback((achievement: UserAchievement) => {
    const event: AchievementEvent = {
      id: generateId(),
      type: "achievement",
      achievement,
      timestamp: new Date().toISOString(),
    };
    setAchievementEvents(prev => [...prev, event]);
    addToHistory(event);
  }, [addToHistory]);

  const showExpGain = useCallback((amount: number, reason: string) => {
    const event: ExpGainEvent = {
      id: generateId(),
      type: "exp_gain",
      amount,
      reason,
      timestamp: new Date().toISOString(),
    };
    setExpGainEvents(prev => [...prev, event]);
    addToHistory(event);
  }, [addToHistory]);

  const dismissLevelUp = useCallback(() => {
    setLevelUpEvent(null);
  }, []);

  const dismissAchievement = useCallback((id: string) => {
    setAchievementEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const dismissExpGain = useCallback((id: string) => {
    setExpGainEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
  }, []);

  const value: ProgressNotificationContextType = {
    levelUpEvent,
    achievementEvents,
    expGainEvents,
    history,
    showLevelUp,
    showAchievement,
    showExpGain,
    dismissLevelUp,
    dismissAchievement,
    dismissExpGain,
    clearHistory,
  };

  return (
    <ProgressNotificationContext.Provider value={value}>
      {children}
    </ProgressNotificationContext.Provider>
  );
}
