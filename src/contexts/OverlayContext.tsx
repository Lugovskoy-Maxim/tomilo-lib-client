"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

type OverlayContent = ReactNode;

interface OverlayContextValue {
  setOverlayContent: (content: OverlayContent) => void;
}

const OverlayContext = createContext<OverlayContextValue | undefined>(undefined);

export function useOverlay(): OverlayContextValue | undefined {
  return useContext(OverlayContext);
}

interface OverlayProviderProps {
  children: ReactNode;
}

/**
 * Провайдер для рендера оверлеев (пикеры, тултипы) в корне приложения
 * без использования createPortal. Контент рендерится в слот без transform,
 * чтобы position:fixed работал корректно на мобильных (внутри панелей с transform).
 */
export function OverlayProvider({ children }: OverlayProviderProps) {
  const [content, setContent] = useState<OverlayContent>(null);

  const setOverlayContent = useCallback((next: OverlayContent) => {
    setContent(next);
  }, []);

  const value = useMemo<OverlayContextValue>(
    () => ({ setOverlayContent }),
    [setOverlayContent],
  );

  return (
    <OverlayContext.Provider value={value}>
      {children}
      {/* Слот в корне дерева — без transform у предков, fixed позиционирование работает */}
      <div id="overlay-slot" aria-hidden={content == null}>
        {content}
      </div>
    </OverlayContext.Provider>
  );
}
