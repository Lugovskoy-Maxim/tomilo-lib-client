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
  const autoScrollRafRef = useRef<number | null>(null);
  const stopAutoScrollRef = useRef<(() => void) | null>(null);

  // Sync refs with state
  useEffect(() => {
    isAutoScrollingRef.current = isAutoScrolling;
  }, [isAutoScrolling]);

  useEffect(() => {
    autoScrollSpeedRef.current = autoScrollSpeed;
  }, [autoScrollSpeed]);

  // Load saved speed from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedAutoScrollSpeed = localStorage.getItem("reader-auto-scroll-speed");
    if (savedAutoScrollSpeed && ["slow", "medium", "fast"].includes(savedAutoScrollSpeed)) {
      setAutoScrollSpeedState(savedAutoScrollSpeed as AutoScrollSpeed);
    }
  }, []);

  // Save speed to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem("reader-auto-scroll-speed", autoScrollSpeed);
  }, [autoScrollSpeed]);

  const setAutoScrollSpeed = useCallback((speed: AutoScrollSpeed) => {
    setAutoScrollSpeedState(speed);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
    
    setIsAutoScrolling(false);
  }, []);

  // Store stopAutoScroll in ref to avoid circular dependency
  useEffect(() => {
    stopAutoScrollRef.current = stopAutoScroll;
  }, [stopAutoScroll]);

  const startAutoScroll = useCallback(() => {
    if (isAutoScrollingRef.current) return;
    setIsAutoScrolling(true);

    const speedMap = { slow: 0.8, medium: 2.5, fast: 5 }; // pixels per frame at 60fps
    const targetSpeed = speedMap[autoScrollSpeedRef.current];

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      if (!isAutoScrollingRef.current) return;

      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Calculate scroll amount based on time for consistent speed
      const scrollAmount = (targetSpeed * deltaTime) / 16; // normalize to ~60fps
      
      // Use scrollBy for better mobile compatibility
      window.scrollBy({
        top: scrollAmount,
        behavior: 'auto'
      });

      // Check if reached end
      const maxScroll = (typeof document !== 'undefined' ? document.documentElement.scrollHeight : 0) - window.innerHeight;
      const currentScroll = window.scrollY + window.innerHeight;
      
      if (currentScroll >= maxScroll - 10) {
        stopAutoScrollRef.current?.();
        return;
      }

      autoScrollRafRef.current = requestAnimationFrame(animate);
    };

    autoScrollRafRef.current = requestAnimationFrame(animate);
  }, []);

  const toggleAutoScroll = useCallback(() => {
    if (isAutoScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
      if (onAutoScrollStart) {
        onAutoScrollStart();
      }
    }
  }, [isAutoScrolling, startAutoScroll, stopAutoScroll, onAutoScrollStart]);

  // Handle visibility change (when app is minimized/maximized)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isAutoScrollingRef.current) {
        stopAutoScrollRef.current?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);
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
