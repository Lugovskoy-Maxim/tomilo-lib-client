"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type AutoScrollSpeed = "slow" | "medium" | "fast";

interface UseAutoScrollOptions {
  onAutoScrollStart?: () => void;
}

interface UseAutoScrollReturn {
  isAutoScrolling: boolean;
  autoScrollSpeed: AutoScrollSpeed;
  setAutoScrollSpeed: (speed: AutoScrollSpeed) => void;
  startAutoScroll: () => void;
  stopAutoScroll: () => void;
  toggleAutoScroll: () => void;
}

export function useAutoScroll(options: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const { onAutoScrollStart } = options;
  
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const isAutoScrollingRef = useRef(isAutoScrolling);
  const [autoScrollSpeed, setAutoScrollSpeedState] = useState<AutoScrollSpeed>("medium");
  const autoScrollSpeedRef = useRef(autoScrollSpeed);
  const rafRef = useRef<number | null>(null);
  const stopAutoScrollRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    isAutoScrollingRef.current = isAutoScrolling;
  }, [isAutoScrolling]);

  useEffect(() => {
    autoScrollSpeedRef.current = autoScrollSpeed;
  }, [autoScrollSpeed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem("reader-auto-scroll-speed");
    if (saved && ["slow", "medium", "fast"].includes(saved)) {
      setAutoScrollSpeedState(saved as AutoScrollSpeed);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("reader-auto-scroll-speed", autoScrollSpeed);
  }, [autoScrollSpeed]);

  const setAutoScrollSpeed = useCallback((speed: AutoScrollSpeed) => {
    setAutoScrollSpeedState(speed);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsAutoScrolling(false);
  }, []);

  useEffect(() => {
    stopAutoScrollRef.current = stopAutoScroll;
  }, [stopAutoScroll]);

  const startAutoScroll = useCallback(() => {
    if (isAutoScrollingRef.current) return;
    setIsAutoScrolling(true);

    // Pixels per second
    const speedMap = { slow: 35, medium: 90, fast: 180 };
    
    // Use start time and position for linear interpolation
    const startTime = performance.now();
    const startScrollY = window.scrollY;
    let lastAppliedY = startScrollY;

    const tick = (now: number) => {
      if (!isAutoScrollingRef.current) return;

      const elapsed = now - startTime;
      const pxPerSecond = speedMap[autoScrollSpeedRef.current];
      
      // Calculate target position based on elapsed time
      const targetY = startScrollY + (pxPerSecond * elapsed) / 1000;
      
      // Check if user manually scrolled (difference too big)
      const currentY = window.scrollY;
      const expectedY = lastAppliedY;
      
      if (Math.abs(currentY - expectedY) > 3) {
        // User scrolled - restart with new base position
        stopAutoScrollRef.current?.();
        return;
      }

      // Check end
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (targetY >= maxScroll) {
        window.scrollTo({ top: maxScroll, behavior: 'instant' });
        stopAutoScrollRef.current?.();
        return;
      }

      // Apply scroll - round to avoid sub-pixel jitter
      const newY = Math.round(targetY);
      if (newY !== lastAppliedY) {
        window.scrollTo({ top: newY, behavior: 'instant' });
        lastAppliedY = newY;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const toggleAutoScroll = useCallback(() => {
    if (isAutoScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
      onAutoScrollStart?.();
    }
  }, [isAutoScrolling, startAutoScroll, stopAutoScroll, onAutoScrollStart]);

  // Stop on visibility change
  useEffect(() => {
    const handler = () => {
      if (document.hidden && isAutoScrollingRef.current) {
        stopAutoScrollRef.current?.();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Stop on user interaction
  useEffect(() => {
    const stop = () => isAutoScrollingRef.current && stopAutoScrollRef.current?.();
    
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      if (isAutoScrollingRef.current && Math.abs(e.touches[0].clientY - touchY) > 10) stop();
    };
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) stop();
    };

    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    
    return () => {
      window.removeEventListener('wheel', stop);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return {
    isAutoScrolling,
    autoScrollSpeed,
    setAutoScrollSpeed,
    startAutoScroll,
    stopAutoScroll,
    toggleAutoScroll,
  };
}
