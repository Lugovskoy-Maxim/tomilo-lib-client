import { useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, List, Maximize, Minimize, RotateCcw, Menu } from "lucide-react";
import { Chapter, Title } from "@/constants/mokeReadPage";
import { useState, useEffect } from "react";

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
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const currentChapterIndex = chapters.findIndex((ch) => ch.id === chapter.id);
  const prevChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;
  const nextChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;

  // Мобильная версия
  if (isMobile) {
    return (
      <>
        {/* Основная панель управления */}
        <div
          className={`fixed bottom-4 left-4 right-4 bg-[var(--background)]/95 backdrop-blur-md rounded-xl border border-[var(--border)] p-3 shadow-lg z-50 transition-opacity duration-300 ${
            showControls && !isNearBottom ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Верхняя строка - навигация по главам */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => prevChapter && router.push(`/browse/${title.id}/chapter/${prevChapter.number}`)}
              disabled={!prevChapter}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--accent)] transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              {/* <span>Назад</span> */}
            </button>

            <div className="flex flex-col items-center gap-2 flex-1 justify-center px-2 w-max">
              <span className="text-sm text-[var(--foreground)] whitespace-nowrap">
                Глава {chapter.number}
              </span>
              {chapter.title && (
                <span className="text-sm text-[var(--muted-foreground)] truncate max-w-[200px]">
                  {chapter.title}
                </span>
              )}
            </div>

            <button
              onClick={() => nextChapter && router.push(`/browse/${title.id}/chapter/${nextChapter.number}`)}
              disabled={!nextChapter}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--accent)] transition-colors text-sm"
            >
              {/* <span>Вперед</span> */}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Нижняя строка - основные действия */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Кнопка меню с дополнительными опциями */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Режим чтения */}
              <button
                onClick={() => onReadingModeChange(readingMode === "single" ? "continuous" : "single")}
                className={`p-2 rounded-lg border transition-colors ${
                  readingMode === "single"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                    : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--accent)]"
                }`}
              >
                {readingMode === "single" ? <BookOpen className="w-5 h-5" /> : <List className="w-5 h-5" />}
              </button>
            </div>

            <div className="md:hidden flex items-center gap-1">
              {/* Сброс */}
              <button
                onClick={onResetImageIndex}
                className="p-2  rounded-lg bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
                title="Сбросить"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Полноэкранный режим */}
              <button
                onClick={onToggleFullscreen}
                className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Выпадающее меню с дополнительными опциями */}
        <div
          className={`fixed bottom-24 left-4 right-4 bg-[var(--background)]/95 backdrop-blur-md rounded-xl border border-[var(--border)] p-4 shadow-lg z-50 transition-all duration-300 ${
            showMobileMenu ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <div className="space-y-3">
            {/* Выбор главы */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                Выбор главы
              </label>
              <select
                value={chapter.number}
                onChange={(e) => {
                  router.push(`/browse/${title.id}/chapter/${e.target.value}`);
                  setShowMobileMenu(false);
                }}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)]"
              >
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.number}>
                    Глава {ch.number} {ch.title && `- ${ch.title}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Настройки ширины */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                Ширина изображения
              </label>
              <select
                value={imageWidth}
                onChange={(e) => {
                  onImageWidthChange(e.target.value as "auto" | "fit" | "original");
                  setShowMobileMenu(false);
                }}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)]"
              >
                <option value="auto">Автоматически</option>
                <option value="fit">По ширине экрана</option>
                <option value="original">Оригинальный размер</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overlay для закрытия меню */}
        {showMobileMenu && (
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setShowMobileMenu(false)}
          />
        )}
      </>
    );
  }

  // Десктопная версия (оригинальная с небольшими улучшениями)
  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[var(--background)]/90 backdrop-blur-md rounded-xl border border-[var(--border)] p-4 shadow-lg z-50 transition-opacity duration-300 ${
        showControls && !isNearBottom ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-4 flex-wrap justify-center">
        {/* Навигация по главам */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => prevChapter && router.push(`/browse/${title.id}/chapter/${prevChapter.number}`)}
            disabled={!prevChapter}
            className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--accent)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <select
            value={chapter.number}
            onChange={(e) => router.push(`/browse/${title.id}/chapter/${e.target.value}`)}
            className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] min-w-[120px]"
          >
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.number}>
                Глава {ch.number} {ch.title && `- ${ch.title}`}
              </option>
            ))}
          </select>

          <button
            onClick={() => nextChapter && router.push(`/browse/${title.id}/chapter/${nextChapter.number}`)}
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