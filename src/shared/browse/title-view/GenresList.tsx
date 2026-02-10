"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, ChevronUp, Tag, FolderOpen, LucideMonitorStop } from "lucide-react";

interface GenresListProps {
  genres?: string[];
  tags?: string[];
  isAdult?: boolean;
  ageLimit?: number;
}

interface Item {
  type: "genre" | "tag";
  value: string;
}

export function GenresList({ genres = [], tags = [], isAdult, ageLimit }: GenresListProps) {
  const showAdultBadge = isAdult || (ageLimit && ageLimit >= 18);
  const showAgeRating = ageLimit && ageLimit > 0;
  const ageRatingLabel =
    ageLimit === 18 ? "18+" : ageLimit === 16 ? "16+" : ageLimit === 12 ? "12+" : `${ageLimit}+`;

  // Цвета для возрастных рейтингов
  const ageRatingColor =
    ageLimit === 18
      ? "text-red-500"
      : ageLimit === 16
        ? "text-orange-500"
        : ageLimit === 12
          ? "text-yellow-500"
          : "text-green-500";

  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMoreButton, setShowMoreButton] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const containerRef = useRef<HTMLDivElement>(null);

  // Разделяем жанры и теги для лучшей организации
  const genreItems = useMemo(
    () => genres?.map(genre => ({ type: "genre" as const, value: genre })) || [],
    [genres],
  );

  const tagItems = useMemo(
    () => tags?.map(tag => ({ type: "tag" as const, value: tag })) || [],
    [tags],
  );

  // Все элементы
  const allItems = useMemo(() => [...genreItems, ...tagItems], [genreItems, tagItems]);

  // Отображаемые элементы с учетом лимита
  const visibleItems = useMemo(() => {
    if (isExpanded) return allItems;
    return allItems.slice(0, visibleCount);
  }, [allItems, isExpanded, visibleCount]);

  const hasMoreItems = allItems.length > visibleCount;
  const hasItems = allItems.length > 0;

  // Проверяем, нужно ли показывать кнопку "Ещё"
  useEffect(() => {
    if (!hasItems || !containerRef.current) return;

    const checkOverflow = () => {
      const container = containerRef.current;
      if (!container) return;

      // Проверяем, есть ли скрытые элементы
      const hasHiddenItems = allItems.length > visibleCount;
      setShowMoreButton(hasHiddenItems && !isExpanded);
    };

    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(containerRef.current);

    window.addEventListener("resize", checkOverflow);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, [allItems.length, visibleCount, isExpanded, hasItems]);

  // Если нет элементов, ничего не рендерим
  if (!hasItems && !showAgeRating) return null;

  const handleItemClick = (type: "genre" | "tag", value: string) => {
    if (type === "genre") {
      router.push(`/titles?genres=${encodeURIComponent(value)}`);
    } else {
      router.push(`/titles?tags=${encodeURIComponent(value)}`);
    }
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setVisibleCount(allItems.length);
    } else {
      setVisibleCount(10);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {/* Возрастное ограничение - в конце */}
      <div className="flex  items-center space-y-2">
        <div className="flex py-1.5 items-center gap-2 text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-medium">
          <LucideMonitorStop className="w-3.5 h-3.5" />
          <span>Возрастное ограничение </span>
          {showAgeRating && (
            <div className="">
              <span
                className={`genre-badge age-rating-badge inline-flex items-center gap-1.5 cursor-pointer rounded-xl text-xs font-bold px-3 py-1.5 transition-all duration-300 hover:scale-110 ${ageRatingLabel==="18+" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-800"} `}
                onClick={() => router.push(`/titles?ageLimit=${ageLimit}`)}
              >
                {ageRatingLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Жанры - отдельная секция */}
      {genreItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-medium">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Жанры</span>
          </div>
          <div ref={containerRef} className="flex flex-wrap gap-2">
            {genreItems.map((item, index) => {
              const isVisible = isExpanded || index < visibleCount;

              if (!isVisible) return null;

              return (
                <span
                  key={`genre-${index}`}
                  className="genre-badge cursor-pointer rounded-xl text-sm font-medium px-3 py-1 transition-all duration-300 hover:scale-105 hover:shadow-md border border-[var(--border)] bg-[var(--card)]/50 text-[var(--foreground)]"
                  onClick={() => handleItemClick(item.type, item.value)}
                >
                  {item.value}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Теги - отдельная секция */}
      {tagItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-medium">
            <Tag className="w-3.5 h-3.5" />
            <span>Теги</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tagItems.map((item, index) => {
              const isVisible = isExpanded || index + genreItems.length < visibleCount;

              if (!isVisible) return null;

              return (
                <span
                  key={`tag-${index}`}
                  className="genre-badge cursor-pointer rounded-xl text-sm px-3 py-1.5 transition-all duration-300 hover:scale-105 hover:shadow-md"
                  onClick={() => handleItemClick(item.type, item.value)}
                >
                  {item.value}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Кнопка показать/скрыть */}
      {hasMoreItems && (
        <button
          onClick={handleToggle}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--primary)] hover:text-[var(--chart-1)] transition-colors duration-300 mt-2 group"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
              <span>Свернуть</span>
            </>
          ) : (
            <>
              <MoreHorizontal className="w-4 h-4" />
              <span>Показать ещё ({allItems.length - visibleCount})</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default GenresList;
