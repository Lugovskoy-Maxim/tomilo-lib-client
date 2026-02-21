"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export const FONT_STORAGE_KEY = "tomilo_lib_font";

export type SiteFont = "exo2" | "comfortaa" | "nunito" | "rubik";

const FONTS: SiteFont[] = ["exo2", "comfortaa", "nunito", "rubik"];

const FONT_CLASSES: SiteFont[] = ["comfortaa", "nunito", "rubik"];

function getStoredFont(): SiteFont {
  if (typeof window === "undefined") return "exo2";
  try {
    const stored = localStorage.getItem(FONT_STORAGE_KEY);
    if (stored && FONTS.includes(stored as SiteFont)) return stored as SiteFont;
  } catch {
    // ignore
  }
  return "exo2";
}

function applyFontToDocument(font: SiteFont) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  FONT_CLASSES.forEach((c) => el.classList.remove(`font-${c}`));
  if (font !== "exo2") el.classList.add(`font-${font}`);
}

type FontContextType = {
  font: SiteFont;
  setFont: (font: SiteFont) => void;
};

const FontContext = createContext<FontContextType | undefined>(undefined);

export function useFont() {
  const ctx = useContext(FontContext);
  if (!ctx) throw new Error("useFont must be used within FontProvider");
  return ctx;
}

interface FontProviderProps {
  children: React.ReactNode;
}

export function FontProvider({ children }: FontProviderProps) {
  const [font, setFontState] = useState<SiteFont>("exo2");

  useEffect(() => {
    const stored = getStoredFont();
    setFontState(stored);
    applyFontToDocument(stored);
  }, []);

  const setFont = useCallback((value: SiteFont) => {
    setFontState(value);
    try {
      localStorage.setItem(FONT_STORAGE_KEY, value);
    } catch {
      // ignore
    }
    applyFontToDocument(value);
  }, []);

  return (
    <FontContext.Provider value={{ font, setFont }}>
      {children}
    </FontContext.Provider>
  );
}
