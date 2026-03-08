"use client";

import {
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

const STORAGE_KEYS = {
  showPageCounter: "reader-show-page-counter",
  chaptersInRow: "reader-chapters-in-row",
  readingMode: "reader-reading-mode",
  pageGap: "reader-page-gap",
  brightness: "reader-brightness",
  contrast: "reader-contrast",
  eyeComfort: "reader-eye-comfort",
  doublePage: "reader-double-page",
  fitMode: "reader-fit-mode",
  direction: "reader-direction",
  infiniteScroll: "reader-infinite-scroll",
  showTimer: "reader-show-timer",
  showHints: "reader-show-hints",
  showProgress: "reader-show-progress",
  imageQuality: "reader-image-quality",
  hapticEnabled: "reader-haptic-enabled",
  dataSaver: "reader-data-saver",
} as const;

export type ReadingMode = "feed" | "paged";
export type EyeComfortMode = "off" | "warm" | "sepia" | "dark";
export type FitMode = "width" | "height" | "original" | "auto";
export type ReadingDirection = "ltr" | "rtl";
export type ImageQualityMode = "low" | "medium" | "high" | "auto";

interface ReaderSettings {
  showPageCounter: boolean;
  readChaptersInRow: boolean;
  readingMode: ReadingMode;
  pageGap: number;
  brightness: number;
  contrast: number;
  eyeComfortMode: EyeComfortMode;
  doublePageMode: boolean;
  fitMode: FitMode;
  readingDirection: ReadingDirection;
  infiniteScroll: boolean;
  showTimer: boolean;
  showHints: boolean;
  showProgress: boolean;
  imageQuality: ImageQualityMode;
  hapticEnabled: boolean;
  dataSaver: boolean;
}

export interface UseReaderSettingsReturn extends ReaderSettings {
  setShowPageCounter: (value: boolean) => void;
  toggleShowPageCounter: () => void;
  setReadChaptersInRow: (value: boolean) => void;
  setReadingMode: (mode: ReadingMode) => void;
  setPageGap: (value: number) => void;
  setBrightness: (value: number) => void;
  setContrast: (value: number) => void;
  setEyeComfortMode: (mode: EyeComfortMode) => void;
  setDoublePageMode: (value: boolean) => void;
  setFitMode: (mode: FitMode) => void;
  setReadingDirection: (dir: ReadingDirection) => void;
  setInfiniteScroll: (value: boolean) => void;
  setShowTimer: (value: boolean) => void;
  setShowHints: (value: boolean) => void;
  setShowProgress: (value: boolean) => void;
  setImageQuality: (quality: ImageQualityMode) => void;
  getQualityValue: () => number;
  hapticEnabled: boolean;
  setHapticEnabled: (value: boolean) => void;
  dataSaver: boolean;
  setDataSaver: (value: boolean) => void;
  resetToDefaults: () => void;
}

export const READ_CHAPTERS_IN_ROW_ENABLED = false;

const DEFAULT_SETTINGS: ReaderSettings = {
  showPageCounter: true,
  readChaptersInRow: false,
  readingMode: "feed",
  pageGap: 0,
  brightness: 100,
  contrast: 100,
  eyeComfortMode: "off",
  doublePageMode: false,
  fitMode: "width",
  readingDirection: "ltr",
  infiniteScroll: false,
  showTimer: false,
  showHints: false,
  showProgress: false,
  imageQuality: "auto",
  hapticEnabled: true,
  dataSaver: false,
};

function qualityModeToValue(mode: ImageQualityMode): number {
  switch (mode) {
    case "low":
      return 60;
    case "medium":
      return 75;
    case "high":
      return 90;
    case "auto":
      return 85;
    default:
      return 85;
  }
}

function safeLocalStorageGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
}

function safeLocalStorageRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

function parseBoolean(value: string | null, defaultValue: boolean): boolean {
  if (value === null) return defaultValue;
  return value === "true";
}

function parseNumber(value: string | null, defaultValue: number, min: number, max: number): number {
  if (value === null) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < min || parsed > max) return defaultValue;
  return parsed;
}

function parseEnum<T extends string>(
  value: string | null,
  validValues: readonly T[],
  defaultValue: T,
): T {
  if (value === null || !validValues.includes(value as T)) return defaultValue;
  return value as T;
}

function getInitialSettings(): ReaderSettings {
  const savedChaptersInRow = safeLocalStorageGet(STORAGE_KEYS.chaptersInRow);

  return {
    showPageCounter: parseBoolean(
      safeLocalStorageGet(STORAGE_KEYS.showPageCounter),
      DEFAULT_SETTINGS.showPageCounter,
    ),
    readChaptersInRow:
      READ_CHAPTERS_IN_ROW_ENABLED &&
      parseBoolean(savedChaptersInRow, DEFAULT_SETTINGS.readChaptersInRow),
    readingMode: parseEnum(
      safeLocalStorageGet(STORAGE_KEYS.readingMode),
      ["feed", "paged"] as const,
      DEFAULT_SETTINGS.readingMode,
    ),
    pageGap: parseNumber(
      safeLocalStorageGet(STORAGE_KEYS.pageGap),
      DEFAULT_SETTINGS.pageGap,
      0,
      100,
    ),
    brightness: parseNumber(
      safeLocalStorageGet(STORAGE_KEYS.brightness),
      DEFAULT_SETTINGS.brightness,
      50,
      150,
    ),
    contrast: parseNumber(
      safeLocalStorageGet(STORAGE_KEYS.contrast),
      DEFAULT_SETTINGS.contrast,
      50,
      150,
    ),
    eyeComfortMode: parseEnum(
      safeLocalStorageGet(STORAGE_KEYS.eyeComfort),
      ["off", "warm", "sepia", "dark"] as const,
      DEFAULT_SETTINGS.eyeComfortMode,
    ),
    doublePageMode: parseBoolean(
      safeLocalStorageGet(STORAGE_KEYS.doublePage),
      DEFAULT_SETTINGS.doublePageMode,
    ),
    fitMode: parseEnum(
      safeLocalStorageGet(STORAGE_KEYS.fitMode),
      ["width", "height", "original", "auto"] as const,
      DEFAULT_SETTINGS.fitMode,
    ),
    readingDirection: parseEnum(
      safeLocalStorageGet(STORAGE_KEYS.direction),
      ["ltr", "rtl"] as const,
      DEFAULT_SETTINGS.readingDirection,
    ),
    infiniteScroll: parseBoolean(
      safeLocalStorageGet(STORAGE_KEYS.infiniteScroll),
      DEFAULT_SETTINGS.infiniteScroll,
    ),
    showTimer: parseBoolean(
      safeLocalStorageGet(STORAGE_KEYS.showTimer),
      DEFAULT_SETTINGS.showTimer,
    ),
    showHints: parseBoolean(
      safeLocalStorageGet(STORAGE_KEYS.showHints),
      DEFAULT_SETTINGS.showHints,
    ),
    showProgress: parseBoolean(
      safeLocalStorageGet(STORAGE_KEYS.showProgress),
      DEFAULT_SETTINGS.showProgress,
    ),
    imageQuality: parseEnum(
      safeLocalStorageGet(STORAGE_KEYS.imageQuality),
      ["low", "medium", "high", "auto"] as const,
      DEFAULT_SETTINGS.imageQuality,
    ),
    hapticEnabled: parseBoolean(
      safeLocalStorageGet(STORAGE_KEYS.hapticEnabled),
      DEFAULT_SETTINGS.hapticEnabled,
    ),
    dataSaver: parseBoolean(
      safeLocalStorageGet(STORAGE_KEYS.dataSaver),
      DEFAULT_SETTINGS.dataSaver,
    ),
  };
}

function useReaderSettingsImpl(): UseReaderSettingsReturn {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadedSettings = getInitialSettings();
    setSettings(loadedSettings);
    setIsInitialized(true);
  }, []);

  const createSetter = useCallback(
    <K extends keyof ReaderSettings>(
      key: K,
      storageKey: string,
      transform?: (value: ReaderSettings[K]) => ReaderSettings[K],
    ) => {
      return (value: ReaderSettings[K]) => {
        const finalValue = transform ? transform(value) : value;
        setSettings(prev => ({ ...prev, [key]: finalValue }));
        safeLocalStorageSet(storageKey, String(finalValue));
      };
    },
    [],
  );
  void isInitialized;
  void createSetter;

  const setShowPageCounter = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showPageCounter: value }));
    safeLocalStorageSet(STORAGE_KEYS.showPageCounter, String(value));
  }, []);

  const toggleShowPageCounter = useCallback(() => {
    setSettings(prev => {
      const newValue = !prev.showPageCounter;
      safeLocalStorageSet(STORAGE_KEYS.showPageCounter, String(newValue));
      return { ...prev, showPageCounter: newValue };
    });
  }, []);

  const setReadChaptersInRow = useCallback((value: boolean) => {
    if (!READ_CHAPTERS_IN_ROW_ENABLED) return;
    setSettings(prev => ({ ...prev, readChaptersInRow: value }));
    safeLocalStorageSet(STORAGE_KEYS.chaptersInRow, String(value));
  }, []);

  const setReadingMode = useCallback((mode: ReadingMode) => {
    setSettings(prev => ({ ...prev, readingMode: mode }));
    safeLocalStorageSet(STORAGE_KEYS.readingMode, mode);
  }, []);

  const setPageGap = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setSettings(prev => ({ ...prev, pageGap: clamped }));
    safeLocalStorageSet(STORAGE_KEYS.pageGap, String(clamped));
  }, []);

  const setBrightness = useCallback((value: number) => {
    const clamped = Math.max(50, Math.min(150, value));
    setSettings(prev => ({ ...prev, brightness: clamped }));
    safeLocalStorageSet(STORAGE_KEYS.brightness, String(clamped));
  }, []);

  const setContrast = useCallback((value: number) => {
    const clamped = Math.max(50, Math.min(150, value));
    setSettings(prev => ({ ...prev, contrast: clamped }));
    safeLocalStorageSet(STORAGE_KEYS.contrast, String(clamped));
  }, []);

  const setEyeComfortMode = useCallback((mode: EyeComfortMode) => {
    setSettings(prev => ({ ...prev, eyeComfortMode: mode }));
    safeLocalStorageSet(STORAGE_KEYS.eyeComfort, mode);
  }, []);

  const setDoublePageMode = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, doublePageMode: value }));
    safeLocalStorageSet(STORAGE_KEYS.doublePage, String(value));
  }, []);

  const setFitMode = useCallback((mode: FitMode) => {
    setSettings(prev => ({ ...prev, fitMode: mode }));
    safeLocalStorageSet(STORAGE_KEYS.fitMode, mode);
  }, []);

  const setReadingDirection = useCallback((dir: ReadingDirection) => {
    setSettings(prev => ({ ...prev, readingDirection: dir }));
    safeLocalStorageSet(STORAGE_KEYS.direction, dir);
  }, []);

  const setInfiniteScroll = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, infiniteScroll: value }));
    safeLocalStorageSet(STORAGE_KEYS.infiniteScroll, String(value));
  }, []);

  const setShowTimer = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showTimer: value }));
    safeLocalStorageSet(STORAGE_KEYS.showTimer, String(value));
  }, []);

  const setShowHints = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showHints: value }));
    safeLocalStorageSet(STORAGE_KEYS.showHints, String(value));
  }, []);

  const setShowProgress = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, showProgress: value }));
    safeLocalStorageSet(STORAGE_KEYS.showProgress, String(value));
  }, []);

  const setImageQuality = useCallback((quality: ImageQualityMode) => {
    setSettings(prev => ({ ...prev, imageQuality: quality }));
    safeLocalStorageSet(STORAGE_KEYS.imageQuality, quality);
  }, []);

  const setHapticEnabled = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, hapticEnabled: value }));
    safeLocalStorageSet(STORAGE_KEYS.hapticEnabled, String(value));
  }, []);

  const setDataSaver = useCallback((value: boolean) => {
    setSettings(prev => ({ ...prev, dataSaver: value }));
    safeLocalStorageSet(STORAGE_KEYS.dataSaver, String(value));
  }, []);

  const getQualityValue = useCallback(() => {
    if (settings.dataSaver) return 60;
    return qualityModeToValue(settings.imageQuality);
  }, [settings.imageQuality, settings.dataSaver]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    Object.values(STORAGE_KEYS).forEach(key => safeLocalStorageRemove(key));
  }, []);

  const effectiveReadChaptersInRow = READ_CHAPTERS_IN_ROW_ENABLED && settings.readChaptersInRow;

  return useMemo(
    () => ({
      ...settings,
      readChaptersInRow: effectiveReadChaptersInRow,
      setHapticEnabled,
      setDataSaver,
      setShowPageCounter,
      toggleShowPageCounter,
      setReadChaptersInRow,
      setReadingMode,
      setPageGap,
      setBrightness,
      setContrast,
      setEyeComfortMode,
      setDoublePageMode,
      setFitMode,
      setReadingDirection,
      setInfiniteScroll,
      setShowTimer,
      setShowHints,
      setShowProgress,
      setImageQuality,
      getQualityValue,
      resetToDefaults,
    }),
    [
      settings,
      effectiveReadChaptersInRow,
      setHapticEnabled,
      setDataSaver,
      setShowPageCounter,
      toggleShowPageCounter,
      setReadChaptersInRow,
      setReadingMode,
      setPageGap,
      setBrightness,
      setContrast,
      setEyeComfortMode,
      setDoublePageMode,
      setFitMode,
      setReadingDirection,
      setInfiniteScroll,
      setShowTimer,
      setShowHints,
      setShowProgress,
      setImageQuality,
      getQualityValue,
      resetToDefaults,
    ],
  );
}

export function useReaderSettings(): UseReaderSettingsReturn {
  return useReaderSettingsImpl();
}

const ReaderSettingsContext = createContext<UseReaderSettingsReturn | null>(null);

export function ReaderSettingsProvider({ children }: { children: ReactNode }) {
  const value = useReaderSettingsImpl();

  return <ReaderSettingsContext.Provider value={value}>{children}</ReaderSettingsContext.Provider>;
}

export function useReaderSettingsContext(): UseReaderSettingsReturn {
  const context = useContext(ReaderSettingsContext);
  if (context === null) {
    throw new Error("useReaderSettingsContext must be used within ReaderSettingsProvider");
  }
  return context;
}
