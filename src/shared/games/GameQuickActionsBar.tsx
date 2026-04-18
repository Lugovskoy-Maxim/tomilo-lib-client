"use client";

import { useState } from 'react';
import { Dumbbell, Swords, CalendarDays, Compass, Loader2, Package, ClipboardList, Users, LibraryBig, FlaskConical, CircleDot } from 'lucide-react';
import Tooltip from '@/shared/ui/Tooltip';
import { useRouter } from 'next/navigation';
import { useWheelSpinMutation } from '@/store/api/gamesApi';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/utils';

interface QuickActionsProps {
  disciplesData?: {
    canTrain: boolean;
    trainCostCoins?: number;
    balance: number;
    subTab: string;
    onTrain: () => void;
    isTraining: boolean;
    onBattle?: () => void;
    isBattling?: boolean;
    onWeeklyBattle?: () => void;
    isWeeklyBattling?: boolean;
    battleRemaining?: number;
    weeklyRemaining?: number;
  };
  expeditionData?: {
    canStart: boolean;
    inProgress: boolean;
    completesAt?: string;
    balance: number;
    costs: Record<string, number>;
    onStartExpedition: (difficulty: 'easy' | 'normal' | 'hard') => void;
    progressPercent?: number;
  };
  currentTab: string;
  onTabChange?: (tab: string) => void;
}

export function GameQuickActionsBar({ disciplesData, expeditionData, currentTab }: QuickActionsProps) {
  const [showExpeditionDropdown, setShowExpeditionDropdown] = useState(false);
  const [spinWheel, { isLoading: isSpinning }] = useWheelSpinMutation();
  const toast = useToast();

  const canShowDisciplesActions = disciplesData && currentTab === 'disciples';
  const canShowExpedition = expeditionData && currentTab === 'expedition';

  const handleWheelSpin = async () => {
    if (isSpinning) return;
    try {
      const result = await spinWheel().unwrap();
      const rewardLabel = result.data?.label ?? 'награда';
      toast.success(`Вы получили: ${rewardLabel}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось прокрутить колесо"));
    }
  };

  const trainBtn = disciplesData ? (
    <Tooltip 
      content={disciplesData.canTrain ? `Тренировка отряда (${disciplesData.trainCostCoins} монет)` : 'Сегодня тренировка уже проведена'} 
      position="top" 
      trigger="hover"
    >
      <button
        disabled={!disciplesData.canTrain || disciplesData.balance < (disciplesData.trainCostCoins ?? 0) || disciplesData.isTraining}
        onClick={disciplesData.onTrain}
        className="games-btn games-btn-secondary flex items-center gap-2 px-4 py-2 transition-all opacity-90 disabled:opacity-50 disabled:cursor-not-allowed hover:disabled:opacity-50"
      >
        {disciplesData.isTraining ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Dumbbell className="w-4 h-4" />
        )}
        Тренировка
      </button>
    </Tooltip>
  ) : null;

  const battleBtn = disciplesData?.subTab === 'arena' ? (
    <Tooltip
      content={disciplesData.battleRemaining ? `Арена PvP (осталось боёв: ${disciplesData.battleRemaining})` : "Арена PvP"}
      position="top"
      trigger="hover"
    >
      <button
        onClick={disciplesData.onBattle}
        disabled={!disciplesData.onBattle || disciplesData.isBattling}
        className="games-btn games-btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disciplesData.isBattling ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Swords className="w-4 h-4" />
        )}
        Арена
        {disciplesData.battleRemaining !== undefined && (
          <span className="text-xs bg-[var(--primary)]/20 px-1.5 py-0.5 rounded-full">
            {disciplesData.battleRemaining}
          </span>
        )}
      </button>
    </Tooltip>
  ) : null;

  const weeklyBtn = disciplesData?.subTab === 'weekly' ? (
    <Tooltip
      content={disciplesData.weeklyRemaining ? `Недельная схватка (осталось: ${disciplesData.weeklyRemaining})` : "Недельная схватка"}
      position="top"
      trigger="hover"
    >
      <button
        onClick={disciplesData.onWeeklyBattle}
        disabled={!disciplesData.onWeeklyBattle || disciplesData.isWeeklyBattling}
        className="games-btn games-btn-secondary flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disciplesData.isWeeklyBattling ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CalendarDays className="w-4 h-4" />
        )}
        Неделя
        {disciplesData.weeklyRemaining !== undefined && (
          <span className="text-xs bg-[var(--secondary)]/20 px-1.5 py-0.5 rounded-full">
            {disciplesData.weeklyRemaining}
          </span>
        )}
      </button>
    </Tooltip>
  ) : null;

  const expeditionBtn = canShowExpedition && (
    <div className="relative">
      <Tooltip
        content={expeditionData?.inProgress ? 'В пути...' : expeditionData?.canStart ? 'Отправить экспедицию' : 'Кулдаун'}
        position="top"
        trigger="hover"
      >
        <button
          className="games-btn games-btn-secondary flex items-center gap-2 px-4 py-2 relative overflow-hidden"
          onClick={() => setShowExpeditionDropdown(v => !v)}
        >
          <Compass className="w-4 h-4" />
          {expeditionData?.inProgress ? 'Поход' : 'Экспедиция'}
          {expeditionData?.inProgress && expeditionData.progressPercent && (
            <div
              className="absolute inset-0 bg-[var(--primary)]/20"
              style={{
                width: `${expeditionData.progressPercent}%`,
                mask: 'linear-gradient(90deg, transparent 0%, black 100%)'
              }}
            />
          )}
        </button>
      </Tooltip>
      {showExpeditionDropdown && expeditionData?.canStart && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-50 p-2 space-y-1">
          {(['easy', 'normal', 'hard'] as const).map(diff => (
            <Tooltip key={diff} content={`Сложность: ${diff}`} position="top">
              <button
                onClick={() => {
                  expeditionData.onStartExpedition(diff);
                  setShowExpeditionDropdown(false);
                }}
                disabled={expeditionData.balance < expeditionData.costs[diff]}
                className="w-full text-left p-2 text-sm rounded-lg hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)} ({expeditionData.costs[diff]} <span className="text-amber-500">₿</span>)
              </button>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );

  const wheelBtn = (
    <Tooltip content="Прокрутить колесо" position="top" trigger="hover">
      <button
        onClick={handleWheelSpin}
        disabled={isSpinning}
        className="games-btn games-btn-secondary flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSpinning ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CircleDot className="w-4 h-4" />
        )}
        Колесо
      </button>
    </Tooltip>
  );

  const router = useRouter();
  
  const navigationButtons = [
    { id: 'inventory', label: 'Инвентарь', icon: Package },
    { id: 'quests', label: 'Квесты', icon: ClipboardList },
    { id: 'disciples', label: 'Ученики', icon: Users },
    { id: 'expedition', label: 'Экспедиция', icon: Compass },
    { id: 'cards', label: 'Карточки', icon: LibraryBig },
    { id: 'alchemy', label: 'Алхимия', icon: FlaskConical },
    { id: 'wheel', label: 'Колесо', icon: CircleDot },
  ];

  const handleTabChange = (tabId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    router.replace(url.pathname + '?' + url.searchParams.toString());
  };

  // Determine if we should render as tabs (no action data) or as quick actions bar
  const hasActionData = disciplesData || expeditionData;
  
  if (!hasActionData) {
    // Render as tabs replacement
    return (
      <div className="games-tabs-replacement w-full">
        <div className="flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1 flex-1 overflow-x-auto py-1" role="tablist">
            {navigationButtons.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${currentTab === id ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'}`}
                aria-selected={currentTab === id}
                role="tab"
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
          {/* Action buttons removed per request */}
        </div>
      </div>
    );
  }

  // Original quick actions bar (with action buttons)
  return (
    <div className="sticky top-4 z-0 games-quick-bar w-full max-w-lg mx-auto pointer-events-none">
      <div className="bg-[var(--card)]/98 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl p-4 flex gap-3 flex-wrap justify-center mx-2 pointer-events-auto">
        {canShowDisciplesActions && trainBtn}
        {battleBtn}
        {weeklyBtn}
        {expeditionBtn}
        {wheelBtn}
        
        {/* Navigation buttons - always visible */}
        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-3 ml-1">
          {navigationButtons.map(({ id, label, icon: Icon }) => (
            <Tooltip key={id} content={label} position="top" trigger="hover">
              <button
                onClick={() => handleTabChange(id)}
                className={`p-2 rounded-lg transition-colors ${currentTab === id ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'hover:bg-[var(--muted)]'}`}
                aria-label={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
