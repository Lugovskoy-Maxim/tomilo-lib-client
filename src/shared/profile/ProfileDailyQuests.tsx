"use client";

import { ClipboardList, Check, Loader2, Coins, Sparkles } from "lucide-react";
import { useGetDailyQuestsQuery, useClaimDailyQuestMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";

interface ProfileDailyQuestsProps {
  /** Показать только первые N заданий (для компактного обзора) */
  maxVisible?: number;
}

export default function ProfileDailyQuests({ maxVisible }: ProfileDailyQuestsProps = {}) {
  const { data: response, isLoading, isError } = useGetDailyQuestsQuery(undefined, {
    skip: typeof window === "undefined",
  });
  const [claimQuest, { isLoading: isClaiming }] = useClaimDailyQuestMutation();
  const toast = useToast();

  const data = response?.success ? response.data : null;
  const allQuests = data?.quests ?? [];
  const quests = maxVisible != null ? allQuests.slice(0, maxVisible) : allQuests;

  const handleClaim = async (questId: string) => {
    try {
      const result = await claimQuest(questId).unwrap();
      const d = result.data;
      if (result.success && d?.success) {
        const parts = [];
        if (d.expGained) parts.push(`+${d.expGained} XP`);
        if (d.coinsGained) parts.push(`+${d.coinsGained} монет`);
        if (parts.length) toast.success(`Награда: ${parts.join(", ")}`);
      } else {
        toast.info(d?.message ?? "Награда уже получена");
      }
    } catch {
      toast.error("Не удалось получить награду");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-[var(--card)] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
            <ClipboardList className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Ежедневные задания</h3>
            <p className="text-xs text-[var(--muted-foreground)]">Загрузка...</p>
          </div>
        </div>
        <div className="flex justify-center py-6">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--muted-foreground)]" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return null;
  }

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-[var(--card)] overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
            <ClipboardList className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Ежедневные задания</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Выполняйте задания и забирайте награды
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {quests.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)] py-2">
              На сегодня заданий нет. Зайдите завтра.
            </p>
          ) : (
            quests.map(q => {
              const done = q.progress >= q.target;
              const claimed = !!q.claimedAt;
              const canClaim = done && !claimed;

              return (
                <div
                  key={q.id}
                  className={`rounded-xl border p-3 transition-all ${
                    claimed
                      ? "bg-green-500/10 border-green-500/30"
                      : done
                        ? "bg-indigo-500/10 border-indigo-500/30"
                        : "bg-[var(--secondary)]/30 border-[var(--border)]/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">
                        {q.name}
                      </p>
                      {q.description && (
                        <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                          {q.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                      {q.rewardExp > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          +{q.rewardExp}
                        </span>
                      )}
                      {q.rewardCoins > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Coins className="w-3 h-3 text-amber-500" />
                          +{q.rewardCoins}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (q.progress / q.target) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] tabular-nums text-[var(--muted-foreground)] shrink-0">
                      {q.progress}/{q.target}
                    </span>
                  </div>
                  {canClaim && (
                    <button
                      type="button"
                      onClick={() => handleClaim(q.id)}
                      disabled={isClaiming}
                      className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 disabled:opacity-70"
                    >
                      {isClaiming ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Забрать награду
                    </button>
                  )}
                  {claimed && (
                    <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-green-500">
                      <Check className="w-3.5 h-3.5" />
                      Награда получена
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
