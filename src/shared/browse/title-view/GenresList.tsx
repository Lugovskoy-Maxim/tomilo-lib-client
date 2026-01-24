"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, ChevronUp } from "lucide-react";

interface GenresListProps {
  genres?: string[];
  tags?: string[];
}

interface Item {
  type: "genre" | "tag";
  value: string;
}

export function GenresList({ genres = [], tags = [] }: GenresListProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCollapseButton, setShowCollapseButton] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Все элементы (жанры + теги)
  const allItems: Item[] = useMemo(
    () => [
      ...(genres?.map((genre) => ({ type: "genre" as const, value: genre })) || []),
      ...(tags?.map((tag) => ({ type: "tag" as const, value: tag })) || []),
    ],
    [genres, tags]
  );

  const hasItems = allItems.length > 0;

  // Проверяем, нужно ли показывать кнопку сворачивания
  useEffect(() => {
    if (!hasItems || !containerRef.current || !contentRef.current) return;

    const check = () => {
      if (isExpanded) {
        // Проверяем, есть ли переполнение при развёрнутом состоянии
        const containerWidth = containerRef.current?.offsetWidth || 0;
        const contentWidth = contentRef.current?.scrollWidth || 0;
        setShowCollapseButton(contentWidth > containerWidth);
      } else {
        setShowCollapseButton(false);
      }
    };

    // Несколько проверок для стабилизации
    const timers = [
      setTimeout(check, 50),
      setTimeout(check, 100),
      setTimeout(check, 200),
    ];

    const observer = new ResizeObserver(check);
    if (containerRef.current) observer.observe(containerRef.current);

    window.addEventListener("resize", check);
    window.addEventListener("scroll", check, true);

    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
      window.removeEventListener("resize", check);
      window.removeEventListener("scroll", check, true);
    };
  }, [isExpanded, hasItems]);

  // Если нет элементов, ничего не рендерим
  if (!hasItems) return null;

  const visibleItems = isExpanded ? allItems : allItems;

  const handleItemClick = (type: "genre" | "tag", value: string) => {
    if (type === "genre") {
      router.push(`/titles?genres=${encodeURIComponent(value)}`);
    } else {
      router.push(`/titles?tags=${encodeURIComponent(value)}`);
    }
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mt-2">
      <div className="flex flex-nowrap gap-2 items-center overflow-hidden">
        {/* Возрастное ограничение */}
        <span
          className="px-2.5 py-1 cursor-pointer text-red-500 rounded-full text-xs font-semibold bg-[var(--background)]/60 shrink-0 whitespace-nowrap"
          onClick={() => router.push(`/titles?ageLimit=18`)}
        >
          18+
        </span>

        {/* Контейнер с жанрами и тегами */}
        <div
          ref={containerRef}
          className="flex flex-nowrap gap-2 overflow-hidden max-w-full"
        >
          <div ref={contentRef} className="flex flex-nowrap gap-2">
            {visibleItems.map((item, index) => (
              <span
                key={index}
                className="px-2 py-1 cursor-pointer rounded-full text-xs font-normal bg-[var(--background)]/50 text-[var(--foreground)] shrink-0 whitespace-nowrap"
                onClick={() => handleItemClick(item.type, item.value)}
              >
                {item.value}
              </span>
            ))}
          </div>
        </div>

        {/* Кнопка для показа скрытых элементов */}
        {!isExpanded && (
          <button
            onClick={handleToggle}
            className="px-2 py-1 cursor-pointer rounded-full text-xs font-normal bg-[var(--background)]/50 text-[var(--foreground)] shrink-0 flex items-center gap-1 hover:bg-[var(--background)]/80 transition-colors whitespace-nowrap"
            aria-label="Показать ещё"
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Кнопка для сворачивания обратно */}
      {isExpanded && showCollapseButton && (
        <button
          onClick={handleToggle}
          className="mt-2 text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors flex items-center gap-1 text-sm font-medium"
        >
          <ChevronUp className="w-4 h-4" />
          Свернуть
        </button>
      )}
    </div>
  );
}

export default GenresList;

