"use client";

import { UserProfile } from "@/types/user";
import { Gift, Flame, Check, Sparkles, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useClaimDailyBonusMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";

interface DailyBonusProps {
  userProfile: UserProfile;
  onClaimBonus?: () => void;
}

const STREAK_MILESTONES = [
  { days: 7, bonus: "+50 XP, +5 монет", icon: "🔥" },
  { days: 14, bonus: "+100 XP, +10 монет", icon: "🌟" },
  { days: 21, bonus: "+150 XP, +15 монет", icon: "💎" },
  { days: 30, bonus: "+250 XP, +25 монет", icon: "👑" },
];

function getNextMilestone(currentStreak: number) {
  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak < milestone.days) {
      return milestone;
    }
  }
  return null;
}

function getDaysUntilMilestone(currentStreak: number, milestoneDays: number): number {
  return milestoneDays - currentStreak;
}

export default function DailyBonus({ userProfile, onClaimBonus }: DailyBonusProps) {
  const [claimDailyBonus, { isLoading }] = useClaimDailyBonusMutation();
  const toast = useToast();
  const [localStreak, setLocalStreak] = useState<number | null>(null);
  const [claimed, setClaimed] = useState(false);

  const currentStreak = localStreak ?? userProfile.currentStreak ?? 0;

  const { canClaim, nextMilestone, daysToMilestone } = useMemo(() => {
    const milestone = getNextMilestone(currentStreak);
    const daysLeft = milestone ? getDaysUntilMilestone(currentStreak, milestone.days) : 0;
    return {
      canClaim: !claimed,
      nextMilestone: milestone,
      daysToMilestone: daysLeft,
    };
  }, [currentStreak, claimed]);

  const handleClaimBonus = async () => {
    try {
      const result = await claimDailyBonus().unwrap();
      const data = result.data;
      if (result.success && data) {
        setLocalStreak(data.currentStreak);
        setClaimed(true);
        const xpGained = data.experienceGained ?? 10;
        const coinsGained = data.coinsGained;
        if (xpGained > 0) {
          const message = coinsGained
            ? `+${xpGained} XP и +${coinsGained} монет!`
            : `+${xpGained} XP!`;
          toast.success(`Бонус получен! ${message}`);
        } else {
          toast.info(data.message ?? "Бонус уже получен сегодня");
        }
        onClaimBonus?.();
      } else {
        toast.error(data?.message ?? "Не удалось получить бонус");
      }
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message ?? "Ошибка при получении бонуса");
    }
  };

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-gradient-to-br from-[var(--card)] to-[var(--card)]/80 overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
              <Gift className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Ежедневный бонус</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                {canClaim ? "Доступен к получению" : "Уже получен сегодня"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-500">{currentStreak}</span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {currentStreak === 1 ? "день" : currentStreak < 5 ? "дня" : "дней"}
            </span>
          </div>
        </div>

        {canClaim ? (
          <button
            type="button"
            onClick={handleClaimBonus}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {isLoading ? "Получение..." : "Получить бонус"}
            {!isLoading && <span className="text-sm opacity-80">+10 XP</span>}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">Бонус получен</span>
          </div>
        )}

        {nextMilestone && (
          <div className="mt-4 p-3 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]/50">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{nextMilestone.icon}</span>
                <span className="text-xs font-medium text-[var(--foreground)]">
                  Серия {nextMilestone.days} дней
                </span>
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">
                ещё {daysToMilestone}{" "}
                {daysToMilestone === 1 ? "день" : daysToMilestone < 5 ? "дня" : "дней"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                  style={{
                    width: `${((nextMilestone.days - daysToMilestone) / nextMilestone.days) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-amber-500 font-medium shrink-0">
                {nextMilestone.bonus}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          {STREAK_MILESTONES.map(milestone => {
            const isAchieved = currentStreak >= milestone.days;
            const isCurrent = nextMilestone?.days === milestone.days;

            return (
              <div
                key={milestone.days}
                className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300 ${
                  isAchieved
                    ? "bg-green-500/15 border border-green-500/30"
                    : isCurrent
                      ? "bg-orange-500/15 border border-orange-500/30 animate-pulse"
                      : "bg-[var(--secondary)]/30 border border-[var(--border)]/40 opacity-50"
                }`}
              >
                <span className="text-base">{milestone.icon}</span>
                <span
                  className={`text-[10px] font-bold ${
                    isAchieved
                      ? "text-green-500"
                      : isCurrent
                        ? "text-orange-500"
                        : "text-[var(--muted-foreground)]"
                  }`}
                >
                  {milestone.days}д
                </span>
                {isAchieved && (
                  <Check className="absolute -top-1 -right-1 w-4 h-4 text-green-500 bg-[var(--card)] rounded-full p-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
