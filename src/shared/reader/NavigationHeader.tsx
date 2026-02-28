import Link from "next/link";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { ReaderChapter as Chapter, ReaderTitle as Title } from "@/shared/reader/types";
import { getCoverUrl } from "@/lib/asset-url";

interface NavigationHeaderProps {
  title: Title;
  chapter: Chapter;
  currentImageIndex: number;
  showControls: boolean;
  onImageIndexChange: (index: number) => void;
  imagesCount: number;
  onReportError?: () => void;
  onChapterMenuOpen?: () => void;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
}

export default function NavigationHeader({
  title,
  chapter,
  // currentImageIndex,
  showControls,
  // onImageIndexChange,
  // imagesCount,
  onReportError,
  onChapterMenuOpen,
  onPrevChapter,
  onNextChapter,
  canGoPrev = false,
  canGoNext = false,
}: NavigationHeaderProps) {
  return (
    <div
      className={`fixed top-0 left-0 right-0 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)] z-50 transition-transform duration-300 ${
        showControls ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
            <Link
              href={`/titles/${title.slug || title._id}`}
              className="group flex items-center justify-center p-2 sm:p-2.5 text-[var(--foreground)] hover:text-[var(--primary)] transition-all duration-200 rounded-xl hover:bg-[var(--secondary)] min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] touch-manipulation"
              title="Назад к тайтлу"
            >
              <ChevronLeft className="w-5 h-5 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-0.5" />
            </Link>

            <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />

            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="relative w-8 h-11 sm:w-10 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-md ring-1 ring-[var(--border)]">
                <OptimizedImage
                  src={getCoverUrl(title.image)}
                  alt={title.title}
                  width={40}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm sm:text-base font-semibold text-[var(--foreground)] truncate leading-tight">
                  {title.title}
                </div>
                <div className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate mt-0.5">
                  <span className="hidden sm:inline">Глава </span>
                  <span className="sm:hidden">Гл. </span>
                  {chapter.number}
                  {chapter.title && (
                    <span className="hidden sm:inline"> — {chapter.title}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Десктопная навигация по главам */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center bg-[var(--secondary)] rounded-xl p-1 border border-[var(--border)]">
              <button
                onClick={onPrevChapter}
                disabled={!canGoPrev}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Предыдущая глава"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={onChapterMenuOpen}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--foreground)]  hover:bg-[var(--accent)]/50 rounded-lg transition-all duration-200"
                title="Выбрать главу"
              >
                <span>{chapter.number}</span>
                <span className="text-[var(--muted-foreground)]">/</span>
                <span className="text-[var(--muted-foreground)]">{title.totalChapters || "?"}</span>
              </button>
              
              <button
                onClick={onNextChapter}
                disabled={!canGoNext}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Следующая глава"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Кнопка ошибки */}
          {onReportError && (
            <button
              onClick={onReportError}
              className="group p-2.5 sm:p-3 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--destructive)] border border-[var(--border)] rounded-xl hover:bg-[var(--accent)]/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-105 active:scale-95 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] touch-manipulation flex-shrink-0"
              title="Сообщить об ошибке"
            >
              <AlertTriangle className="w-5 h-5 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
