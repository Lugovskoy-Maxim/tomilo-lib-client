"use client";

import { useCallback, useRef } from "react";

export interface UseIntersectionTriggerOptions {
  /** Подгрузка до появления в viewport (например "300px" для бесконечного скролла) */
  rootMargin?: string;
  threshold?: number | number[];
  /** Вызывать callback только когда true (например !loading && hasMore) */
  enabled?: boolean;
}

/**
 * Готовый триггер для бесконечного скролла / load more.
 * Вешайте возвращённый ref на сентинель внизу списка — при появлении в viewport вызовется onIntersect.
 * По образцу ChaptersTab (TitleView) и PageThumbnails.
 */
export function useIntersectionTrigger(
  onIntersect: () => void,
  options: UseIntersectionTriggerOptions = {},
): (node: HTMLDivElement | null) => void {
  const { rootMargin = "300px", threshold = 0, enabled = true } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const onIntersectRef = useRef(onIntersect);
  const enabledRef = useRef(enabled);

  onIntersectRef.current = onIntersect;
  enabledRef.current = enabled;

  return useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        entries => {
          const entry = entries[0];
          if (!entry?.isIntersecting || !enabledRef.current) return;
          onIntersectRef.current();
        },
        { rootMargin, threshold },
      );
      observerRef.current.observe(node);
    },
    [rootMargin, typeof threshold === "number" ? threshold : undefined],
  );
}
