"use client";

import { useState, useMemo } from "react";
import { ClipboardList, Check, Loader2, Coins, Sparkles, Gift, Target, Search } from "lucide-react";
import { useGetDailyQuestsQuery, useClaimDailyQuestMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";
import { GameResultReveal } from "@/shared/games";
import Input from "@/shared/ui/input";
import Tooltip from "@/shared/ui/Tooltip";

interface ProfileDailyQuestsProps {
  /** Показать только первые N заданий (для компактного обзора) */
  maxVisible?: number;
  /** На странице игр — оформление в стиле `games-panel` и `--primary` */
  variant?: "profile" | "games";
}

/** Форматирует время до сброса: "5 ч 23 мин", "менее минуты", "завтра в 00:00" */
function formatResetIn(resetAtIso: string): string {
  const reset = new Date(resetAtIso);
  const now = new Date();
  const ms = reset.getTime() - now.getTime();
  if (ms <= 0) return "скоро";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return days === 1 ? "завтра в 00:00" : `через ${days} д.`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`;
  }
  return totalMinutes < 1 ? "менее минуты" : `${totalMinutes} мин`;
}

export default function ProfileDailyQuests({ maxVisible, variant = "profile" }: ProfileDailyQuestsProps = {}) {
  const isGames = variant === "games";
  const { data: response, isLoading, isError } = useGetDailyQuestsQuery(undefined, {
    skip: typeof window === "undefined",
  });
  const [claimQuest, { isLoading: isClaiming }] = useClaimDailyQuestMutation();
  const toast = useToast();
  const [reveal, setReveal] = useState<{
    open: boolean;
    title: string;
    subtitle?: string;
    items?: { itemId: string; count: number; name?: string; icon?: string }[];
    exp?: number;
    coins?: number;
  }>({ open: false, title: "" });

  // Состояния для фильтрации и сортировки
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "completed">("all");
  const [sortBy, setSortBy] = useState<"default" | "reward" | "progress">("default");

  const data = response?.success ? response.data : null;
  const questsFromApi = data?.quests;
  const allQuests = useMemo(() => questsFromApi ?? [], [questsFromApi]);

  // Общий прогресс по всем квестам
  const totalProgress = useMemo(() => {
    let completed = 0;
    let total = 0;
    allQuests.forEach(q => {
      if (q.progress >= q.target) completed++;
      total++;
    });
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [allQuests]);

  // Фильтрация и сортировка
  const filteredQuests = useMemo(() => {
    let filtered = [...allQuests];
    // Поиск по названию или описанию
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q =>
        q.name.toLowerCase().includes(query) ||
        (q.description?.toLowerCase() || "").includes(query)
      );
    }
    // Фильтр по статусу
    if (filter === "available") {
      filtered = filtered.filter(q => q.progress < q.target && !q.claimedAt);
    } else if (filter === "completed") {
      filtered = filtered.filter(q => q.progress >= q.target || q.claimedAt);
    }
    // Сортировка
    if (sortBy === "reward") {
      filtered.sort((a, b) => {
        const aReward = (a.rewardExp || 0) + (a.rewardCoins || 0);
        const bReward = (b.rewardExp || 0) + (b.rewardCoins || 0);
        return bReward - aReward;
      });
    } else if (sortBy === "progress") {
      filtered.sort((a, b) => {
        const aProgress = a.progress / a.target;
        const bProgress = b.progress / b.target;
        return bProgress - aProgress;
      });
    } else {
      // default: сначала доступные для взятия, затем по порядку
      filtered.sort((a, b) => {
        const aCanClaim = a.progress >= a.target && !a.claimedAt;
        const bCanClaim = b.progress >= b.target && !b.claimedAt;
        if (aCanClaim && !bCanClaim) return -1;
        if (!aCanClaim && bCanClaim) return 1;
        return 0;
      });
    }
    // Ограничение по maxVisible
    if (maxVisible != null) filtered = filtered.slice(0, maxVisible);
    return filtered;
  }, [allQuests, searchQuery, filter, sortBy, maxVisible]);

  const handleClaim = async (questId: string) => {
    try {
      const result = await claimQuest(questId).unwrap();
      const d = result.data;
      if (result.success && d?.success) {
        const parts = [];
        if (d.expGained) parts.push(`+${d.expGained} XP`);
        if (d.coinsGained) parts.push(`+${d.coinsGained} монет`);
        if (parts.length) toast.success(`Награда: ${parts.join(", ")}`);
        setReveal({
          open: true,
          title: "Награда получена",
          subtitle: d.itemsGained?.length
            ? "Квест закрылся с дополнительными предметами."
            : "Базовые награды уже начислены на аккаунт.",
          items: d.itemsGained,
          exp: d.expGained,
          coins: d.coinsGained,
        });
      } else {
        toast.info(d?.message ?? "Награда уже получена");
      }
    } catch {
      toast.error("Не удалось получить награду");
    }
  };

  if (isLoading) {
    return (
      <div
        className={
          isGames
            ? "games-panel p-4 sm:p-5"
            : "profile-glass-card rounded-2xl p-4 sm:p-5 shadow-sm"
        }
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={
              isGames
                ? "p-2.5 rounded-2xl bg-[color-mix(in_oklch,var(--primary)_14%,transparent)] border border-[color-mix(in_oklch,var(--primary)_28%,var(--border))]"
                : "p-2.5 rounded-2xl bg-violet-500/15 border border-violet-500/25"
            }
          >
            <ClipboardList className={`w-5 h-5 ${isGames ? "text-[var(--primary)]" : "text-violet-500"}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Ежедневные задания</h3>
            <p className="text-xs text-[var(--muted-foreground)]">Загрузка...</p>
          </div>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--muted-foreground)]" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return null;
  }

  return (
    <div className={isGames ? "games-panel p-0 overflow-hidden shadow-sm" : "profile-glass-card rounded-2xl shadow-sm"}>
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className={
                isGames
                  ? "p-2.5 rounded-2xl bg-[color-mix(in_oklch,var(--primary)_14%,transparent)] border border-[color-mix(in_oklch,var(--primary)_28%,var(--border))]"
                  : "p-2.5 rounded-2xl bg-violet-500/15 border border-violet-500/25"
              }
            >
              <ClipboardList className={`w-5 h-5 ${isGames ? "text-[var(--primary)]" : "text-violet-500"}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Ежедневные задания</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Выполняйте и забирайте награды до сброса
              </p>
            </div>
          </div>
          {data.resetAt ? (
            <p className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
              Обновление через: {formatResetIn(data.resetAt)}
            </p>
          ) : null}
        </div>
       {/* Общий прогресс */}
        <div className="games-panel py-3 px-4 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="games-muted text-xs">Прогресс дня</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {totalProgress.completed} из {totalProgress.total} заданий ({totalProgress.percent}%)
              </p>
            </div>
            <div className="h-2 flex-1 max-w-[200px] rounded-full bg-[var(--secondary)]/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: `${totalProgress.percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Блок управления: поиск, фильтры, сортировка */}
        {filteredQuests.length > 0 && (
          <div className="games-panel py-3 px-4 mb-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] max-w-md">
                <Input
                  type="search"
                  placeholder="Поиск по названию или описанию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={Search}
                  className="text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Tooltip content="Фильтр по статусу" position="top" trigger="hover">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as "all" | "available" | "completed")}
                    className="games-select text-xs"
                  >
                    <option value="all">Все задания</option>
                    <option value="available">Доступные</option>
                    <option value="completed">Завершённые</option>
                  </select>
                </Tooltip>
                <Tooltip content="Сортировка" position="top" trigger="hover">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "default" | "reward" | "progress")}
                    className="games-select text-xs"
                  >
                    <option value="default">По умолчанию</option>
                    <option value="reward">По награде</option>
                    <option value="progress">По прогрессу</option>
                  </select>
                </Tooltip>
              </div>
            </div>
            <p className="games-muted text-xs">
              Показано: <strong>{filteredQuests.length}</strong> из {allQuests.length} заданий
              {searchQuery && ` по запросу «${searchQuery}»`}
              {filter !== "all" && `, фильтр: ${filter === "available" ? "доступные" : "завершённые"}`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
          {filteredQuests.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-[var(--border)]/60 bg-[var(--secondary)]/20 py-8 text-center">
              <Target className="w-8 h-8 mx-auto text-[var(--muted-foreground)]/60 mb-2" />
              <p className="text-sm text-[var(--muted-foreground)]">На сегодня заданий нет</p>
              <p className="text-xs text-[var(--muted-foreground)]/80 mt-0.5">Зайдите завтра</p>
            </div>
          ) : (
            filteredQuests.map((q: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const done = q.progress >= q.target;
              const claimed = !!q.claimedAt;
              const canClaim = done && !claimed;
              const progressPct = Math.min(100, (q.progress / q.target) * 100);

              return (
                <article
                  key={q.id}
                  className={`
                    group relative rounded-xl overflow-hidden
                    flex flex-col min-h-0 transition-all duration-200
                    border
                    ${claimed
                      ? "bg-emerald-500/5 border-emerald-500/20 shadow-none"
                      : canClaim
                        ? isGames
                          ? "bg-[color-mix(in_oklch,var(--primary)_10%,var(--card))] border-[color-mix(in_oklch,var(--primary)_35%,var(--border))] ring-1 ring-[color-mix(in_oklch,var(--primary)_18%,transparent)]"
                          : "bg-violet-500/8 border-violet-500/25 ring-1 ring-violet-500/10"
                        : "bg-[var(--secondary)]/20 border-[var(--border)]/40 hover:border-[var(--border)]/60"
                    }
                  `}
                >
                  {/* Верх: название + бейдж прогресса + награды */}
                  <div className="p-3 pb-0 flex flex-col gap-2 min-h-0 shrink-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-[13px] font-semibold text-[var(--foreground)] line-clamp-2 leading-tight min-w-0 flex-1">
                        {q.name}
                      </h4>
                      <span
                        className={`
                          shrink-0 flex items-center justify-center min-w-[2rem] h-7 rounded-lg text-xs font-bold tabular-nums
                          ${claimed
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : done
                              ? isGames
                                ? "bg-[color-mix(in_oklch,var(--primary)_18%,transparent)] text-[var(--primary)]"
                                : "bg-violet-500/20 text-violet-600 dark:text-violet-400"
                              : "bg-[var(--secondary)]/80 text-[var(--muted-foreground)]"
                          }
                        `}
                      >
                        {claimed ? "✓" : `${q.progress}/${q.target}`}
                      </span>
                    </div>
                    {q.description ? (
                      <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 leading-snug">
                        {q.description}
                      </p>
                    ) : null}

                    {/* Награды — компактный ряд */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {q.rewardExp > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                          <Sparkles className="w-3 h-3" />
                          +{q.rewardExp}
                        </span>
                      )}
                      {q.rewardCoins > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                          <Coins className="w-3 h-3" />
                          +{q.rewardCoins}
                        </span>
                      )}
                      {q.rewardItems?.slice(0, 2).map((item: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <span
                          key={`${q.id}-${item.itemId}`}
                          className="inline-flex items-center gap-1 rounded-md bg-[var(--secondary)]/60 px-1.5 py-0.5 text-[10px] text-[var(--foreground)]/90 max-w-[80px] truncate"
                        >
                          {item.icon ? (
                            <img src={item.icon} alt="" className="w-3 h-3 rounded shrink-0 object-cover" />
                          ) : (
                            <Gift className="w-3 h-3 shrink-0 text-[var(--muted-foreground)]" />
                          )}
                          <span className="truncate">{item.name || item.itemId}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Прогресс-бар на всю ширину */}
                  <div className="px-3 pb-2 pt-1 shrink-0">
                    <div className="h-1.5 w-full rounded-full bg-[var(--secondary)]/60 overflow-hidden">
                      <div
                        className={`
                          h-full rounded-full transition-all duration-500
                          ${claimed ? "bg-emerald-500" : done ? (isGames ? "bg-[var(--primary)]" : "bg-violet-500") : isGames ? "bg-[color-mix(in_oklch,var(--primary)_75%,var(--muted-foreground))]" : "bg-violet-500/70"}
                        `}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Кнопка / статус внизу */}
                  <div className="px-3 pb-3 pt-0 shrink-0">
                    {canClaim && (
                      <button
                        type="button"
                        onClick={() => handleClaim(q.id)}
                        disabled={isClaiming}
                        className={
                          isGames
                            ? "games-btn games-btn-primary w-full py-2 text-xs font-semibold"
                            : "w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-violet-500 text-white text-xs font-semibold hover:bg-violet-600 active:scale-[0.98] disabled:opacity-70 transition-all"
                        }
                      >
                        {isClaiming ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Gift className="w-4 h-4" />
                        )}
                        Забрать награду
                      </button>
                    )}
                    {claimed && (
                      <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4" />
                        Получено
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
      <GameResultReveal
        open={reveal.open}
        title={reveal.title}
        subtitle={reveal.subtitle}
        tone="success"
        onClose={() => setReveal(prev => ({ ...prev, open: false }))}
      >
        <div className="flex flex-wrap gap-2">
          {reveal.exp ? <span className="games-reward-chip">+{reveal.exp} XP</span> : null}
          {reveal.coins ? <span className="games-reward-chip">+{reveal.coins} монет</span> : null}
          {reveal.items?.map(item => (
            <span key={`${item.itemId}-${item.count}`} className="games-reward-chip inline-flex items-center gap-1">
              {item.icon ? <img src={item.icon} alt="" className="w-4 h-4 rounded object-cover" /> : null}
              {item.name || item.itemId} ×{item.count}
            </span>
          ))}
        </div>
      </GameResultReveal>
    </div>
  );
}
