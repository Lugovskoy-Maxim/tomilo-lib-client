"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X, Grid3X3, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { getImageUrls } from "@/lib/asset-url";

interface PageThumbnailsProps {
  images: string[];
  currentPage: number;
  onPageSelect: (page: number) => void;
  chapterNumber: number;
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function PageThumbnails({
  images,
  currentPage,
  onPageSelect,
  chapterNumber,
  isOpen,
  onClose,
}: PageThumbnailsProps) {
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef<HTMLButtonElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const progressPercent = useMemo(() => {
    const total = Math.max(images.length, 1);
    return Math.round((currentPage / total) * 100);
  }, [currentPage, images.length]);

  useEffect(() => {
    if (!isOpen) {
      setDisplayedCount(ITEMS_PER_PAGE);
      setLoadedImages(new Set());
      return;
    }

    const initialPage = Math.max(0, currentPage - Math.floor(ITEMS_PER_PAGE / 2));
    setDisplayedCount(Math.min(images.length, initialPage + ITEMS_PER_PAGE));

    setTimeout(() => {
      if (currentPageRef.current) {
        currentPageRef.current.scrollIntoView({ behavior: "auto", block: "center" });
      }
    }, 50);
  }, [isOpen, currentPage, images.length]);

  useEffect(() => {
    if (!isOpen || !loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedCount < images.length) {
          setDisplayedCount(prev => Math.min(images.length, prev + ITEMS_PER_PAGE));
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [isOpen, displayedCount, images.length]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handlePageClick = useCallback((page: number) => {
    onPageSelect(page);
    onClose();
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, [onPageSelect, onClose]);

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  }, []);

  const getThumbUrl = useCallback((src: string) => {
    const { primary } = getImageUrls(src);
    const separator = primary.includes("?") ? "&" : "?";
    return `${primary}${separator}w=150&q=50`;
  }, []);

  if (!isOpen) return null;

  const displayedImages = images.slice(0, displayedCount);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Grid3X3 className="w-5 h-5 text-[var(--primary)]" />
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-[var(--foreground)]">
                Глава {chapterNumber}
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                {images.length} стр. • {progressPercent}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg font-bold">
              {currentPage}/{images.length}
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Прогресс */}
        <div className="h-1 bg-[var(--muted)]">
          <div 
            className="h-full bg-[var(--primary)] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Сетка */}
        <div 
          ref={gridRef}
          className="flex-1 overflow-y-auto p-2 sm:p-3"
        >
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {displayedImages.map((src, index) => {
              const pageNumber = index + 1;
              const isCurrent = pageNumber === currentPage;
              const isLoaded = loadedImages.has(index);

              return (
                <button
                  key={index}
                  ref={isCurrent ? currentPageRef : null}
                  onClick={() => handlePageClick(pageNumber)}
                  className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                    isCurrent
                      ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/40 shadow-lg"
                      : "border-[var(--border)]/30 hover:border-[var(--primary)]/50"
                  }`}
                >
                  {/* Placeholder */}
                  <div className={`absolute inset-0 bg-[var(--muted)] flex items-center justify-center transition-opacity ${
                    isLoaded ? "opacity-0" : "opacity-100"
                  }`}>
                    <span className="text-xs text-[var(--muted-foreground)]">{pageNumber}</span>
                  </div>
                  
                  {/* Изображение */}
                  <img
                    src={getThumbUrl(src)}
                    alt={`${pageNumber}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
                      isLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    loading="lazy"
                    onLoad={() => handleImageLoad(index)}
                  />
                  
                  {/* Номер страницы */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                    <span className={`text-xs font-bold ${isCurrent ? "text-[var(--primary)]" : "text-white"}`}>
                      {pageNumber}
                    </span>
                  </div>

                  {/* Текущая страница */}
                  {isCurrent && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-[var(--primary)] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Подгрузка ещё */}
          {displayedCount < images.length && (
            <div ref={loadMoreRef} className="py-4 text-center">
              <span className="text-xs text-[var(--muted-foreground)]">
                Загружено {displayedCount} из {images.length}...
              </span>
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-t border-[var(--border)] bg-[var(--background)]/50 gap-2">
          <button
            onClick={() => handlePageClick(1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-2 sm:px-3 py-2 text-xs font-medium bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-40 rounded-lg transition-all"
          >
            <ChevronsLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Начало</span>
          </button>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageClick(Math.max(1, currentPage - 10))}
              disabled={currentPage <= 1}
              className="px-2 py-2 text-xs hover:bg-[var(--muted)] disabled:opacity-40 rounded-lg transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm font-medium px-2 min-w-[60px] text-center">
              {currentPage}/{images.length}
            </span>
            
            <button
              onClick={() => handlePageClick(Math.min(images.length, currentPage + 10))}
              disabled={currentPage >= images.length}
              className="px-2 py-2 text-xs hover:bg-[var(--muted)] disabled:opacity-40 rounded-lg transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => handlePageClick(images.length)}
            disabled={currentPage === images.length}
            className="flex items-center gap-1 px-2 sm:px-3 py-2 text-xs font-medium bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-40 rounded-lg transition-all"
          >
            <span className="hidden sm:inline">Конец</span>
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
