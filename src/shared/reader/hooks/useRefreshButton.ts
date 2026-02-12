"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseRefreshButtonReturn {
  isPressing: boolean;
  pressProgress: number;
  showRefreshTooltip: boolean;
  startPressing: () => void;
  stopPressing: () => void;
  handleSimpleClick: () => void;
}

export function useRefreshButton(): UseRefreshButtonReturn {
  const router = useRouter();
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const [showRefreshTooltip, setShowRefreshTooltip] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPressing = useCallback(() => {
    setIsPressing(true);
    setPressProgress(0);
    setShowRefreshTooltip(false);
    
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += 2;
      setPressProgress(Math.min(progress, 100));
    }, 100);
    
    pressTimerRef.current = setTimeout(() => {
      router.refresh();
      setIsPressing(false);
      setPressProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }, 5000);
  }, [router]);

  const stopPressing = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    if (isPressing && pressProgress < 100) {
      setShowRefreshTooltip(true);
      setTimeout(() => setShowRefreshTooltip(false), 2000);
    }
    
    setIsPressing(false);
    setPressProgress(0);
  }, [isPressing, pressProgress]);

  const handleSimpleClick = useCallback(() => {
    if (!isPressing && pressProgress === 0) {
      setShowRefreshTooltip(true);
      setTimeout(() => setShowRefreshTooltip(false), 2000);
    }
  }, [isPressing, pressProgress]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, []);

  // Attach cleanup to component unmount
  // This will be called when the component using this hook unmounts
  // We return cleanup function that can be used in useEffect

  return {
    isPressing,
    pressProgress,
    showRefreshTooltip,
    startPressing,
    stopPressing,
    handleSimpleClick,
  };
}

// Cleanup hook to be used in component's useEffect
export function useRefreshButtonCleanup(cleanup: () => void) {
  const cleanupRef = useRef(cleanup);
  
  // Update ref when cleanup changes
  cleanupRef.current = cleanup;
  
  // Run cleanup on unmount
  // Note: This is a placeholder - actual cleanup should be done in the component
}
