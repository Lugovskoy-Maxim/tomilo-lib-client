import Image from "next/image";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { Chapter, Title } from "@/constants/mokeReadPage";

interface SinglePageViewProps {
  chapter: Chapter;
  currentImageIndex: number;
  imageWidth: "auto" | "fit" | "original";
  imageLoadErrors: Set<number>;
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
  title: Title;
  onPrevImage: () => void;
  onNextImage: () => void;
  onImageError: (index: number) => void;
  onImageLoad: () => void;
  onReadingModeChange: (mode: "single" | "continuous") => void;
}

export default function SinglePageView({
  chapter,
  currentImageIndex,
  imageWidth,
  imageLoadErrors,
  prevChapter,
  nextChapter,
  onPrevImage,
  onNextImage,
  onImageError,
  onImageLoad,
  onReadingModeChange,
}: SinglePageViewProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      {/* Кнопка переключения в режим прокрутки */}
      <button
        onClick={() => onReadingModeChange("continuous")}
        className="fixed top-4 right-4 p-3 rounded-full bg-[var(--background)]/80 backdrop-blur-sm border border-[var(--border)] hover:bg-[var(--accent)] transition-colors z-30"
        title="Режим прокрутки"
      >
        <List className="w-5 h-5" />
      </button>

      <div className="relative max-w-4xl mx-auto">
        <button
          onClick={onPrevImage}
          disabled={currentImageIndex === 0 && !prevChapter}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-[var(--background)]/80 backdrop-blur-sm border border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--accent)] transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex justify-center">
          {!imageLoadErrors.has(currentImageIndex) ? (
            <Image
              src={chapter.images[currentImageIndex]}
              alt={`Страница ${currentImageIndex + 1}`}
              width={800}
              height={1200}
              className={`max-h-[90vh] object-contain ${
                imageWidth === "fit" ? "w-full" : imageWidth === "original" ? "w-auto" : "max-w-full"
              }`}
              onLoad={onImageLoad}
              onError={() => onImageError(currentImageIndex)}
              priority={currentImageIndex === 0}
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-96 bg-[var(--card)] rounded-lg border border-[var(--border)]">
              <div className="text-[var(--muted-foreground)] text-lg mb-2">Ошибка загрузки изображения</div>
              <button
                onClick={() => {
                  const newSet = new Set(imageLoadErrors);
                  newSet.delete(currentImageIndex);
                  // Note: You'll need to pass setImageLoadErrors or handle this differently
                }}
                className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          )}
        </div>

        {/* Индикатор прогресса */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[var(--background)]/80 backdrop-blur-sm px-3 py-1 rounded-full border border-[var(--border)] text-sm text-[var(--foreground)]">
          {currentImageIndex + 1} / {chapter.images.length}
        </div>

        <button
          onClick={onNextImage}
          disabled={currentImageIndex === chapter.images.length - 1 && !nextChapter}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-[var(--background)]/80 backdrop-blur-sm border border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--accent)] transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}