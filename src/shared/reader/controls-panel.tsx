

'use client';
import { useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, List, Maximize, Minimize, RotateCcw } from "lucide-react";
import { ReaderChapter as Chapter, ReaderTitle as Title } from "@/shared/reader/types";

interface ControlsPanelProps {
  title: Title;
  chapter: Chapter;
  chapters: Chapter[];
  readingMode: "single" | "continuous";
  imageWidth: "auto" | "fit" | "original";
  isFullscreen: boolean;
  showControls: boolean;
  isNearBottom: boolean;
  onReadingModeChange: (mode: "single" | "continuous") => void;
  onImageWidthChange: (width: "auto" | "fit" | "original") => void;
  onToggleFullscreen: () => void;
  onResetImageIndex: () => void;
}

export default function ControlsPanel({
  title,
  chapter,
  chapters,
  readingMode,
  imageWidth,
  isFullscreen,
  showControls,
  isNearBottom,
  onReadingModeChange,
  onImageWidthChange,
  onToggleFullscreen,
  onResetImageIndex,
}: ControlsPanelProps) {
  const router = useRouter();

  const currentChapterIndex = chapters.findIndex((ch) => ch._id === chapter._id);
  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[var(--background)]/90 backdrop-blur-md rounded-xl border border-[var(--border)] p-4 shadow-lg z-50 transition-opacity duration-300 ${
        showControls && !isNearBottom ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Навигация по главам */}
        <div className="flex items-center gap-2">

          <button
            onClick={() => prevChapter && router.push(`/titles/${title.slug}/chapter/${prevChapter._id || prevChapter.number}`)}
            disabled={!prevChapter}
            className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--accent)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>


          <select
            value={chapter._id || chapter.number}
            onChange={(e) => router.push(`/titles/${title.slug}/chapter/${e.target.value}`)}
            className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] min-w-[120px]"
          >
            {chapters.map((ch) => (
              <option key={ch._id } value={ch._id || ch.number}>
                Глава {ch.number} {ch.title && `- ${ch.title}`}
              </option>
            ))}
          </select>


          <button
            onClick={() => nextChapter && router.push(`/titles/${title.slug}chapter/${nextChapter._id || nextChapter.number}`)}
            disabled={!nextChapter}
            className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--accent)] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="h-8 w-px bg-[var(--border)]" />

        {/* Режим чтения */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onReadingModeChange("single")}
            className={`p-2 rounded-lg border transition-colors ${
              readingMode === "single"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--accent)]"
            }`}
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button
            onClick={() => onReadingModeChange("continuous")}
            className={`p-2 rounded-lg border transition-colors ${
              readingMode === "continuous"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--accent)]"
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        <div className="h-8 w-px bg-[var(--border)]" />

        {/* Настройки отображения */}
        <div className="flex items-center gap-2">
          <select
            value={imageWidth}
            onChange={(e) => onImageWidthChange(e.target.value as "auto" | "fit" | "original")}
            className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm text-[var(--foreground)]"
          >
            <option value="auto">Авто</option>
            <option value="fit">По ширине</option>
            <option value="original">Оригинал</option>
          </select>

          <button
            onClick={onResetImageIndex}
            className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
