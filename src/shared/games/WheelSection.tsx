"use client";

import { useGetWheelQuery, useWheelSpinMutation } from "@/store/api/gamesApi";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/utils";
import { useState, useRef, useCallback, useEffect } from "react";
import { CircleDot } from "lucide-react";
import type { WheelSegment } from "@/types/games";

const WHEEL_SIZE = 280;
const SEGMENT_COLORS = [
  "#f59e0b", "#d97706", "#b45309", "#92400e",
  "#fbbf24", "#fcd34d", "#fde68a", "#fef3c7",
];

function WheelSvg({ segments }: { segments: WheelSegment[] }) {
  const n = Math.max(1, segments.length);
  const r = 100;
  const cx = 100;
  const cy = 100;
  const labelRadius = 68;
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
    <svg viewBox="0 0 200 200" className="w-full h-full" style={{ maxWidth: WHEEL_SIZE, maxHeight: WHEEL_SIZE }}>
      <g>
        {slices.map((s, i) => {
          const textRad = (s.textAngle * Math.PI) / 180;
          const tx = cx + labelRadius * Math.cos(textRad);
          const ty = cy + labelRadius * Math.sin(textRad);
          return (
            <g key={i}>
              <path d={s.path} fill={s.color} stroke="var(--border)" strokeWidth="1" />
              <text
                x={tx}
                y={ty}
                fill="var(--foreground)"
                fontSize="9"
                fontWeight="600"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${s.textAngle} ${tx} ${ty})`}
              >
                {s.label.length > 14 ? s.label.slice(0, 13) + "…" : s.label}
              </text>
            </g>
          );
        })}
      </g>
      <circle cx={cx} cy={cy} r={12} fill="var(--card)" stroke="var(--border)" strokeWidth="2" className="games-wheel-center" />
    </svg>
  );
}

export function WheelSection() {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useGetWheelQuery();
  const [spin, { isLoading: isSpinning }] = useWheelSpinMutation();
  const [lastReward, setLastReward] = useState<{ label: string; expGained?: number; coinsGained?: number; itemsGained?: { itemId: string; count: number; name?: string; icon?: string }[] } | null>(null);
  const [spinRotation, setSpinRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const spinDurationMs = 6000;
  const spinEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (spinEndTimeoutRef.current) clearTimeout(spinEndTimeoutRef.current);
  }, []);

  const wheel = data?.data;
  const segments = wheel?.segments ?? [];
  const canSpin = wheel?.canSpin ?? false;

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
      const winningIndex = segments.findIndex((s) => (s.label ?? "") === label);
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
      setIsAnimating(true);
      setSpinRotation(landingAngle);
      if (spinEndTimeoutRef.current) clearTimeout(spinEndTimeoutRef.current);
      spinEndTimeoutRef.current = setTimeout(() => {
        spinEndTimeoutRef.current = null;
        setIsAnimating(false);
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
      <div className="games-panel text-center py-8">
        <p className="games-muted mb-4">
          Один спин в день · Стоимость: <strong className="text-[var(--primary)]">{wheel.spinCostCoins}</strong> монет
        </p>
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

      <div className="games-panel">
        <h3 className="games-panel-title">Возможные награды</h3>
        <div className="flex flex-wrap gap-2">
          {(wheel.segments ?? []).map((s: { label: string }, i: number) => (
            <span key={i} className="games-reward-chip">{s.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
