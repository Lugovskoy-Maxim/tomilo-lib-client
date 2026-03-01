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
  };
}

export function useReaderSettings(): UseReaderSettingsReturn {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const loadedSettings = getInitialSettings();
    setSettings(loadedSettings);
  }, []);

  const { showPageCounter, readChaptersInRow: readChaptersInRowState, readingMode, pageGap, brightness, contrast, eyeComfortMode, doublePageMode, fitMode, readingDirection } = settings;

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

  const { showPageCounter, readChaptersInRow: readChaptersInRowState, readingMode, pageGap, brightness, contrast, eyeComfortMode, doublePageMode, fitMode, readingDirection } = settings;

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
