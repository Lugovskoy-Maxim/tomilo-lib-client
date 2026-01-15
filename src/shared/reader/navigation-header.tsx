import Link from "next/link";
import OptimizedImage from "@/shared/optimized-image";
import { ChevronLeft } from "lucide-react";
import { ReaderChapter as Chapter, ReaderTitle as Title } from "@/shared/reader/types";

interface NavigationHeaderProps {
  title: Title;
  chapter: Chapter;
  currentImageIndex: number;
  showControls: boolean;
  onImageIndexChange: (index: number) => void;
  imagesCount: number;
}

export default function NavigationHeader({
  title,
  chapter,
  // currentImageIndex,
  showControls,
  // onImageIndexChange,
  // imagesCount,
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
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Назад к тайтлу</span>
            </Link>

            <div className="h-6 w-px bg-[var(--border)]" />

            <div className="flex items-center gap-2">
              <div className="relative w-8 h-12 rounded overflow-hidden">
                <OptimizedImage
                  src={process.env.NEXT_PUBLIC_URL  + title.image}
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

          {/* <div className="flex items-center gap-4">
            <div className="text-sm text-[var(--muted-foreground)]">
              {currentImageIndex + 1} / {imagesCount}
            </div>

            <select
              value={currentImageIndex}
              onChange={(e) => onImageIndexChange(parseInt(e.target.value))}
              className="bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1 text-sm text-[var(--foreground)]"
            >
              {Array.from({ length: imagesCount }, (_, index) => (
                <option key={index} value={index}>
                  Страница {index + 1}
                </option>
              ))}
            </select>
          </div> */}
        </div>
      </div>
    </div>
  );
}
