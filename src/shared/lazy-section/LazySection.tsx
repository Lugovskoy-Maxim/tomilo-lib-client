"use client";

import React, { useEffect, useRef, useState } from "react";

export interface LazySectionProps {
  /** Уникальный id секции для отчёта в onVisible */
  sectionId: string;
  /** Вызывается один раз, когда секция попадает в viewport */
  onVisible: (sectionId: string) => void;
  /** Показывать ли контент (устанавливается снаружи по onVisible) */
  isVisible: boolean;
  /** Скелетон, пока секция не в viewport или пока не загружена */
  skeleton: React.ReactNode;
  /** Контент секции (рендерится после первого попадания в viewport) */
  children: React.ReactNode;
  /** rootMargin для Intersection Observer (подгрузка до появления в viewport) */
  rootMargin?: string;
}

/**
 * Оборачивает блок главной страницы: показывает skeleton до попадания в viewport,
 * затем один раз вызывает onVisible(sectionId) и рендерит children.
 */
export default function LazySection({
  sectionId,
  onVisible,
  isVisible,
  skeleton,
  children,
  rootMargin = "200px 0px",
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    if (hasBeenVisible || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasBeenVisible(true);
          onVisible(sectionId);
        }
      },
      { rootMargin, threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionId, onVisible, rootMargin, hasBeenVisible]);

  const showContent = hasBeenVisible || isVisible;

  return (
    <div ref={ref} id={`section-${sectionId}`} className="w-full min-w-0">
      {showContent ? children : skeleton}
    </div>
  );
}
