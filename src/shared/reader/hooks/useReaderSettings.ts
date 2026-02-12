"use client";

import { useState, useEffect, useCallback } from "react";

const CHAPTERS_IN_ROW_KEY = "reader-chapters-in-row";

interface UseReaderSettingsReturn {
  showPageCounter: boolean;
  setShowPageCounter: (value: boolean) => void;
  toggleShowPageCounter: () => void;
  readChaptersInRow: boolean;
  setReadChaptersInRow: (value: boolean) => void;
}

export function useReaderSettings(): UseReaderSettingsReturn {
  const [showPageCounter, setShowPageCounterState] = useState(true);
  const [readChaptersInRow, setReadChaptersInRowState] = useState(false);

  // Load saved settings from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedShowPageCounter = localStorage.getItem("reader-show-page-counter");
    if (savedShowPageCounter !== null) {
      setShowPageCounterState(savedShowPageCounter === "true");
    }
    const savedChaptersInRow = localStorage.getItem(CHAPTERS_IN_ROW_KEY);
    if (savedChaptersInRow !== null) {
      setReadChaptersInRowState(savedChaptersInRow === "true");
    }
  }, []);

  const setShowPageCounter = useCallback((value: boolean) => {
    setShowPageCounterState(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("reader-show-page-counter", value.toString());
    }
  }, []);

  const toggleShowPageCounter = useCallback(() => {
    setShowPageCounter(!showPageCounter);
  }, [showPageCounter, setShowPageCounter]);

  const setReadChaptersInRow = useCallback((value: boolean) => {
    setReadChaptersInRowState(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAPTERS_IN_ROW_KEY, value.toString());
    }
  }, []);

  return {
    showPageCounter,
    setShowPageCounter,
    toggleShowPageCounter,
    readChaptersInRow,
    setReadChaptersInRow,
  };
}
