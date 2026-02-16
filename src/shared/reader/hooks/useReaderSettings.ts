"use client";

import { useState, useEffect, useCallback } from "react";

const CHAPTERS_IN_ROW_KEY = "reader-chapters-in-row";
const READING_MODE_KEY = "reader-reading-mode";
export type ReadingMode = "feed" | "paged";

interface UseReaderSettingsReturn {
  showPageCounter: boolean;
  setShowPageCounter: (value: boolean) => void;
  toggleShowPageCounter: () => void;
  readChaptersInRow: boolean;
  setReadChaptersInRow: (value: boolean) => void;
  readingMode: ReadingMode;
  setReadingMode: (mode: ReadingMode) => void;
}

/** Чтение глав подряд отключено. Включить: поменять на true и показать переключатель в ReaderControls. */
export const READ_CHAPTERS_IN_ROW_ENABLED = false;

export function useReaderSettings(): UseReaderSettingsReturn {
  const [showPageCounter, setShowPageCounterState] = useState(true);
  const [readChaptersInRowState, setReadChaptersInRowState] = useState(false);
  const [readingMode, setReadingModeState] = useState<ReadingMode>("feed");

  // Load saved settings from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedShowPageCounter = localStorage.getItem("reader-show-page-counter");
    if (savedShowPageCounter !== null) {
      setShowPageCounterState(savedShowPageCounter === "true");
    }
    if (READ_CHAPTERS_IN_ROW_ENABLED) {
      const savedChaptersInRow = localStorage.getItem(CHAPTERS_IN_ROW_KEY);
      if (savedChaptersInRow !== null) {
        setReadChaptersInRowState(savedChaptersInRow === "true");
      }
    }
    const savedReadingMode = localStorage.getItem(READING_MODE_KEY);
    if (savedReadingMode === "feed" || savedReadingMode === "paged") {
      setReadingModeState(savedReadingMode);
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
    if (!READ_CHAPTERS_IN_ROW_ENABLED) return;
    setReadChaptersInRowState(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAPTERS_IN_ROW_KEY, value.toString());
    }
  }, []);

  const readChaptersInRow = READ_CHAPTERS_IN_ROW_ENABLED && readChaptersInRowState;

  const setReadingMode = useCallback((mode: ReadingMode) => {
    setReadingModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem(READING_MODE_KEY, mode);
    }
  }, []);

  return {
    showPageCounter,
    setShowPageCounter,
    toggleShowPageCounter,
    readChaptersInRow,
    setReadChaptersInRow,
    readingMode,
    setReadingMode,
  };
}
