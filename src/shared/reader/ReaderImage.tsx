"use client";

import { memo, useCallback, useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";

interface ReaderImageProps {
  src: string;
  chapterId: string;
  chapterNumber: number;
  imageIndex: number;
  imageWidth: number;
  isMobile: boolean;
  imageFitClass: string;
  imageFilterStyle: React.CSSProperties;
  pageGap: number;
  showHints: boolean;
  isPagedMode?: boolean;
  onLoad: (chapterId: string, imageIndex: number) => void;
  onError: (chapterId: string, imageIndex: number, src: string) => void;
  onDoubleTap: (src: string, alt: string) => void;
  imageLoader: (params: { src: string; width: number }) => string;
  priority?: boolean;
  loading?: "eager" | "lazy";
  quality?: number;
}

function ReaderImageComponent({
  src,
  chapterId,
  chapterNumber,
  imageIndex,
  imageWidth,
  isMobile,
  imageFitClass,
  imageFilterStyle,
  pageGap,
  showHints,
  isPagedMode = false,
  onLoad,
  onError,
  onDoubleTap,
  imageLoader,
  priority = false,
  loading = "lazy",
  quality = 85,
}: ReaderImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad(chapterId, imageIndex);
  }, [chapterId, imageIndex, onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError(chapterId, imageIndex, src);
  }, [chapterId, imageIndex, src, onError]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoaded(false);
    setRetryCount(c => c + 1);
  }, []);

  const handleClick = useCallback(() => {
    const alt = `Глава ${chapterNumber}, Страница ${imageIndex + 1}`;
    onDoubleTap(src, alt);
  }, [src, chapterNumber, imageIndex, onDoubleTap]);

  const alt = `Глава ${chapterNumber}, Страница ${imageIndex + 1}`;

  if (hasError) {
    return (
      <div
        className="flex justify-center reader-image-container"
        style={{ marginBottom: isPagedMode ? 0 : `${pageGap}px` }}
      >
        <div
          className="relative w-full flex justify-center px-0 sm:px-4"
          data-page={imageIndex + 1}
          style={{
            maxWidth: isMobile ? "100%" : `${imageWidth}px`,
          }}
        >
          <div className="w-full min-h-[200px] sm:min-h-[280px] bg-gradient-to-b from-[var(--card)] to-[var(--secondary)]/50 flex items-center justify-center px-4 rounded-lg border border-[var(--border)]/50">
            <div className="text-center max-w-xs">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[var(--destructive)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mb-3">
                Страница {imageIndex + 1} не загрузилась
              </p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 rounded-lg transition-colors text-sm font-medium min-h-[44px] touch-manipulation active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Повторить
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex justify-center reader-image-container"
      style={{ marginBottom: isPagedMode ? 0 : `${pageGap}px` }}
    >
      <div
        className="relative w-full flex justify-center px-0 sm:px-4"
        data-page={imageIndex + 1}
        style={{
          maxWidth: isMobile ? "100%" : `${imageWidth}px`,
          transition: "filter 200ms ease-out",
          ...imageFilterStyle,
        }}
        onClick={handleClick}
      >
        {!isLoaded && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--card)] rounded-lg overflow-hidden z-10"
            style={{ minHeight: isMobile ? "400px" : "600px" }}
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-[var(--muted)] via-[var(--card)] to-[var(--muted)] animate-shimmer"
              style={{ backgroundSize: "200% 100%" }}
            />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              </div>
              <span className="text-sm text-[var(--muted-foreground)]">
                Страница {imageIndex + 1}
              </span>
            </div>
          </div>
        )}

        <Image
          key={`${chapterId}-${imageIndex}-retry-${retryCount}`}
          loader={imageLoader}
          src={src}
          alt={alt}
          width={isMobile ? 800 : imageWidth}
          height={isMobile ? 1200 : Math.round((imageWidth * 1600) / 1200)}
          className={`${imageFitClass} shadow-lg sm:shadow-2xl ${isLoaded ? "opacity-100" : "opacity-0 transition-opacity duration-300"}`}
          quality={quality}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          priority={priority}
        />

        {showHints && imageIndex === 0 && isLoaded && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white/80 opacity-0 animate-fade-in-delayed pointer-events-none">
            <ZoomIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Двойной клик для зума</span>
            <span className="sm:hidden">2x тап для зума</span>
          </div>
        )}
      </div>
    </div>
  );
}

export const ReaderImage = memo(ReaderImageComponent, (prevProps, nextProps) => {
  return (
    prevProps.src === nextProps.src &&
    prevProps.chapterId === nextProps.chapterId &&
    prevProps.imageIndex === nextProps.imageIndex &&
    prevProps.imageWidth === nextProps.imageWidth &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.imageFitClass === nextProps.imageFitClass &&
    prevProps.pageGap === nextProps.pageGap &&
    prevProps.showHints === nextProps.showHints &&
    prevProps.isPagedMode === nextProps.isPagedMode &&
    prevProps.priority === nextProps.priority &&
    prevProps.loading === nextProps.loading &&
    prevProps.quality === nextProps.quality &&
    JSON.stringify(prevProps.imageFilterStyle) === JSON.stringify(nextProps.imageFilterStyle)
  );
});

ReaderImage.displayName = "ReaderImage";
