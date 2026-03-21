"use client";

import { useState, useEffect, useRef } from "react";
import {
  useGetDisciplesExpeditionStatusQuery,
  useDisciplesStartExpeditionMutation,
  useGetProfileInventoryQuery,
} from "@/store/api/gamesApi";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/utils";
import { Compass, Coins } from "lucide-react";

import { GAME_ART } from "./gameArt";

const EXPEDITION_DIFFICULTY_ART: Record<"easy" | "normal" | "hard", string> = {
  easy: GAME_ART.raids.difficultyEasy,
  normal: GAME_ART.raids.difficultyNormal,
  hard: GAME_ART.raids.difficultyHard,
};

/** Тип ответа экспедиции (inProgress, lastResult, completesAt и т.д.) */
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

function readExpeditionProgressStart(completesAt: string | undefined): number | null {
  if (!completesAt || typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(EXPEDITION_PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { completesAt: string; startedAtMs: number };
    if (parsed.completesAt !== completesAt || typeof parsed.startedAtMs !== "number") return null;
    return parsed.startedAtMs;
  } catch {
    return null;
  }
}

function writeExpeditionProgressStart(completesAt: string) {
  try {
    sessionStorage.setItem(
      EXPEDITION_PROGRESS_STORAGE_KEY,
      JSON.stringify({ completesAt, startedAtMs: Date.now() }),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

function clearExpeditionProgressStorage() {
  try {
    sessionStorage.removeItem(EXPEDITION_PROGRESS_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function formatCountdown(untilMs: number): string {
  const left = Math.max(0, Math.floor((untilMs - Date.now()) / 1000));
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} ч`);
  if (m > 0 || h > 0) parts.push(`${m} мин`);
  parts.push(`${s} сек`);
  return parts.join(" ");
}

export function ExpeditionSection() {
  const toast = useToast();
  const { data: expeditionStatusData, isLoading: expeditionLoading, isError: expeditionStatusError, refetch: refetchExpedition } = useGetDisciplesExpeditionStatusQuery();
  const [startExpedition, { isLoading: isStartingExpedition }] = useDisciplesStartExpeditionMutation();
  const { data: inventoryData } = useGetProfileInventoryQuery();
  const lastShownExpeditionResultAt = useRef<string | null>(null);
  /** Если нет записи в sessionStorage — якорь «сейчас» для текущего completesAt (прогресс по оставшемуся окну) */
  const syntheticProgressStartRef = useRef<{ completesAt: string; originMs: number } | null>(null);

  const expeditionData = expeditionStatusData?.data as ExpeditionStatusData | undefined;
  const inProgress = expeditionData?.inProgress ?? false;
  const [, setCountdownNow] = useState(() => Date.now());
  const expeditionTargetMs =
    expeditionData?.inProgress && expeditionData?.completesAt
      ? new Date(expeditionData.completesAt).getTime()
      : !expeditionData?.canStart && expeditionData?.nextExpeditionAt
        ? new Date(expeditionData.nextExpeditionAt).getTime()
        : null;

  const inventory = (inventoryData?.data ?? []) as { itemId: string; count: number }[];
  const inventoryById = new Map(inventory.map((entry) => [entry.itemId, entry]));
  const expeditionTalismanCount = inventoryById.get("expedition_talisman")?.count ?? 0;

  useEffect(() => {
    if (!expeditionTargetMs) return;
    const ms = expeditionData?.inProgress ? 200 : 1000;
    const id = setInterval(() => setCountdownNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [expeditionTargetMs, expeditionData?.inProgress]);

  useEffect(() => {
    if (!expeditionData?.inProgress) {
      clearExpeditionProgressStorage();
      syntheticProgressStartRef.current = null;
    }
  }, [expeditionData?.inProgress]);

  useEffect(() => {
    if (!inProgress) return;
    const id = setInterval(() => refetchExpedition(), 5000);
    return () => clearInterval(id);
  }, [inProgress, refetchExpedition]);

  useEffect(() => {
    const res = expeditionData;
    if (!res?.lastResult || res.inProgress) return;
    const resultAt = res.lastResult.at;
    if (!resultAt || lastShownExpeditionResultAt.current === resultAt) return;
    lastShownExpeditionResultAt.current = resultAt;
    const payload = res.lastResult;
    const ambush = (payload as { ambush?: { happened?: boolean; preventedByTalisman?: boolean } }).ambush;
    if (ambush?.happened) {
      if (ambush.preventedByTalisman) {
        toast.success("Экспедиция успешна! Засада отражена талисманом. +" + payload.coinsGained + " монет, +" + payload.expGained + " опыта");
      } else {
        toast.warning("Засада! Часть добычи потеряна. +" + payload.coinsGained + " монет, +" + payload.expGained + " опыта");
      }
    } else {
      toast.success(
        (payload.success ? "Экспедиция успешна! " : "Провал... ") +
          `+${payload.coinsGained ?? 0} монет, +${payload.expGained ?? 0} опыта`,
      );
    }
    (payload.itemsGained ?? []).forEach((item: { itemId: string; count: number; name?: string; icon?: string }) => {
      const label = item.name || item.itemId;
      toast.success(`Найдено: ${label} ×${item.count}`, 5000, { icon: item.icon });
    });
  }, [expeditionData?.lastResult, expeditionData?.inProgress, toast]);

  if (expeditionLoading && !expeditionData) {
    return (
      <div className="games-panel">
        <p className="games-muted text-sm">Загрузка статуса экспедиции...</p>
      </div>
    );
  }

  if (expeditionStatusError || !expeditionData) {
    return (
      <div className="games-panel text-[var(--destructive)]">
        <p className="games-muted text-sm">Не удалось загрузить статус экспедиции.</p>
      </div>
    );
  }

  const completesAtStr = expeditionData.completesAt;
  let expeditionProgressPercent = 0;
  if (expeditionData.inProgress && completesAtStr && expeditionTargetMs) {
    const storedStart = readExpeditionProgressStart(completesAtStr);
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
    expeditionProgressPercent =
      total > 0
        ? Math.min(100, Math.max(0, ((Date.now() - originMs) / total) * 100))
        : 100;
  }

  return (
    <div className="space-y-4">
      <div className="games-panel">
        <h3 className="games-panel-title flex items-center gap-2">
          <Compass className="w-4 h-4 text-[var(--primary)]" aria-hidden /> Экспедиция
        </h3>
        <div className="space-y-3">
          {expeditionData.inProgress ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/15 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="games-muted text-sm min-w-0">
                  Экспедиция в пути. Завершится через{" "}
                  <strong className="text-[var(--foreground)]">
                    {expeditionData.completesAt && expeditionTargetMs
                      ? formatCountdown(expeditionTargetMs)
                      : "—"}
                  </strong>
                </p>
                <p className="games-muted text-sm shrink-0 text-right">
                  Баланс: <strong className="text-[var(--primary)]">{expeditionData.balance}</strong>
                  {expeditionData.ambushRiskPercent != null && (
                    <>
                      {" "}
                      · Риск засады:{" "}
                      <strong className="text-[var(--primary)]">{expeditionData.ambushRiskPercent}%</strong>
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
                    className="games-stat-fill h-full rounded-full transition-[width] duration-200 ease-linear"
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
                    Кулдаун:{" "}
                    <strong className="text-[var(--foreground)]">
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
                  <> · Риск засады: <strong className="text-[var(--primary)]">{expeditionData.ambushRiskPercent}%</strong></>
                )}
              </p>
            </div>
          )}
          <div className="games-muted text-xs">
            Защита экспедиции: <strong className="text-[var(--foreground)]">{expeditionTalismanCount}</strong> талисм.
            {expeditionTalismanCount > 0
              ? " При засаде один талисман спишется автоматически."
              : " Если получите `expedition_talisman`, он будет срабатывать автоматически."}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(["easy", "normal", "hard"] as const).map((d) => (
              <div
                key={d}
                className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 overflow-hidden flex flex-col h-full"
              >
                <div className="aspect-[4/3] w-full bg-[var(--muted)]/30">
                  <img
                    src={EXPEDITION_DIFFICULTY_ART[d]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1 min-h-0">
                  <div className="text-sm font-semibold text-[var(--foreground)]">
                    {d === "easy" ? "Лёгкая" : d === "normal" ? "Обычная" : "Тяжёлая"}
                  </div>
                  <p className="games-muted text-xs flex-1">
                    {d === "easy"
                      ? "Самый дешёвый вариант: короткий поход, меньше риска засады и скромнее награда."
                      : d === "normal"
                        ? "Средняя цена и длительность: награды и шансы между лёгкой и тяжёлой экспедицией."
                        : "Дороже и дольше: выше риск засады, но лучше шанс на редкий и ценный лут."}
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
                          writeExpeditionProgressStart(payload.completesAt);
                          syntheticProgressStartRef.current = null;
                        }
                        toast.success("Экспедиция отправлена! Результат будет через 1–2 минуты.");
                        refetchExpedition();
                      } catch (e: unknown) {
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
            <p className="games-muted text-sm">Сначала соберите хотя бы одного ученика (вкладка «Ученики»), иначе поход не стартует.</p>
          )}

          {expeditionData.lastResult && (
            <div className="games-reward-box">
              <div className="mb-3 rounded-lg overflow-hidden border border-[var(--border)] max-h-32">
                <img
                  src={
                    expeditionData.lastResult.success
                      ? GAME_ART.raids.lootExplosion
                      : (expeditionData.lastResult as { ambush?: { happened?: boolean } }).ambush?.happened
                        ? GAME_ART.raids.ambushEyes
                        : GAME_ART.battle.defeat
                  }
                  alt=""
                  className="w-full h-28 object-cover"
                />
              </div>
              <p className="games-muted text-xs mb-2">Монеты и предметы — вам; опыт начисляется только первому ученику в отряде.</p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-[var(--foreground)]">
                  {expeditionData.lastResult.success ? "Успех" : "Провал"} · {expeditionData.lastResult.difficulty === "easy" ? "лёгкая" : expeditionData.lastResult.difficulty === "normal" ? "обычная" : "тяжёлая"}
                </strong>
                <span className="games-muted text-xs">
                  {expeditionData.lastResult.at
                    ? new Date(expeditionData.lastResult.at).toLocaleString()
                    : "—"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="games-reward-chip">+{expeditionData.lastResult.coinsGained ?? 0} монет</span>
                <span className="games-reward-chip">+{expeditionData.lastResult.expGained ?? 0} опыта</span>
                {(expeditionData.lastResult.itemsGained ?? []).map((i: { itemId: string; count: number; name?: string; icon?: string }, idx: number) => (
                  <span key={idx} className="games-reward-chip inline-flex items-center gap-1">
                    {i.icon ? <img src={i.icon} alt="" className="w-4 h-4 rounded object-cover" /> : null}
                    {i.name || i.itemId} ×{i.count}
                  </span>
                ))}
                {(expeditionData.lastResult as { ambush?: { happened: boolean; preventedByTalisman: boolean } }).ambush?.happened && (
                  <span className="games-reward-chip games-reward-chip--warning">
                    {(expeditionData.lastResult as { ambush?: { preventedByTalisman?: boolean } }).ambush?.preventedByTalisman ? "Засада отражена" : "Засада"}
                  </span>
                )}
              </div>
              {expeditionData.lastResult.log?.length ? (
                <ul className="mt-2 space-y-1 text-xs games-muted">
                  {expeditionData.lastResult.log.slice(0, 6).map((l: string, idx: number) => (
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
