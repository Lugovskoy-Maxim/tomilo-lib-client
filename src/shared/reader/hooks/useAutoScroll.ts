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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopAutoScrollRef = useRef<(() => void) | null>(null);
  
  // Sub-pixel accumulator for smooth scrolling
  const accumulatedRef = useRef(0);
  const lastAppliedRef = useRef(0);

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
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAutoScrolling(false);
  }, []);

  useEffect(() => {
    stopAutoScrollRef.current = stopAutoScroll;
  }, [stopAutoScroll]);

  const startAutoScroll = useCallback(() => {
    if (isAutoScrollingRef.current) return;
    setIsAutoScrolling(true);

    // Pixels per second for each speed
    const speedMap = { slow: 30, medium: 80, fast: 160 };
    
    // Use 60fps interval for consistent timing
    const INTERVAL_MS = 16.67; // ~60fps
    
    // Initialize accumulator with current scroll position
    accumulatedRef.current = window.scrollY;
    lastAppliedRef.current = window.scrollY;

    intervalRef.current = setInterval(() => {
      if (!isAutoScrollingRef.current) {
        stopAutoScrollRef.current?.();
        return;
      }

      const pxPerSecond = speedMap[autoScrollSpeedRef.current];
      const pxPerFrame = pxPerSecond * (INTERVAL_MS / 1000);
      
      // Check if user manually scrolled
      const currentY = window.scrollY;
      if (Math.abs(currentY - lastAppliedRef.current) > 2) {
        // User scrolled - update accumulator to match
        accumulatedRef.current = currentY;
        lastAppliedRef.current = currentY;
      }
      
      // Accumulate sub-pixel movement
      accumulatedRef.current += pxPerFrame;
      
      // Check end
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (accumulatedRef.current >= maxScroll) {
        window.scrollTo(0, maxScroll);
        stopAutoScrollRef.current?.();
        return;
      }

      // Only apply when we have a new whole pixel to scroll
      const newY = Math.floor(accumulatedRef.current);
      if (newY > lastAppliedRef.current) {
        window.scrollTo(0, newY);
        lastAppliedRef.current = newY;
      }
    }, INTERVAL_MS);
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
    return () => { 
      if (intervalRef.current) clearInterval(intervalRef.current); 
    };
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
