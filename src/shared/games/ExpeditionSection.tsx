"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useGetDisciplesExpeditionStatusQuery,
  useDisciplesStartExpeditionMutation,
  useGetProfileInventoryQuery,
} from "@/store/api/gamesApi";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/utils";
import { Compass, Coins, Info } from "lucide-react";

import { GAME_ART } from "./gameArt";
import Tooltip from "@/shared/ui/Tooltip";

const EXPEDITION_DIFFICULTY_ART: Record<"easy" | "normal" | "hard", string> = {
  easy: GAME_ART.raids.difficultyEasy,
  normal: GAME_ART.raids.difficultyNormal,
  hard: GAME_ART.raids.difficultyHard,
};

const EXPEDITION_DIFFICULTY_DETAILS: Record<
  "easy" | "normal" | "hard",
  { description: string; risk: string; duration: string }
> = {
  easy: {
    description: "Самый дешёвый вариант: короткий поход, меньше риска засады и скромнее награда.",
    risk: "Низкий",
    duration: "~1 минута",
  },
  normal: {
    description: "Средняя цена и длительность: награды и шансы между лёгкой и тяжёлой экспедицией.",
    risk: "Средний",
    duration: "~2 минуты",
  },
  hard: {
    description: "Дороже и дольше: выше риск засады, но лучше шанс на редкий и ценный лут.",
    risk: "Высокий",
    duration: "~3 минуты",
  },
};

interface ExpeditionStatusData {
  inProgress?: boolean;
  completesAt?: string;
  nextExpeditionAt?: string;
  canStart?: boolean;
  balance?: number;
  ambushRiskPercent?: number | null;
  hasDisciples?: boolean;
  costs?: Record<string, number>;
  lastResult?: {
    at?: string;
    success?: boolean;
    difficulty?: string;
    coinsGained?: number;
    expGained?: number;
    log?: string[];
    ambush?: { happened?: boolean; preventedByTalisman?: boolean };
    itemsGained?: Array<{ itemId: string; count: number; name?: string; icon?: string }>;
  };
}

const EXPEDITION_PROGRESS_STORAGE_KEY = "tomilo:expedition-progress";
const EXPEDITION_LAST_RESULT_KEY = "tomilo:expedition-last-result-at";

export function ExpeditionSection() {
  const toast = useToast();
  const {
    data: expeditionStatusData,
    isLoading: expeditionLoading,
    isFetching: expeditionFetching,
    isError: expeditionStatusError,
    refetch: refetchExpedition,
  } = useGetDisciplesExpeditionStatusQuery();
  const [startExpedition, { isLoading: isStartingExpedition }] =
    useDisciplesStartExpeditionMutation();
  const { data: inventoryData } = useGetProfileInventoryQuery();

  const lastShownResultRef = useRef<string | null>(null);
  const syntheticProgressStartRef = useRef<{ completesAt: string; originMs: number } | null>(null);

  const expeditionData = expeditionStatusData?.data as ExpeditionStatusData | undefined;
  const inProgress = expeditionData?.inProgress ?? false;
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const expeditionTargetMs =
    expeditionData?.inProgress && expeditionData?.completesAt
      ? new Date(expeditionData.completesAt).getTime()
      : !expeditionData?.canStart && expeditionData?.nextExpeditionAt
        ? new Date(expeditionData.nextExpeditionAt).getTime()
        : null;

  const inventory = (inventoryData?.data ?? []) as { itemId: string; count: number }[];
  const inventoryById = new Map(inventory.map((entry) => [entry.itemId, entry]));
  const expeditionTalismanCount = inventoryById.get("expedition_talisman")?.count ?? 0;

  // Загрузка lastShownResult из sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem(EXPEDITION_LAST_RESULT_KEY);
      lastShownResultRef.current = stored || null;
    } catch {
      lastShownResultRef.current = null;
    }
  }, []);

  // Сохранение lastShownResult в sessionStorage
  const writeLastShownResult = useCallback((resultAt: string) => {
    try {
      sessionStorage.setItem(EXPEDITION_LAST_RESULT_KEY, resultAt);
      lastShownResultRef.current = resultAt;
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  // Таймер countdown
  useEffect(() => {
    if (!expeditionTargetMs) return;
    const ms = expeditionData?.inProgress ? 200 : 1000;
    const id = setInterval(() => setCountdownNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [expeditionTargetMs, expeditionData?.inProgress]);

  // Очистка прогресса при завершении экспедиции
  useEffect(() => {
    if (!expeditionData?.inProgress) {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(EXPEDITION_PROGRESS_STORAGE_KEY);
        } catch {}
      }
      syntheticProgressStartRef.current = null;
    }
  }, [expeditionData?.inProgress]);

  // Auto-refetch во время inProgress
  useEffect(() => {
    if (!inProgress) return;
    const id = setInterval(() => refetchExpedition(), 5000);
    return () => clearInterval(id);
  }, [inProgress, refetchExpedition]);

  // Тосты при завершении экспедиции
  useEffect(() => {
    const res = expeditionData;
    if (!res?.lastResult || res.inProgress) return;
    const resultAt = res.lastResult.at;
    if (!resultAt || lastShownResultRef.current === resultAt) return;
    writeLastShownResult(resultAt);
    const payload = res.lastResult;
    const ambush = payload.ambush;
    if (ambush?.happened) {
      if (ambush.preventedByTalisman) {
        toast.success(
          "Экспедиция успешна! Засада отражена талисманом. +" +
            payload.coinsGained +
            " монет, +" +
            payload.expGained +
            " опыта",
        );
      } else {
        toast.warning(
          "Засада! Часть добычи потеряна. +" +
            payload.coinsGained +
            " монет, +" +
            payload.expGained +
            " опыта",
        );
      }
    } else {
      toast.success(
        (payload.success ? "Экспедиция успешна! " : "Провал... ") +
          `+${payload.coinsGained ?? 0} монет, +${payload.expGained ?? 0} опыта`,
      );
    }
    (payload.itemsGained ?? []).forEach((item) => {
      const label = item.name || item.itemId;

      toast.success(`Найдено: ${label} ×${item.count}`, undefined, { icon: item.icon });
    });
  }, [expeditionData, toast, writeLastShownResult]);

  if (expeditionLoading && !expeditionData) {
    return (
      <div className="games-panel">
        <p className="games-muted text-sm">Загрузка статуса экспедиции...</p>
      </div>
    );
  }

  if (expeditionStatusError && !expeditionData) {
    return (
      <div className="games-panel text-[var(--destructive)]">
        <p className="games-muted text-sm">Не удалось загрузить статус экспедиции.</p>
        <button
          type="button"
          className="games-btn games-btn-secondary games-btn-sm mt-3"
          onClick={() => void refetchExpedition()}
        >
          Повторить
        </button>
      </div>
    );
  }

  if (!expeditionData) {
    return (
      <div className="games-panel">
        <p className="games-muted text-sm">Нет данных экспедиции.</p>
        <button type="button" className="games-btn games-btn-secondary games-btn-sm mt-3" onClick={() => void refetchExpedition()}>
          Обновить
        </button>
      </div>
    );
  }

  const completesAtStr = expeditionData.completesAt;
  let expeditionProgressPercent = 0;
  if (expeditionData.inProgress && completesAtStr && expeditionTargetMs) {
    const storedStart = (() => {
      if (typeof window === 'undefined') return null;
      try {
        const raw = sessionStorage.getItem(EXPEDITION_PROGRESS_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { completesAt: string; startedAtMs: number };
        if (parsed.completesAt !== completesAtStr || typeof parsed.startedAtMs !== "number") return null;
        return parsed.startedAtMs;
      } catch {
        return null;
      }
    })();
    let originMs: number;
    if (storedStart != null) {
      originMs = storedStart;
    } else {
      if (syntheticProgressStartRef.current?.completesAt !== completesAtStr) {
        syntheticProgressStartRef.current = { completesAt: completesAtStr, originMs: Date.now() };
      }
      originMs = syntheticProgressStartRef.current!.originMs;
    }
    const total = expeditionTargetMs - originMs;
    expeditionProgressPercent = total > 0 ? Math.min(100, Math.max(0, ((countdownNow - originMs) / total) * 100)) : 100;
  }

  const formatCountdown = (untilMs: number): string => {
    const left = Math.max(0, Math.floor((untilMs - countdownNow) / 1000));
    const h = Math.floor(left / 3600);
    const m = Math.floor((left % 3600) / 60);
    const s = left % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}ч`);
    if (m > 0 || h > 0) parts.push(`${m}мин`);
    parts.push(`${s}сек`);
    return parts.join(" ");
  };

  const statusLabel = expeditionData.inProgress
    ? "В походе"
    : expeditionData.canStart
      ? "Готово к отправке"
      : "Кулдаун";

  return (
    <div className="space-y-4">
      <div className="games-dash-grid">
        <div className="games-dash-card games-dash-card--accent">
          <span className="games-dash-card__label">Баланс</span>
          <span className="games-dash-card__value inline-flex items-center gap-1">
            {expeditionData.balance ?? "—"}
            <Coins className="w-4 h-4 text-amber-500 opacity-90 shrink-0" aria-hidden />
          </span>
        </div>
        <div className="games-dash-card">
          <span className="games-dash-card__label">Талисман вылазки</span>
          <span className="games-dash-card__value">{expeditionTalismanCount}</span>
        </div>
        <div className="games-dash-card">
          <span className="games-dash-card__label">Статус</span>
          <span className="games-dash-card__value text-base">{statusLabel}</span>
        </div>
      </div>

      <div className="games-panel">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h3 className="games-panel-title flex items-center gap-2 mb-0">
            <Compass className="w-4 h-4 text-[var(--primary)]" aria-hidden />
            Экспедиция
          </h3>
          {expeditionFetching ? (
            <span className="text-[11px] text-[var(--muted-foreground)]">Обновление…</span>
          ) : (
            <button
              type="button"
              className="games-btn games-btn-secondary games-btn-sm"
              onClick={() => void refetchExpedition()}
            >
              Обновить
            </button>
          )}
        </div>
        <div className="space-y-3">
          {expeditionData.inProgress ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/15 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="games-muted text-sm min-w-0">
                  Экспедиция в пути. Завершится через{" "}
                  <strong className="text-[var(--foreground)]">
                    {expeditionData.completesAt && expeditionTargetMs ? formatCountdown(expeditionTargetMs) : "—"}
                  </strong>
                </p>
                <p className="games-muted text-sm shrink-0 text-right">
                  Баланс: <strong className="text-[var(--primary)]">{expeditionData.balance}</strong>
                  {expeditionData.ambushRiskPercent != null && (
                    <>
                      {" · "}
                      <Tooltip content="Вероятность нападения врагов. При засаде часть добычи теряется, если нет талисмана." position="top" trigger="hover">
                        <strong className="text-[var(--primary)] inline-flex items-center gap-0.5">
                          {expeditionData.ambushRiskPercent}% <Info className="w-3 h-3" />
                        </strong>
                      </Tooltip>
                    </>
                  )}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="games-muted">Ход экспедиции</span>
                  <span className="font-semibold tabular-nums text-[var(--foreground)]">
                    {Math.round(expeditionProgressPercent)}%
                  </span>
                </div>
                <div
                  className="games-stat-bar w-full h-2.5 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(expeditionProgressPercent)}
                  aria-label="Прогресс экспедиции"
                >
                  <div
                    className="games-stat-fill h-full rounded-full transition-[width] duration-200 ease-linear bg-[var(--primary)]"
                    style={{ width: `${expeditionProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="games-muted text-sm">
                {expeditionData.canStart ? (
                  <>Готово к отправке. Выберите сложность.</>
                ) : (
                  <>
                    Кулдаун: <strong className="text-[var(--foreground)]">
                      {expeditionData.nextExpeditionAt && expeditionTargetMs
                        ? formatCountdown(expeditionTargetMs)
                        : "—"}
                    </strong>
                  </>
                )}
              </p>
              <p className="games-muted text-sm">
                Баланс: <strong className="text-[var(--primary)]">{expeditionData.balance}</strong>
                {expeditionData.ambushRiskPercent != null && (
                  <>
                    {" · "}
                    <strong className="text-[var(--primary)]">
                      {expeditionData.ambushRiskPercent}%
                    </strong>
                  </>
                )}
              </p>
            </div>
          )}
          <div className="games-muted text-xs flex items-center gap-1">
            Защита экспедиции: <strong className="text-[var(--foreground)]">{expeditionTalismanCount}</strong> талисм.
            {expeditionTalismanCount > 0
              ? " При засаде один талисман спишется автоматически."
              : " Если получите талисман вылазки в сумку, он будет срабатывать автоматически."}
            <Tooltip
              content="Талисманы экспедиции автоматически защищают от засады. При срабатывании один талисман расходуется, предотвращая потерю добычи."
              position="top"
              trigger="hover"
            >
              <Info
                className="w-3.5 h-3.5 text-[var(--muted-foreground)] cursor-help"
                aria-label="Подробности"
              />
            </Tooltip>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["easy", "normal", "hard"] as const).map((d, idx) => (
              <div key={idx} className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 overflow-hidden flex flex-col h-full">
                <div className="aspect-[4/3] w-full bg-[var(--muted)]/30">
                  <img
                    src={EXPEDITION_DIFFICULTY_ART[d]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1 min-h-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      {d === "easy" ? "Лёгкая" : d === "normal" ? "Обычная" : "Тяжёлая"}
                    </div>
                    <Tooltip
                      content={
                        <div className="text-xs space-y-1">
                          <div><strong>Риск засады:</strong> {EXPEDITION_DIFFICULTY_DETAILS[d].risk}</div>
                          <div><strong>Длительность:</strong> {EXPEDITION_DIFFICULTY_DETAILS[d].duration}</div>
                          <div><strong>Стоимость:</strong> {expeditionData.costs?.[d] ?? "—"} монет</div>
                          <div>{EXPEDITION_DIFFICULTY_DETAILS[d].description}</div>
                        </div>
                      }
                      position="top"
                      trigger="hover"
                    >
                      <Info className="w-3.5 h-3.5 text-[var(--muted-foreground)] cursor-help" aria-label="Подробности" />
                    </Tooltip>
                  </div>
                  <p className="games-muted text-xs flex-1">
                    {EXPEDITION_DIFFICULTY_DETAILS[d].description}
                  </p>
                  <button
                    type="button"
                    disabled={!expeditionData.canStart || isStartingExpedition || !expeditionData.hasDisciples}
                    className="games-btn games-btn-primary w-full justify-center mt-auto shrink-0"
                    onClick={async () => {
                      try {
                        const res = await startExpedition({ difficulty: d }).unwrap();
                        const payload = res?.data;
                        if (!payload) {
                          toast.error("Нет ответа от сервера. Попробуйте позже.");
                          return;
                        }
                        if (payload.completesAt) {
                          (() => {
                            if (typeof window === 'undefined') return;
                            try {
                              sessionStorage.setItem(
                                EXPEDITION_PROGRESS_STORAGE_KEY,
                                JSON.stringify({ completesAt: payload.completesAt, startedAtMs: Date.now() }),
                              );
                            } catch {}
                          })();
                          syntheticProgressStartRef.current = null;
                        }
                        toast.success("Экспедиция отправлена! Результат будет через 1–2 минуты.");
                        refetchExpedition();
                      } catch (e) {
                        toast.error(getErrorMessage(e, "Не удалось отправить экспедицию"));
                      }
                    }}
                  >
                    <span className="inline-flex items-center justify-center gap-1">
                      Отправить · {expeditionData.costs?.[d] ?? "—"}
                      <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden />
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          {!expeditionData.hasDisciples && (
            <p className="games-muted text-sm">
              Сначала соберите хотя бы одного ученика (вкладка «Ученики»), иначе поход не стартует.
            </p>
          )}
          {expeditionData.lastResult && (
            <div className="games-reward-box">
              <div className="mb-3 rounded-lg overflow-hidden border border-[var(--border)] max-h-32">
                <img
                  src={
                    expeditionData.lastResult.success
                      ? GAME_ART.raids.lootExplosion
                      : expeditionData.lastResult.ambush?.happened
                        ? GAME_ART.raids.ambushEyes
                        : GAME_ART.battle.defeat
                  }
                  alt=""
                  className="w-full h-28 object-cover"
                />
              </div>
              <p className="games-muted text-xs mb-2">
                Монеты и предметы — вам; опыт учеников делится между активным отрядом: основной получает больше, остальные — меньше. Начисляется опыт библиотеки.
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-[var(--foreground)]">
                  {expeditionData.lastResult.success ? "Успех" : "Провал"} ·{" "}
                  {expeditionData.lastResult.difficulty === "easy"
                    ? "лёгкая"
                    : expeditionData.lastResult.difficulty === "normal"
                      ? "обычная"
                      : "тяжёлая"}
                </strong>
                <span className="games-muted text-xs">
                  {expeditionData.lastResult.at ? new Date(expeditionData.lastResult.at).toLocaleString() : "—"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="games-reward-chip">+{expeditionData.lastResult.coinsGained ?? 0} монет</span>
                <span className="games-reward-chip">+{expeditionData.lastResult.expGained ?? 0} опыта</span>
                {(expeditionData.lastResult.itemsGained ?? []).map((i, idx) => (
                  <Tooltip key={idx} content={
                    <div className="text-xs">
                      <div><strong>{i.name || i.itemId}</strong></div>
                      <div>ID: {i.itemId}</div>
                      <div>Количество: {i.count}</div>
                    </div>
                  } position="top" trigger="hover">
                    <span className="games-reward-chip inline-flex items-center gap-1 cursor-help">
                      {i.icon ? <img src={i.icon} alt="" className="w-4 h-4 rounded object-cover" /> : null}
                      {i.name || i.itemId} ×{i.count}
                    </span>
                  </Tooltip>
                ))}
                {expeditionData.lastResult.ambush?.happened && (
                  <span className="games-reward-chip games-reward-chip--warning">
                    {expeditionData.lastResult.ambush.preventedByTalisman ? "Засада отражена" : "Засада"}
                  </span>
                )}
              </div>
              {expeditionData.lastResult.log?.length ? (
                <ul className="mt-2 space-y-1 text-xs games-muted">
                  {expeditionData.lastResult.log.slice(0, 6).map((l, idx) => (
                    <li key={idx}>{l}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

