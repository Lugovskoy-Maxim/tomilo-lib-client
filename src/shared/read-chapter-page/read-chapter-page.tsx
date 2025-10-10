"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Header } from "@/widgets";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  List,
  Maximize,
  Minimize,
  RotateCcw,
  Home,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Chapter, Title } from "@/constants/mokeReadPage";

interface ReadChapterPageProps {
  title: Title;
  chapter: Chapter;
  chapters: Chapter[];
}

export default function ReadChapterPage({
  title,
  chapter,
  chapters,
}: ReadChapterPageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());
  const [readingMode, setReadingMode] = useState<"single" | "continuous">("continuous");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [imageWidth, setImageWidth] = useState<"auto" | "fit" | "original">("auto");
  const [isNearBottom, setIsNearBottom] = useState(false);

  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Навигация по главам
  const currentChapterIndex = chapters.findIndex((ch) => ch.id === chapter.id);
  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;

  // Сохранение прогресса
  const saveProgress = useCallback(
    (chapterId: number, imageIndex: number) => {
      if (typeof window !== "undefined") {
        const progress = {
          chapterId,
          imageIndex,
          timestamp: Date.now(),
          totalImages: chapter.images.length,
        };
        localStorage.setItem(`progress_${title.id}`, JSON.stringify(progress));
      }
    },
    [title.id, chapter.images.length]
  );

  // Навигация по изображениям
  const goToNextImage = useCallback(() => {
    if (currentImageIndex < chapter.images.length - 1) {
      setCurrentImageIndex((prev) => {
        const newIndex = prev + 1;
        saveProgress(chapter.id, newIndex);
        return newIndex;
      });
    } else if (nextChapter) {
      router.push(`/browse/${title.id}/chapter/${nextChapter.number}`);
    }
  }, [currentImageIndex, chapter.images.length, chapter.id, nextChapter, title.id, router, saveProgress]);

  const goToPrevImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => {
        const newIndex = prev - 1;
        saveProgress(chapter.id, newIndex);
        return newIndex;
      });
    } else if (prevChapter) {
      router.push(`/browse/${title.id}/chapter/${prevChapter.number}`);
    }
  }, [currentImageIndex, chapter.id, prevChapter, title.id, router, saveProgress]);

  // Обработчики клавиатуры
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          goToNextImage();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goToPrevImage();
          break;
        case "f":
        case "F":
          e.preventDefault();
          setIsFullscreen((prev) => !prev);
          break;
        case "Escape":
          setIsFullscreen(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [goToNextImage, goToPrevImage]);

  // Полноэкранный режим
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Упрощенное управление контролами - убрана сложная логика блокировки
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Показываем контролы только если мышь в нижней части экрана
    const isMouseNearBottom = e.clientY > window.innerHeight - 150;
    if (isMouseNearBottom && !isNearBottom) {
      showControlsTemporarily();
    }
  }, [showControlsTemporarily, isNearBottom]);

  const handleClick = useCallback(() => {
    // Просто показываем контролы при клике
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Определение близости к нижней части страницы
  useEffect(() => {
    const checkScrollPosition = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      // Считаем, что мы внизу, если до конца страницы меньше 300px
      const atBottom = scrollHeight - scrollTop - clientHeight < 300;
      setIsNearBottom(atBottom);
    };

    window.addEventListener('scroll', checkScrollPosition);
    checkScrollPosition();

    return () => window.removeEventListener('scroll', checkScrollPosition);
  }, []);

  // Автоматически скрываем контролы при приближении к нижней части
  useEffect(() => {
    if (isNearBottom) {
      setShowControls(false);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [isNearBottom]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Обработка ошибок загрузки изображений
  const handleImageError = (index: number) => {
    console.error(`Error loading image ${index}:`, chapter.images[index]);
    setImageLoadErrors((prev) => new Set(prev).add(index));
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Если данные не загружены
  if (!chapter || !chapter.images) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <div className="text-[var(--foreground)]">Загрузка данных...</div>
        </div>
      </div>
    );
  }

  // Верхняя панель навигации
  const NavigationHeader = () => (
    <div
      className={`fixed top-0 left-0 right-0 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)] z-50 transition-transform duration-300 ${
        showControls ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/browse/${title.id}`}
              className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Назад к тайтлу</span>
            </Link>

            <div className="h-6 w-px bg-[var(--border)]" />

            <div className="flex items-center gap-2">
              <div className="relative w-8 h-12 rounded overflow-hidden">
                <Image
                  src={title.image}
                  alt={title.title}
                  fill
                  className="object-cover"
                  sizes="32px"
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

          <div className="flex items-center gap-4">
            <div className="text-sm text-[var(--muted-foreground)]">
              {currentImageIndex + 1} / {chapter.images.length}
            </div>

            <select
              value={currentImageIndex}
              id="page-selector"
              name="page"
              onChange={(e) => {
                const newIndex = parseInt(e.target.value);
                setCurrentImageIndex(newIndex);
                saveProgress(chapter.id, newIndex);
              }}
              className="bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1 text-sm text-[var(--foreground)]"
            >
              {chapter.images.map((_, index) => (
                <option key={index} value={index}>
                  Страница {index + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // Панель управления
  const ControlsPanel = () => (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[var(--background)]/90 backdrop-blur-md rounded-xl border border-[var(--border)] p-4 shadow-lg z-50 transition-opacity duration-300 ${
        showControls && !isNearBottom ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-4">
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
            id="chapter-selector"
            name="chapter"
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
            onClick={() => setReadingMode("single")}
            className={`p-2 rounded-lg border transition-colors ${
              readingMode === "single"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--accent)]"
            }`}
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button
            onClick={() => setReadingMode("continuous")}
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
            id="display-mode"
            name="displayMode"
            onChange={(e) => setImageWidth(e.target.value as "auto" | "fit" | "original")}
            className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm text-[var(--foreground)]"
          >
            <option value="auto">Авто</option>
            <option value="fit">По ширине</option>
            <option value="original">Оригинал</option>
          </select>

          <button
            onClick={() => setCurrentImageIndex(0)}
            className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );

  // Нижняя панель навигации (вместо футера)
  const NavigationFooter = () => (
    <div className="bg-[var(--background)] border-t border-[var(--border)] py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {prevChapter ? (
              <Link
                href={`/browse/${title.id}/chapter/${prevChapter.number}`}
                className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <div className="text-left">
                  <div className="text-sm text-[var(--muted-foreground)]">Предыдущая</div>
                  <div className="font-medium">Глава {prevChapter.number}</div>
                </div>
              </Link>
            ) : (
              <div className="opacity-50">
                <div className="text-sm text-[var(--muted-foreground)]">Предыдущая</div>
                <div className="font-medium">Нет главы</div>
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-center">
            <Link
              href={`/browse/${title.id}`}
              className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--accent)]"
            >
              <Home className="w-4 h-4" />
              <span>К тайтлу</span>
            </Link>
          </div>

          <div className="flex-1 flex justify-end">
            {nextChapter ? (
              <Link
                href={`/browse/${title.id}/chapter/${nextChapter.number}`}
                className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors group ml-auto"
              >
                <div className="text-right">
                  <div className="text-sm text-[var(--muted-foreground)]">Следующая</div>
                  <div className="font-medium">Глава {nextChapter.number}</div>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link
                href={`/browse/${title.id}`}
                className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors group ml-auto"
              >
                <div className="text-right">
                  <div className="text-sm text-[var(--muted-foreground)]">Следующая</div>
                  <div className="font-medium">К тайтлу</div>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Одиночный режим чтения
  const SinglePageView = () => (
    <div className="flex items-center justify-center min-h-screen py-20">
      <div className="relative max-w-4xl mx-auto">
        <button
          onClick={goToPrevImage}
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
              onLoad={handleImageLoad}
              onError={() => handleImageError(currentImageIndex)}
              priority={currentImageIndex === 0}
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-96 bg-[var(--card)] rounded-lg border border-[var(--border)]">
              <div className="text-[var(--muted-foreground)] text-lg mb-2">Ошибка загрузки изображения</div>
              <button
                onClick={() => setImageLoadErrors((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(currentImageIndex);
                  return newSet;
                })}
                className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          )}
        </div>

        <button
          onClick={goToNextImage}
          disabled={currentImageIndex === chapter.images.length - 1 && !nextChapter}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-[var(--background)]/80 backdrop-blur-sm border border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--accent)] transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );

  // Режим непрерывной прокрутки
  const ContinuousScrollView = () => (
    <div className="pb-8" ref={mainContainerRef}>
      <div className="max-w-4xl mx-auto">
        {chapter.images.map((image, index) => (
          <div key={index} className="flex justify-center mb-4">
            {!imageLoadErrors.has(index) ? (
              <Image
                src={image}
                alt={`Страница ${index + 1}`}
                width={800}
                height={1200}
                className={`max-w-full h-auto ${
                  imageWidth === "fit" ? "w-full" : imageWidth === "original" ? "w-auto" : "max-w-full"
                }`}
                style={{
                  width: imageWidth === "fit" ? "100%" : imageWidth === "original" ? "auto" : "100%",
                  height: "auto",
                }}
                onLoad={index === 0 ? handleImageLoad : undefined}
                onError={() => handleImageError(index)}
                priority={index < 3}
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-64 bg-[var(--card)] rounded-lg border border-[var(--border)]">
                <div className="text-[var(--muted-foreground)] mb-2">Ошибка загрузки страницы {index + 1}</div>
                <button
                  onClick={() => setImageLoadErrors((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                  })}
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

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />
      <NavigationHeader />
      
      <main 
        className="flex-1 overflow-auto"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        {readingMode === "single" ? <SinglePageView /> : <ContinuousScrollView />}
      </main>
      
      <NavigationFooter />
      <ControlsPanel />
    </div>
  );
}