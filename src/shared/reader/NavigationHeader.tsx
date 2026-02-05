import Link from "next/link";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { ReaderChapter as Chapter, ReaderTitle as Title } from "@/shared/reader/types";

interface NavigationHeaderProps {
  title: Title;
  chapter: Chapter;
  currentImageIndex: number;
  showControls: boolean;
  onImageIndexChange: (index: number) => void;
  imagesCount: number;
  onReportError?: () => void;
}

export default function NavigationHeader({
  title,
  chapter,
  // currentImageIndex,
  showControls,
  // onImageIndexChange,
  // imagesCount,
  onReportError,
}: NavigationHeaderProps) {
  return (
    <div
      className={`fixed top-0 left-0 right-0 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)] z-50 transition-transform duration-300 ${
        showControls ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/titles/${title.slug || title._id}`}
              className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>

            <div className="h-6 w-px bg-[var(--border)]" />

            <div className="flex items-center gap-2">
              <div className="relative w-8 h-12 rounded overflow-hidden">
                <OptimizedImage
                  src={process.env.NEXT_PUBLIC_URL + title.image}
                  alt={title.title}
                  width={32}
                  className="object-cover"
                />
              </div>
              <div className="max-w-xs">
                <div className="text-sm font-medium text-[var(--foreground)] truncate">
                  {title.title}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Глава {chapter.number} {chapter.title && `- ${chapter.title}`}
                </div>
              </div>
            </div>
          </div>

          {/* Кнопка ошибки */}
          {onReportError && (
            <button
              onClick={onReportError}
              className="p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95"
              title="Сообщить об ошибке"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
