"use client";

import { useState, useEffect, useCallback } from "react";

interface UseReaderSettingsReturn {
  showPageCounter: boolean;
  setShowPageCounter: (value: boolean) => void;
  toggleShowPageCounter: () => void;
}

export function useReaderSettings(): UseReaderSettingsReturn {
  const [showPageCounter, setShowPageCounterState] = useState(true);

  // Load saved settings from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedShowPageCounter = localStorage.getItem("reader-show-page-counter");
    if (savedShowPageCounter !== null) {
      setShowPageCounterState(savedShowPageCounter === "true");
    }
  }, []);

  const setShowPageCounter = useCallback((value: boolean) => {
    setShowPageCounterState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem("reader-show-page-counter", value.toString());
    }
  }, []);

  const toggleShowPageCounter = useCallback(() => {
    setShowPageCounter(!showPageCounter);
  }, [showPageCounter, setShowPageCounter]);

  return {
    showPageCounter,
    setShowPageCounter,
    toggleShowPageCounter,
  };
}
