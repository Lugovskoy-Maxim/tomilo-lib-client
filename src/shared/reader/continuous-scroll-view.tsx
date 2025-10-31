import Image from "next/image";
import { ReaderChapter as Chapter } from "@/shared/reader/types";

interface ContinuousScrollViewProps {
  chapter: Chapter;
  imageWidth: "auto" | "fit" | "original";
  imageLoadErrors: Set<number>;
  onImageError: (index: number) => void;
  onImageLoad: () => void;
}

export default function ContinuousScrollView({
  chapter,
  imageWidth,
  imageLoadErrors,
  onImageError,
  onImageLoad,
}: ContinuousScrollViewProps) {

  return (
    <div className="pb-2">
      <div className="max-w-4xl mx-auto">
        {chapter.images.map((image, index) => (
          <div key={index} className="flex justify-center">
            {!imageLoadErrors.has(index) ? (
              <Image
                loader={() => `${image}`}
                src={`${image}`}
                alt={`Страница ${index + 1}`}
                unoptimized
                width={1000}
                height={4000}
                className={`max-w-full h-auto ${
                  imageWidth === "fit"
                    ? "w-full"
                    : imageWidth === "original"
                    ? "w-auto"
                    : "max-w-full"
                }`}
                style={{
                  width:
                    imageWidth === "fit"
                      ? "100%"
                      : imageWidth === "original"
                      ? "auto"
                      : "100%",
                  height: "auto",
                }}
                onLoad={index === 0 ? onImageLoad : undefined}
                onError={() => onImageError(index)}
                priority={index < 3}
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-64 bg-[var(--card)] rounded-lg border border-[var(--border)]">
                <div className="text-[var(--muted-foreground)] mb-2">
                  Ошибка загрузки страницы {index + 1}
                </div>
                <button
                  onClick={() => {
                    const newSet = new Set(imageLoadErrors);
                    newSet.delete(index);
                    // Note: You'll need to pass setImageLoadErrors or handle this differently
                  }}
                  className="px-3 py-1 bg-[var(--primary)] text-[var(--primary-foreground)] rounded hover:bg-[var(--primary)]/90 transition-colors text-sm"
                >
                  Перезагрузить
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
