"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  /** только на touch-устройствах или узком viewport */
  mobileOnly?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled = false, mobileOnly = true }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPull = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;
      if (mobileOnly && typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) return;
      if (window.scrollY > 10) return;
      startY.current = e.touches[0].clientY;
      isPull.current = true;
    },
    [disabled, isRefreshing, mobileOnly]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPull.current || disabled || isRefreshing) return;
      const y = e.touches[0].clientY;
      const delta = y - startY.current;
      if (delta <= 0) return;
      const pull = Math.min(delta * 0.5, MAX_PULL);
      setPullY(pull);
    },
    [disabled, isRefreshing]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isPull.current) return;
    isPull.current = false;
    if (pullY >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      Promise.resolve(onRefresh())
        .finally(() => setIsRefreshing(false));
      setPullY(0);
    } else {
      setPullY(0);
    }
  }, [pullY, isRefreshing, onRefresh]);

  const progress = Math.min(1, pullY / PULL_THRESHOLD);
  const showIndicator = pullY > 0 || isRefreshing;

  return (
    <div
      className="relative min-h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {showIndicator && (
        <div
          className="flex items-center justify-center h-14 text-[var(--muted-foreground)] transition-opacity duration-200"
          style={{
            height: isRefreshing ? 56 : Math.min(56, pullY),
            opacity: isRefreshing ? 1 : progress,
          }}
        >
          {isRefreshing ? (
            <span className="text-sm">Обновление…</span>
          ) : (
            <span className="text-sm">{progress >= 1 ? "Отпустите" : "Потяните вниз"}</span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
