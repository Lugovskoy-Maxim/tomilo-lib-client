"use client";

import { useGetWheelQuery, useWheelSpinMutation } from "@/store/api/gamesApi";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/utils";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { CircleDot, Coins, Sparkles, Gift, CircleOff, Percent, Clock3 } from "lucide-react";
import type { WheelSegment } from "@/types/games";

import { GameResultReveal } from "./GameResultReveal";

const WHEEL_SIZE = 280;

/** Форматирует время до момента (ISO): "через 2 ч 15 мин", "менее минуты", "завтра в 00:00" */
function formatTimeUntil(isoString: string): string {
  const target = new Date(isoString);
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return "скоро";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return days === 1 ? "завтра в 00:00" : `через ${days} д.`;
  }
  if (hours > 0) {
    return minutes > 0 ? `через ${hours} ч ${minutes} мин` : `через ${hours} ч`;
  }
  return totalMinutes < 1 ? "менее минуты" : `через ${totalMinutes} мин`;
}

/** Палитра сегментов: контрастные цвета «колеса судьбы» (чередуются тёплые/холодные) */
const SEGMENT_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#14b8a6", "#f97316", "#3b82f6",
  "#a855f7", "#10b981", "#eab308", "#ec4899",
];

function WheelSvg({ segments }: { segments: WheelSegment[] }) {
  const n = Math.max(1, segments.length);
  const r = 92;
  const cx = 100;
  const cy = 100;
  const labelRadius = 62;
  const sliceAngle = 360 / n;
  const slices: { path: string; label: string; color: string; textAngle: number }[] = [];
  for (let i = 0; i < n; i++) {
    const startDeg = -90 + i * sliceAngle;
    const endDeg = -90 + (i + 1) * sliceAngle;
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const large = sliceAngle > 180 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    const textAngleDeg = -90 + (i + 0.5) * sliceAngle;
    slices.push({
      path,
      label: segments[i]?.label ?? "",
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
      textAngle: textAngleDeg,
    });
  }
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full games-wheel-svg" style={{ maxWidth: WHEEL_SIZE, maxHeight: WHEEL_SIZE }}>
      <defs>
        <filter id="wheel-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.25" />
        </filter>
        <filter id="wheel-text-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="rgba(0,0,0,0.5)" />
        </filter>
      </defs>
      {/* Внешнее кольцо */}
      <circle cx={cx} cy={cy} r={98} fill="none" stroke="var(--border)" strokeWidth="2" opacity="0.6" />
      <circle cx={cx} cy={cy} r={96} fill="none" className="games-wheel-outer-ring" strokeWidth="3" />
      <g filter="url(#wheel-shadow)">
        {slices.map((s, i) => {
          const textRad = (s.textAngle * Math.PI) / 180;
          const tx = cx + labelRadius * Math.cos(textRad);
          const ty = cy + labelRadius * Math.sin(textRad);
          return (
            <g key={i}>
              <path
                d={s.path}
                fill={s.color}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
                className="games-wheel-segment"
              />
              <text
                x={tx}
                y={ty}
                fill="#fff"
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${s.textAngle} ${tx} ${ty})`}
                className="games-wheel-segment-label"
                filter="url(#wheel-text-shadow)"
              >
                {s.label.length > 12 ? s.label.slice(0, 11) + "…" : s.label}
              </text>
            </g>
          );
        })}
      </g>
      {/* Центр: два круга для объёма */}
      <circle cx={cx} cy={cy} r={18} className="games-wheel-center-outer" />
      <circle cx={cx} cy={cy} r={14} className="games-wheel-center" />
    </svg>
  );
}

export function WheelSection() {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useGetWheelQuery();
  const [spin, { isLoading: isSpinning }] = useWheelSpinMutation();
  const [lastReward, setLastReward] = useState<{ label: string; expGained?: number; coinsGained?: number; itemsGained?: { itemId: string; count: number; name?: string; icon?: string }[] } | null>(null);
  const [recentResults, setRecentResults] = useState<Array<{ label: string; at: string }>>([]);
  const [revealOpen, setRevealOpen] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const spinDurationMs = 6000;
  const spinEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, setCountdownTick] = useState(0);

  useEffect(() => () => {
    if (spinEndTimeoutRef.current) clearTimeout(spinEndTimeoutRef.current);
  }, []);

  const wheel = data?.data;
  const nextSpinAt = wheel?.nextSpinAt;
  useEffect(() => {
    if (!nextSpinAt || new Date(nextSpinAt).getTime() <= Date.now()) return;
    const id = setInterval(() => setCountdownTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [nextSpinAt]);
  const segments = useMemo(() => wheel?.segments ?? [], [wheel?.segments]);
  const canSpin = wheel?.canSpin ?? false;
  const totalWeight = useMemo(
    () => segments.reduce((sum, segment) => sum + Math.max(0, Number(segment.weight ?? 0)), 0),
    [segments],
  );

  /** Сегменты, отсортированные по шансу (по убыванию) — только для отображения в «Пул наград» */
  const segmentsByChance = useMemo(() => {
    if (totalWeight <= 0) return [...segments];
    return [...segments].sort((a, b) => {
      const wA = Math.max(0, Number(a.weight ?? 0));
      const wB = Math.max(0, Number(b.weight ?? 0));
      return wB - wA;
    });
  }, [segments, totalWeight]);

  const showResultToasts = useCallback(
    (d: { label?: string; twistOfFate?: boolean; compensationCoins?: number; coinsGained?: number; expGained?: number; itemsGained?: { itemId: string; count: number; name?: string; icon?: string }[] }) => {
      if (d.twistOfFate && d.compensationCoins != null) {
        toast.warning("Обман судьбы! Компенсация +" + d.compensationCoins + " монет");
      } else {
        toast.success("Колесо: " + (d.label ?? "—") + (d.coinsGained ? ` +${d.coinsGained} монет` : "") + (d.expGained ? ` +${d.expGained} опыта` : ""));
        (d.itemsGained ?? []).forEach((item: { itemId: string; count: number; name?: string; icon?: string }) => {
          const label = item.name || item.itemId;
          toast.success(`Получено: ${label} ×${item.count}`, 5000, { icon: item.icon });
        });
      }
    },
    [toast],
  );

  const handleSpin = async () => {
    if (!wheel || isAnimating || isSpinning) return;
    try {
      const result = await spin().unwrap();
      const d = result?.data;
      if (!d) {
        toast.error("Нет ответа от сервера. Попробуйте позже.");
        return;
      }
      const n = Math.max(1, segments.length);
      const label = d.label ?? "";
      const winningIndex = typeof d.selectedSegmentIndex === "number"
        ? d.selectedSegmentIndex
        : segments.findIndex((s) => (s.label ?? "") === label);
      const index = winningIndex >= 0 ? winningIndex : 0;
      const sliceAngle = 360 / n;
      const fullSpins = 6;
      const landingAngle = 360 * fullSpins + (360 - (index + 0.5) * sliceAngle);
      setLastReward({
        label: d.label ?? "—",
        expGained: d.expGained,
        coinsGained: d.coinsGained,
        itemsGained: d.itemsGained,
      });
      setRecentResults((prev) => [{ label: d.label ?? "—", at: new Date().toISOString() }, ...prev].slice(0, 6));
      setIsAnimating(true);
      setSpinRotation(landingAngle);
      if (spinEndTimeoutRef.current) clearTimeout(spinEndTimeoutRef.current);
      spinEndTimeoutRef.current = setTimeout(() => {
        spinEndTimeoutRef.current = null;
        setIsAnimating(false);
        setRevealOpen(true);
        showResultToasts(d);
      }, spinDurationMs);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось крутить колесо"));
    }
  };

  if (isLoading || (!wheel && !isError)) {
    return <div className="games-empty games-muted">Загрузка...</div>;
  }

  if (isError) {
    return (
      <div className="games-panel text-[var(--destructive)]">
        <p>Не удалось загрузить колесо судьбы.</p>
        <button type="button" onClick={() => refetch()} className="games-btn games-btn-secondary games-btn-sm mt-2">
          Повторить
        </button>
      </div>
    );
  }

  if (!wheel) {
    return <div className="games-empty games-muted">Нет данных</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="games-panel text-center py-8">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="games-badge">1 спин в день</span>
            <span className="games-badge">Стоимость: {wheel.spinCostCoins} монет</span>
            {typeof wheel.balance === "number" ? <span className="games-badge">Баланс: {wheel.balance}</span> : null}
          </div>
          {nextSpinAt ? (
            <p className="games-muted text-xs mb-2 inline-flex items-center gap-1">
              <Clock3 className="w-3.5 h-3.5" aria-hidden />
              Доступно: <strong className="text-[var(--foreground)]">{formatTimeUntil(nextSpinAt)}</strong>
            </p>
          ) : null}
          <div className="relative inline-flex items-center justify-center my-6" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
            <div
              className="absolute inset-0 transition-transform ease-out"
              style={{
                transform: `rotate(${spinRotation}deg)`,
                transitionDuration: isAnimating ? `${spinDurationMs}ms` : "0ms",
                transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
              }}
            >
              <WheelSvg segments={segments} />
            </div>
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 pointer-events-none"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
              aria-hidden
            >
              <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
                <path d="M16 0L32 28H0L16 0z" fill="var(--games-gold-dim, #92400e)" stroke="var(--games-parchment)" strokeWidth="2" />
              </svg>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSpin}
            disabled={!canSpin || isSpinning || isAnimating}
            className="games-wheel-cta inline-flex items-center gap-2"
          >
            <CircleDot className={`w-7 h-7 ${isSpinning ? "animate-spin" : ""}`} aria-hidden />
            {isSpinning ? "Крутим..." : isAnimating ? "Крутится..." : "Крутить колесо"}
          </button>
          {!canSpin && wheel.lastWheelSpinAt && (
            <p className="games-muted text-sm mt-3">Уже использовано сегодня. Завтра — снова.</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="games-panel">
            <h3 className="games-panel-title">Пул наград</h3>
            <div className="grid gap-2">
              {segmentsByChance.map((segment, index) => {
                const chancePercent = totalWeight > 0 ? ((Number(segment.weight ?? 0) / totalWeight) * 100) : 0;
                const icon =
                  segment.rewardType === "coins" ? <Coins className="w-4 h-4 text-amber-500" aria-hidden /> :
                  segment.rewardType === "xp" ? <Sparkles className="w-4 h-4 text-violet-500" aria-hidden /> :
                  segment.rewardType === "item" ? <Gift className="w-4 h-4 text-sky-500" aria-hidden /> :
                  <CircleOff className="w-4 h-4 text-slate-500" aria-hidden />;
                return (
                  <div key={`${segment.label}-${index}`} className="games-wheel-reward-row">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="games-wheel-reward-icon">
                        {segment.icon ? <img src={segment.icon} alt="" className="w-5 h-5 rounded object-cover" /> : icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--foreground)] truncate">{segment.label}</div>
                        <div className="games-muted text-xs">
                          {segment.rewardMeta?.valueText ? `${segment.rewardMeta.valueText} · ` : ""}
                          {segment.rarity ? `редкость: ${segment.rarity}` : "награда колеса"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1 text-xs font-medium text-[var(--foreground)]">
                        <Percent className="w-3.5 h-3.5 text-[var(--muted-foreground)]" aria-hidden />
                        {chancePercent.toFixed(1)}%
                      </div>
                      <div className="games-muted text-[11px]">вес {segment.weight ?? 0}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="games-panel">
            <h3 className="games-panel-title">Последние результаты</h3>
            {recentResults.length === 0 ? (
              <p className="games-muted text-sm">После первого спина здесь появится локальная история текущей сессии.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recentResults.map((entry, index) => (
                  <span key={`${entry.at}-${index}`} className="games-reward-chip">
                    {entry.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {lastReward && (
        <div className="games-reward-box">
          <h3 className="games-panel-title mb-1">Последний результат</h3>
          <p className="font-semibold text-[var(--foreground)]">{lastReward.label}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {lastReward.coinsGained != null && (
              <span className="games-reward-chip">+{lastReward.coinsGained} монет</span>
            )}
            {lastReward.expGained != null && (
              <span className="games-reward-chip">+{lastReward.expGained} опыта</span>
            )}
            {lastReward.itemsGained?.map((i, idx) => (
              <span key={idx} className="games-reward-chip inline-flex items-center gap-1">
                {i.icon ? <img src={i.icon} alt="" className="w-4 h-4 rounded object-cover" /> : null}
                {i.name || i.itemId} ×{i.count}
              </span>
            ))}
          </div>
        </div>
      )}

      <GameResultReveal
        open={revealOpen}
        title={lastReward?.label ? `Колесо выбрало: ${lastReward.label}` : "Результат колеса"}
        subtitle="Награды уже начислены. Визуальный reveal завершён, можно оценить итог и вернуться к другим режимам."
        tone="success"
        onClose={() => setRevealOpen(false)}
      >
        <div className="flex flex-wrap gap-2">
          {lastReward?.coinsGained != null ? (
            <span className="games-reward-chip inline-flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" aria-hidden />
              +{lastReward.coinsGained} монет
            </span>
          ) : null}
          {lastReward?.expGained != null ? (
            <span className="games-reward-chip inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" aria-hidden />
              +{lastReward.expGained} опыта
            </span>
          ) : null}
          {lastReward?.itemsGained?.map((item, index) => (
            <span key={`${item.itemId}-${index}`} className="games-reward-chip inline-flex items-center gap-1">
              {item.icon ? <img src={item.icon} alt="" className="w-4 h-4 rounded object-cover" /> : null}
              {item.name || item.itemId} ×{item.count}
            </span>
          ))}
        </div>
      </GameResultReveal>
    </div>
  );
}
