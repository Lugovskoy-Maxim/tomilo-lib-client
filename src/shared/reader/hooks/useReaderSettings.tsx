"use client";

import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from "react";

const CHAPTERS_IN_ROW_KEY = "reader-chapters-in-row";
const READING_MODE_KEY = "reader-reading-mode";
const PAGE_GAP_KEY = "reader-page-gap";
const BRIGHTNESS_KEY = "reader-brightness";
const CONTRAST_KEY = "reader-contrast";
const EYE_COMFORT_KEY = "reader-eye-comfort";
const DOUBLE_PAGE_KEY = "reader-double-page";
const FIT_MODE_KEY = "reader-fit-mode";
const READING_DIRECTION_KEY = "reader-direction";
const INFINITE_SCROLL_KEY = "reader-infinite-scroll";
const SHOW_TIMER_KEY = "reader-show-timer";
const SHOW_HINTS_KEY = "reader-show-hints";
const SHOW_PROGRESS_KEY = "reader-show-progress";

export type ReadingMode = "feed" | "paged";
export type EyeComfortMode = "off" | "warm" | "sepia" | "dark";
export type FitMode = "width" | "height" | "original" | "auto";
export type ReadingDirection = "ltr" | "rtl";

interface UseReaderSettingsReturn {
  showPageCounter: boolean;
  setShowPageCounter: (value: boolean) => void;
  toggleShowPageCounter: () => void;
  readChaptersInRow: boolean;
  setReadChaptersInRow: (value: boolean) => void;
  readingMode: ReadingMode;
  setReadingMode: (mode: ReadingMode) => void;
  pageGap: number;
  setPageGap: (value: number) => void;
  brightness: number;
  setBrightness: (value: number) => void;
  contrast: number;
  setContrast: (value: number) => void;
  eyeComfortMode: EyeComfortMode;
  setEyeComfortMode: (mode: EyeComfortMode) => void;
  doublePageMode: boolean;
  setDoublePageMode: (value: boolean) => void;
  fitMode: FitMode;
  setFitMode: (mode: FitMode) => void;
  readingDirection: ReadingDirection;
  setReadingDirection: (dir: ReadingDirection) => void;
  infiniteScroll: boolean;
  setInfiniteScroll: (value: boolean) => void;
  showTimer: boolean;
  setShowTimer: (value: boolean) => void;
  showHints: boolean;
  setShowHints: (value: boolean) => void;
  showProgress: boolean;
  setShowProgress: (value: boolean) => void;
  resetToDefaults: () => void;
}

export const READ_CHAPTERS_IN_ROW_ENABLED = false;

const DEFAULT_SETTINGS = {
  showPageCounter: true,
  readChaptersInRow: false,
  readingMode: "feed" as ReadingMode,
  pageGap: 0,
  brightness: 100,
  contrast: 100,
  eyeComfortMode: "off" as EyeComfortMode,
  doublePageMode: false,
  fitMode: "width" as FitMode,
  readingDirection: "ltr" as ReadingDirection,
  infiniteScroll: false,
  showTimer: true,
  showHints: true,
  showProgress: true,
};

function getInitialSettings() {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  const savedShowPageCounter = localStorage.getItem("reader-show-page-counter");
  const savedChaptersInRow = localStorage.getItem(CHAPTERS_IN_ROW_KEY);
  const savedReadingMode = localStorage.getItem(READING_MODE_KEY);
  const savedPageGap = localStorage.getItem(PAGE_GAP_KEY);
  const savedBrightness = localStorage.getItem(BRIGHTNESS_KEY);
  const savedContrast = localStorage.getItem(CONTRAST_KEY);
  const savedEyeComfort = localStorage.getItem(EYE_COMFORT_KEY);
  const savedDoublePage = localStorage.getItem(DOUBLE_PAGE_KEY);
  const savedFitMode = localStorage.getItem(FIT_MODE_KEY);
  const savedDirection = localStorage.getItem(READING_DIRECTION_KEY);
  const savedInfiniteScroll = localStorage.getItem(INFINITE_SCROLL_KEY);
  const savedShowTimer = localStorage.getItem(SHOW_TIMER_KEY);
  const savedShowHints = localStorage.getItem(SHOW_HINTS_KEY);
  const savedShowProgress = localStorage.getItem(SHOW_PROGRESS_KEY);

  const pageGapParsed = savedPageGap ? parseInt(savedPageGap, 10) : NaN;
  const brightnessParsed = savedBrightness ? parseInt(savedBrightness, 10) : NaN;
  const contrastParsed = savedContrast ? parseInt(savedContrast, 10) : NaN;

  return {
    showPageCounter: savedShowPageCounter !== null ? savedShowPageCounter === "true" : DEFAULT_SETTINGS.showPageCounter,
    readChaptersInRow: READ_CHAPTERS_IN_ROW_ENABLED && savedChaptersInRow !== null 
      ? savedChaptersInRow === "true" 
      : DEFAULT_SETTINGS.readChaptersInRow,
    readingMode: (savedReadingMode === "feed" || savedReadingMode === "paged") 
      ? savedReadingMode 
      : DEFAULT_SETTINGS.readingMode,
    pageGap: !isNaN(pageGapParsed) && pageGapParsed >= 0 && pageGapParsed <= 100 
      ? pageGapParsed 
      : DEFAULT_SETTINGS.pageGap,
    brightness: !isNaN(brightnessParsed) && brightnessParsed >= 50 && brightnessParsed <= 150 
      ? brightnessParsed 
      : DEFAULT_SETTINGS.brightness,
    contrast: !isNaN(contrastParsed) && contrastParsed >= 50 && contrastParsed <= 150 
      ? contrastParsed 
      : DEFAULT_SETTINGS.contrast,
    eyeComfortMode: (savedEyeComfort === "off" || savedEyeComfort === "warm" || savedEyeComfort === "sepia" || savedEyeComfort === "dark") 
      ? savedEyeComfort 
      : DEFAULT_SETTINGS.eyeComfortMode,
    doublePageMode: savedDoublePage !== null 
      ? savedDoublePage === "true" 
      : DEFAULT_SETTINGS.doublePageMode,
    fitMode: (savedFitMode === "width" || savedFitMode === "height" || savedFitMode === "original" || savedFitMode === "auto") 
      ? savedFitMode 
      : DEFAULT_SETTINGS.fitMode,
    readingDirection: (savedDirection === "ltr" || savedDirection === "rtl") 
      ? savedDirection 
      : DEFAULT_SETTINGS.readingDirection,
    infiniteScroll: savedInfiniteScroll !== null
      ? savedInfiniteScroll === "true"
      : DEFAULT_SETTINGS.infiniteScroll,
    showTimer: savedShowTimer !== null
      ? savedShowTimer === "true"
      : DEFAULT_SETTINGS.showTimer,
    showHints: savedShowHints !== null
      ? savedShowHints === "true"
      : DEFAULT_SETTINGS.showHints,
    showProgress: savedShowProgress !== null
      ? savedShowProgress === "true"
      : DEFAULT_SETTINGS.showProgress,
  };
}

export function useReaderSettings(): UseReaderSettingsReturn {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const loadedSettings = getInitialSettings();
    setSettings(loadedSettings);
  }, []);

  const { showPageCounter, readChaptersInRow: readChaptersInRowState, readingMode, pageGap, brightness, contrast, eyeComfortMode, doublePageMode, fitMode, readingDirection, infiniteScroll, showTimer, showHints, showProgress } = settings;

  const setShowPageCounter = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showPageCounter: value }));
    if (typeof window !== "undefined") {
      localStorage.setItem("reader-show-page-counter", value.toString());
    }
  }, []);

  const toggleShowPageCounter = useCallback(() => {
    setSettings(prev => {
      const newValue = !prev.showPageCounter;
      if (typeof window !== "undefined") {
        localStorage.setItem("reader-show-page-counter", newValue.toString());
      }
      return { ...prev, showPageCounter: newValue };
    });
  }, []);

  const setReadChaptersInRow = useCallback((value: boolean) => {
    if (!READ_CHAPTERS_IN_ROW_ENABLED) return;
    setSettings(prev => ({ ...prev, readChaptersInRow: value }));
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAPTERS_IN_ROW_KEY, value.toString());
    }
  }, []);

  const readChaptersInRow = READ_CHAPTERS_IN_ROW_ENABLED && readChaptersInRowState;

  const setReadingMode = useCallback((mode: ReadingMode) => {
    setSettings(prev => ({ ...prev, readingMode: mode }));
    if (typeof window !== "undefined") {
      localStorage.setItem(READING_MODE_KEY, mode);
    }
  }, []);

  const setPageGap = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setSettings(prev => ({ ...prev, pageGap: clamped }));
    if (typeof window !== "undefined") {
      localStorage.setItem(PAGE_GAP_KEY, clamped.toString());
    }
  }, []);

  const setBrightness = useCallback((value: number) => {
    const clamped = Math.max(50, Math.min(150, value));
    setSettings(prev => ({ ...prev, brightness: clamped }));
    if (typeof window !== "undefined") {
      localStorage.setItem(BRIGHTNESS_KEY, clamped.toString());
    }
  }, []);

  const setContrast = useCallback((value: number) => {
    const clamped = Math.max(50, Math.min(150, value));
    setSettings(prev => ({ ...prev, contrast: clamped }));
    if (typeof window !== "undefined") {
      localStorage.setItem(CONTRAST_KEY, clamped.toString());
    }
  }, []);

  const setEyeComfortMode = useCallback((mode: EyeComfortMode) => {
    setSettings(prev => ({ ...prev, eyeComfortMode: mode }));
    if (typeof window !== "undefined") {
      localStorage.setItem(EYE_COMFORT_KEY, mode);
    }
  }, []);

  const setDoublePageMode = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, doublePageMode: value }));
    if (typeof window !== "undefined") {
      localStorage.setItem(DOUBLE_PAGE_KEY, value.toString());
    }
  }, []);

  const setFitMode = useCallback((mode: FitMode) => {
    setSettings(prev => ({ ...prev, fitMode: mode }));
    if (typeof window !== "undefined") {
      localStorage.setItem(FIT_MODE_KEY, mode);
    }
  }, []);

  const setReadingDirection = useCallback((dir: ReadingDirection) => {
    setSettings(prev => ({ ...prev, readingDirection: dir }));
    if (typeof window !== "undefined") {
      localStorage.setItem(READING_DIRECTION_KEY, dir);
    }
  }, []);

  const setInfiniteScroll = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, infiniteScroll: value }));
    if (typeof window !== "undefined") {
      localStorage.setItem(INFINITE_SCROLL_KEY, value.toString());
    }
  }, []);

  const setShowTimer = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showTimer: value }));
    if (typeof window !== "undefined") {
      localStorage.setItem(SHOW_TIMER_KEY, value.toString());
    }
  }, []);

  const setShowHints = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showHints: value }));
    if (typeof window !== "undefined") {
      localStorage.setItem(SHOW_HINTS_KEY, value.toString());
    }
  }, []);

  const setShowProgress = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showProgress: value }));
    if (typeof window !== "undefined") {
      localStorage.setItem(SHOW_PROGRESS_KEY, value.toString());
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    if (typeof window !== "undefined") {
      localStorage.removeItem("reader-show-page-counter");
      localStorage.removeItem(CHAPTERS_IN_ROW_KEY);
      localStorage.removeItem(READING_MODE_KEY);
      localStorage.removeItem(PAGE_GAP_KEY);
      localStorage.removeItem(BRIGHTNESS_KEY);
      localStorage.removeItem(CONTRAST_KEY);
      localStorage.removeItem(EYE_COMFORT_KEY);
      localStorage.removeItem(DOUBLE_PAGE_KEY);
      localStorage.removeItem(FIT_MODE_KEY);
      localStorage.removeItem(READING_DIRECTION_KEY);
      localStorage.removeItem(INFINITE_SCROLL_KEY);
      localStorage.removeItem(SHOW_TIMER_KEY);
      localStorage.removeItem(SHOW_HINTS_KEY);
      localStorage.removeItem(SHOW_PROGRESS_KEY);
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
    pageGap,
    setPageGap,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    eyeComfortMode,
    setEyeComfortMode,
    doublePageMode,
    setDoublePageMode,
    fitMode,
    setFitMode,
    readingDirection,
    setReadingDirection,
    infiniteScroll,
    setInfiniteScroll,
    showTimer,
    setShowTimer,
    showHints,
    setShowHints,
    showProgress,
    setShowProgress,
    resetToDefaults,
  };
}

// Context для глобального состояния настроек читалки
const ReaderSettingsContext = createContext<UseReaderSettingsReturn | null>(null);

export function ReaderSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const loadedSettings = getInitialSettings();
    setSettings(loadedSettings);
  }, []);

  const { showPageCounter, readChaptersInRow: readChaptersInRowState, readingMode, pageGap, brightness, contrast, eyeComfortMode, doublePageMode, fitMode, readingDirection, infiniteScroll, showTimer, showHints, showProgress } = settings;

  const setShowPageCounter = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showPageCounter: value }));
    if (typeof window !== "undefined") {
      localStorage.setItem("reader-show-page-counter", value.toString());
    }
  }, []);

  const toggleShowPageCounter = useCallback(() => {
    setSettings(prev => {
      const newValue = !prev.showPageCounter;
      if (typeof window !== "undefined") {
        localStorage.setItem("reader-show-page-counter", newValue.toString());
      }
      return { ...prev, showPageCounter: newValue };
    });
  }, []);

  const setReadChaptersInRow = useCallback((value: boolean) => {
    if (!READ_CHAPTERS_IN_ROW_ENABLED) return;
    setSettings(prev => ({ ...prev, readChaptersInRow: value }));
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAPTERS_IN_ROW_KEY, value.toString());
    }
  }, []);

  const readChaptersInRow = READ_CHAPTERS_IN_ROW_ENABLED && readChaptersInRowState;

  const setReadingMode = useCallback((mode: ReadingMode) => {
    setSettings(prev => ({ ...prev, readingMode: mode }));
    if (typeof window !== "undefined") {
      localStorage.setItem(READING_MODE_KEY, mode);
    }
  }, []);

  const setPageGap = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setSettings(prev => ({ ...prev, pageGap: clamped }));
    if (typeof window !== "undefined") {
      localStorage.setItem(PAGE_GAP_KEY, clamped.toString());
    }
  }, []);

  const setBrightness = useCallback((value: number) => {
    const clamped = Math.max(50, Math.min(150, value));
    setSettings(prev => ({ ...prev, brightness: clamped }));
    if (typeof window !== "undefined") {
      localStorage.setItem(BRIGHTNESS_KEY, clamped.toString());
    }
  }, []);

  const setContrast = useCallback((value: number) => {
    const clamped = Math.max(50, Math.min(150, value));
    setSettings(prev => ({ ...prev, contrast: clamped }));
    if (typeof window !== "undefined") {
      localStorage.setItem(CONTRAST_KEY, clamped.toString());
    }
  }, []);

  const setEyeComfortMode = useCallback((mode: EyeComfortMode) => {
    setSettings(prev => ({ ...prev, eyeComfortMode: mode }));
    if (typeof window !== "undefined") {
      localStorage.setItem(EYE_COMFORT_KEY, mode);
    }
  }, []);

  const setDoublePageMode = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, doublePageMode: value }));
    if (typeof window !== "undefined") {
      localStorage.setItem(DOUBLE_PAGE_KEY, value.toString());
    }
  }, []);

  const setFitMode = useCallback((mode: FitMode) => {
    setSettings(prev => ({ ...prev, fitMode: mode }));
    if (typeof window !== "undefined") {
      localStorage.setItem(FIT_MODE_KEY, mode);
    }
  }, []);

  const setReadingDirection = useCallback((dir: ReadingDirection) => {
    setSettings(prev => ({ ...prev, readingDirection: dir }));
    if (typeof window !== "undefined") {
      localStorage.setItem(READING_DIRECTION_KEY, dir);
    }
  }, []);

  const setInfiniteScroll = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, infiniteScroll: value }));
    if (typeof window !== "undefined") {
      localStorage.setItem(INFINITE_SCROLL_KEY, value.toString());
    }
  }, []);

  const setShowTimer = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showTimer: value }));
    if (typeof window !== "undefined") {
      localStorage.setItem(SHOW_TIMER_KEY, value.toString());
    }
  }, []);

  const setShowHints = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showHints: value }));
    if (typeof window !== "undefined") {
      localStorage.setItem(SHOW_HINTS_KEY, value.toString());
    }
  }, []);

  const setShowProgress = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showProgress: value }));
    if (typeof window !== "undefined") {
      localStorage.setItem(SHOW_PROGRESS_KEY, value.toString());
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    if (typeof window !== "undefined") {
      localStorage.removeItem("reader-show-page-counter");
      localStorage.removeItem(CHAPTERS_IN_ROW_KEY);
      localStorage.removeItem(READING_MODE_KEY);
      localStorage.removeItem(PAGE_GAP_KEY);
      localStorage.removeItem(BRIGHTNESS_KEY);
      localStorage.removeItem(CONTRAST_KEY);
      localStorage.removeItem(EYE_COMFORT_KEY);
      localStorage.removeItem(DOUBLE_PAGE_KEY);
      localStorage.removeItem(FIT_MODE_KEY);
      localStorage.removeItem(READING_DIRECTION_KEY);
      localStorage.removeItem(INFINITE_SCROLL_KEY);
      localStorage.removeItem(SHOW_TIMER_KEY);
      localStorage.removeItem(SHOW_HINTS_KEY);
      localStorage.removeItem(SHOW_PROGRESS_KEY);
    }
  }, []);

  const value: UseReaderSettingsReturn = {
    showPageCounter,
    setShowPageCounter,
    toggleShowPageCounter,
    readChaptersInRow,
    setReadChaptersInRow,
    readingMode,
    setReadingMode,
    pageGap,
    setPageGap,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    eyeComfortMode,
    setEyeComfortMode,
    doublePageMode,
    setDoublePageMode,
    fitMode,
    setFitMode,
    readingDirection,
    setReadingDirection,
    infiniteScroll,
    setInfiniteScroll,
    showTimer,
    setShowTimer,
    showHints,
    setShowHints,
    showProgress,
    setShowProgress,
    resetToDefaults,
  };

  return (
    <ReaderSettingsContext.Provider value={value}>
      {children}
    </ReaderSettingsContext.Provider>
  );
}

export function useReaderSettingsContext(): UseReaderSettingsReturn {
  const context = useContext(ReaderSettingsContext);
  if (context === null) {
    throw new Error("useReaderSettingsContext must be used within ReaderSettingsProvider");
  }
  return context;
}
