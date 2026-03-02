"use client";

import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { useEffect, useRef, useState, useMemo } from "react";
import { ReaderChapter as Chapter } from "@/shared/reader/types";

interface ContinuousScrollViewProps {
  chapters: Chapter[];
  currentChapterIndex: number;
  imageWidth: "auto" | "fit" | "original";
  imageLoadErrors: Set<number>;
  onImageError: (globalIndex: number) => void;
  onImageLoad: () => void;
  onLoadPrev: () => void;
  onLoadNext: () => void;
  onChapterChange: (chapterId: string, globalImageIndex: number) => void;
  onProgressUpdate: (chapterId: string, globalImageIndex: number) => void;
  initialScrollTo?: { chapterId: string; imageIndex: number };
  loadingPrev?: boolean;
  loadingNext?: boolean;
}

// Количество приоритетных изображений в текущей главе
const PRIORITY_IMAGES_COUNT = 5;
// Количество изображений для предзагрузки из следующей главы
const PRELOAD_NEXT_CHAPTER_IMAGES = 3;

export default function ContinuousScrollView({
  chapters,
  currentChapterIndex,
  imageWidth,
  imageLoadErrors,
  onImageError,
  onImageLoad,
  onLoadPrev,
  onLoadNext,
  onChapterChange,
  onProgressUpdate,
  initialScrollTo,
}: ContinuousScrollViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleChapterId, setVisibleChapterId] = useState<string>(
    chapters[currentChapterIndex]?._id || "",
  );
  const observerRef = useRef<IntersectionObserver | null>(null);
  const imageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Calculate cumulative images up to each chapter
  const cumulativeImages = useMemo(() => {
    const result: number[] = [];
    let total = 0;
    chapters.forEach(ch => {
      result.push(total);
      total += ch.images.length;
    });
    return result;
  }, [chapters]);

  // Определяем текущую видимую главу для приоритизации загрузки
  const currentVisibleChapterIdx = useMemo(() => {
    return chapters.findIndex(ch => ch._id === visibleChapterId);
  }, [chapters, visibleChapterId]);

  // Функция для определения приоритета загрузки изображения
  const getImagePriority = (chapterIdx: number, imageIdx: number): boolean => {
    // Если это текущая глава — первые N изображений с высоким приоритетом
    if (chapterIdx === currentVisibleChapterIdx) {
      return imageIdx < PRIORITY_IMAGES_COUNT;
    }
    // Следующая глава — только первые несколько изображений для предзагрузки
    if (chapterIdx === currentVisibleChapterIdx + 1) {
      return imageIdx < PRELOAD_NEXT_CHAPTER_IMAGES;
    }
    // Все остальные главы — без приоритета, lazy load
    return false;
  };

  // Функция для определения низкого приоритета (главы далеко от текущей)
  const isLowPriority = (chapterIdx: number): boolean => {
    // Изображения из глав, которые дальше чем +1 от текущей, грузятся с низким приоритетом
    return chapterIdx > currentVisibleChapterIdx + 1 || chapterIdx < currentVisibleChapterIdx;
  };

  // Scroll to initial position
  useEffect(() => {
    if (initialScrollTo && containerRef.current) {
      const chapterIndex = chapters.findIndex(ch => ch._id === initialScrollTo.chapterId);
      if (chapterIndex !== -1) {
        const chapter = chapters[chapterIndex];
        const imageKey = `${chapter._id}-${initialScrollTo.imageIndex}`;
        const imageElement = imageRefs.current.get(imageKey);
        if (imageElement) {
          imageElement.scrollIntoView({ behavior: "instant", block: "start" });
        }
      }
    }
  }, [initialScrollTo, chapters]);

  // Set up IntersectionObserver for accurate progress tracking
  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      entries => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length === 0) return;

        // Find the most visible image (highest intersection ratio)
        const mostVisible = visibleEntries.reduce((prev, current) =>
          prev.intersectionRatio > current.intersectionRatio ? prev : current,
        );

        const imageKey = mostVisible.target.getAttribute("data-image-key");
        if (!imageKey) return;

        const [chapterId, imageIndexStr] = imageKey.split("-");
        const imageIndex = parseInt(imageIndexStr, 10);

        if (visibleChapterId !== chapterId) {
          setVisibleChapterId(chapterId);
          onChapterChange(chapterId, imageIndex);
        }

        onProgressUpdate(chapterId, imageIndex);
      },
      {
        root: null, // Use viewport
        rootMargin: "0px",
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      },
    );

    // Observe all images
    imageRefs.current.forEach(element => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [chapters, visibleChapterId, onChapterChange, onProgressUpdate]);

  // Handle scroll to detect near top/bottom for loading chapters
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Near top: load previous chapter
      if (scrollTop < 100) {
        onLoadPrev();
      }

      // Near bottom: load next chapter
      if (documentHeight - scrollTop - windowHeight < 300) {
        onLoadNext();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onLoadPrev, onLoadNext]);

  return (
    <div ref={containerRef} className="pb-2">
      <div className="max-w-4xl mx-auto">
        {chapters.map((chapter, chapterIdx) =>
          chapter.images.map((image, imageIdx) => {
            const globalIndex = cumulativeImages[chapterIdx] + imageIdx;
            return (
              <div key={`${chapter._id}-${imageIdx}`} className="flex justify-center">
                {!imageLoadErrors.has(globalIndex) ? (
                  <OptimizedImage
                    src={`${image}`}
                    alt={`Глава ${chapter.number}, Страница ${imageIdx + 1}`}
                    width={1000}
                    className={`max-w-full h-auto ${
                      imageWidth === "fit"
                        ? "w-full"
                        : imageWidth === "original"
                          ? "w-auto"
                          : "max-w-full"
                    }`}
                    style={{
                      width:
                        imageWidth === "fit" ? "100%" : imageWidth === "original" ? "auto" : "100%",
                      height: "auto",
                    }}
                    onLoad={() => {
                      if (globalIndex === 0) onImageLoad?.();
                    }}
                    onError={() => onImageError(globalIndex)}
                    priority={getImagePriority(chapterIdx, imageIdx)}
                    lowPriority={isLowPriority(chapterIdx)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-64 bg-[var(--card)] rounded-lg border border-[var(--border)]">
                    <div className="text-[var(--muted-foreground)] mb-2">
                      Ошибка загрузки страницы {imageIdx + 1} главы {chapter.number}
                    </div>
                    <button
                      onClick={() => {
                        // Reload logic, but since imageLoadErrors is global, need to handle in parent
                      }}
                      className="px-3 py-1 bg-[var(--primary)] text-[var(--primary-foreground)] rounded hover:bg-[var(--primary)]/90 transition-colors text-sm"
                    >
                      Перезагрузить
                    </button>
                  </div>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
