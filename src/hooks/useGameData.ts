import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseUrlAPI } from '@/api/config';

export interface InventoryItem {
  itemId: string;
  count: number;
  name: string;
  icon: string;
}

export interface Disciple {
  _id: string;
  characterId: string;
  level: number;
  exp: number;
  element: string;
  techniques: string[];
  inWarehouse: boolean;
}

export interface GameData {
  balance: number;
  level: number;
  experience: number;
  inventory: InventoryItem[];
  disciples: {
    active: Disciple[];
    total: Disciple[];
    maxActive: number;
    primaryCharacterId: string | null;
    combatRating: number;
    lastRerollCandidate: string | null;
  };
  alchemy: {
    level: number;
    exp: number;
    cauldronTier: number;
    lastCraftedAt: string | null;
    canCraft: boolean;
    shopAssortment: unknown[];
  };
  wheel: {
    lastSpinAt: string | null;
    canSpin: boolean;
  };
  battles: {
    dailyCount: number;
    dailyLimit: number;
    remaining: number;
    canBattle: boolean;
    weeklyRating: number;
    weeklyWins: number;
    weeklyLosses: number;
    lastWeeklyBattleAt: string | null;
  };
  expedition: {
    lastExpeditionAt: string | null;
    completesAt: string | null;
    difficulty: string | null;
    lastResult: unknown | null;
    inProgress: boolean;
  };
  library: {
    level: number;
    exp: number;
  };
  dailyQuests: unknown | null;
  limits: {
    canTrain: boolean;
    canBattle: boolean;
    canCraft: boolean;
    canSpin: boolean;
  };
}

export function useGameData() {
  return useQuery<GameData>({
    queryKey: ['gameData'],
    queryFn: async () => {
      const res = await fetch(`${baseUrlAPI}/users/profile/game-data`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to fetch game data');
      }
      const data = await res.json();
      return data.data as GameData;
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
}

export function useRefreshGameData() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['gameData'] });
}

export function useDailyBonus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${baseUrlAPI}/users/daily-bonus`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to claim daily bonus');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameData'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useClaimDailyQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questId: string) => {
      const res = await fetch(`${baseUrlAPI}/users/daily-quests/claim`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId }),
      });
      if (!res.ok) throw new Error('Failed to claim quest reward');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameData'] });
      queryClient.invalidateQueries({ queryKey: ['dailyQuests'] });
    },
  });
}
