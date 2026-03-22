"use client";

import { useEffect, useMemo, useState } from "react";
import { Compass, ShieldAlert, TimerReset } from "lucide-react";

import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/utils";
import {
  useDisciplesStartExpeditionMutation,
  useGetDisciplesExpeditionStatusQuery,
} from "@/store/api/gamesApi";

import { GameResultReveal } from "./GameResultReveal";
import { GAME_ART } from "./gameArt";

const RAID_OPTIONS: Array<{
  difficulty: "easy" | "normal" | "hard";
  title: string;
  summary: string;
  art: string;
}> = [
  { difficulty: "easy", title: "Разведка", summary: "Низкий риск, быстрый цикл, стартовая добыча.", art: GAME_ART.raids.difficultyEasy },
  { difficulty: "normal", title: "Вылазка", summary: "Сбалансированный режим для ежедневного фарма.", art: GAME_ART.raids.difficultyNormal },
  { difficulty: "hard", title: "Рейд", summary: "Высокий риск засады, лучший шанс на редкую добычу.", art: GAME_ART.raids.difficultyHard },
];

export function RaidsSection() {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useGetDisciplesExpeditionStatusQuery();
  const [startExpedition, { isLoading: isStarting }] = useDisciplesStartExpeditionMutation();
  const [revealOpen, setRevealOpen] = useState(false);
  const [lastShownResultAt, setLastShownResultAt] = useState<string | null>(null);

  const status = data?.data;
  const lastResultAt = typeof status?.lastResult?.at === "string" ? status.lastResult.at : null;

  useEffect(() => {
    if (lastResultAt && lastResultAt !== lastShownResultAt) {
      setRevealOpen(true);
      setLastShownResultAt(lastResultAt);
    }
  }, [lastResultAt, lastShownResultAt]);

  const resultTone = status?.lastResult?.success ? "success" : "warning";
  const lastResultLog = useMemo(() => {
    return Array.isArray(status?.lastResult?.log) ? status?.lastResult?.log.slice(0, 6) : [];
  }, [status?.lastResult?.log]);

  if (isLoading) {
    return <div className="games-empty games-muted">Загрузка вылазок...</div>;
  }

  if (isError || !status) {
    return (
      <div className="games-panel text-[var(--destructive)]">
        <p>Не удалось загрузить статус вылазок и рейдов.</p>
        <button type="button" className="games-btn games-btn-secondary games-btn-sm mt-3" onClick={() => refetch()}>
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="games-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="games-panel-title flex items-center gap-2">
              <Compass className="w-4 h-4 text-[var(--primary)]" aria-hidden />
              Вылазки и рейды
            </h3>
            <p className="games-muted text-sm mt-1">
              Текущая expedition-система оформлена как единый контур походов: от быстрой разведки до полноценного рейда.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="games-badge">Баланс: {status.balance}</span>
            <span className="games-badge">Риск засады: {status.ambushRiskPercent}%</span>
          </div>
        </div>

        {status.inProgress ? (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
              <TimerReset className="w-4 h-4 text-[var(--primary)]" aria-hidden />
              Отряд уже в пути
            </div>
            <p className="games-muted text-sm mt-2">
              Возвращение: <strong className="text-[var(--foreground)]">{status.completesAt ?? "скоро"}</strong>
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            {RAID_OPTIONS.map(option => {
              const cost = status.costs?.[option.difficulty] ?? 0;
              return (
                <div key={option.difficulty} className="games-panel border border-[var(--border)]/70 bg-[var(--muted)]/10 overflow-hidden p-0">
                  <div className="aspect-[16/10] w-full bg-[var(--muted)]/30">
                    <img src={option.art} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                  <div className="text-sm font-semibold text-[var(--foreground)]">{option.title}</div>
                  <p className="games-muted text-xs mt-1">{option.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-3 text-xs">
                    <span className="games-badge">Стоимость: {cost} монет</span>
                    <span className="games-badge">{option.difficulty === "hard" ? "Редкий лут" : "Ежедневный фарм"}</span>
                  </div>
                  <button
                    type="button"
                    disabled={!status.canStart || !status.hasDisciples || isStarting}
                    className="games-btn games-btn-primary mt-4 w-full justify-center"
                    onClick={async () => {
                      try {
                        const result = await startExpedition({ difficulty: option.difficulty }).unwrap();
                        toast.success(
                          `${option.title} начат${option.difficulty === "hard" ? " как рейд" : ""}. Завершение: ${result.data?.completesAt ?? "скоро"}`,
                        );
                        refetch();
                      } catch (error) {
                        toast.error(getErrorMessage(error, "Не удалось отправить отряд"));
                      }
                    }}
                  >
                    {isStarting ? "Отправка..." : `Начать ${option.title.toLowerCase()}`}
                  </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!status.hasDisciples ? (
          <div className="games-panel border border-amber-500/30 bg-amber-500/10 mt-4">
            <p className="games-muted text-sm">
              Сначала соберите хотя бы одного ученика, иначе поход не стартует.
            </p>
          </div>
        ) : null}

        {status.nextExpeditionAt && !status.canStart && !status.inProgress ? (
          <p className="games-muted text-sm mt-3">
            Следующий поход будет доступен после: <strong className="text-[var(--foreground)]">{status.nextExpeditionAt}</strong>
          </p>
        ) : null}
      </div>

      {status.lastResult ? (
        <div className="games-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="games-panel-title">Последний результат похода</h4>
            <span className={`games-badge ${status.lastResult.success ? "" : "games-badge--warning"}`}>
              {status.lastResult.success ? "Успех" : "Провал"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 text-xs">
            <span className="games-badge">Монеты: +{status.lastResult.coinsGained ?? 0}</span>
            <span className="games-badge">Опыт: +{status.lastResult.expGained ?? 0}</span>
            {Array.isArray(status.lastResult.itemsGained)
              ? status.lastResult.itemsGained.map((item: { itemId: string; count: number; name?: string }) => (
                  <span key={`${item.itemId}-${item.count}`} className="games-badge">
                    {item.name ?? item.itemId} ×{item.count}
                  </span>
                ))
              : null}
          </div>
          {status.lastResult.ambush ? (
            <div className="flex items-center gap-2 mt-3 text-sm text-amber-600 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4" aria-hidden />
              {status.lastResult.ambush.preventedByTalisman
                ? "Засада была отражена талисманом."
                : "В рейде произошла засада и часть добычи была потеряна."}
            </div>
          ) : null}
        </div>
      ) : null}

      <GameResultReveal
        open={revealOpen}
        onClose={() => setRevealOpen(false)}
        title={status.lastResult?.success ? "Отряд вернулся с добычей" : "Поход завершился неудачей"}
        subtitle={
          status.lastResult?.success
            ? "Награды уже начислены. Можно сразу оценить лут и решить, запускать ли следующий рейд."
            : "Даже неудачная вылазка показывает журнал событий, чтобы было понятно, что произошло."
        }
        tone={resultTone}
        heroImage={
          status.lastResult?.success
            ? GAME_ART.raids.lootExplosion
            : status.lastResult?.ambush?.happened
              ? GAME_ART.raids.ambushEyes
              : GAME_ART.battle.defeat
        }
      >
        <div className="space-y-2">
          {lastResultLog.map((entry, index) => (
            <div key={`${index}-${entry}`} className="games-reward-chip">
              {entry}
            </div>
          ))}
        </div>
      </GameResultReveal>
    </div>
  );
}
