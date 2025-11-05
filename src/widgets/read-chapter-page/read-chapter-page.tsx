"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ReaderChapter as Chapter, ReaderTitle as Title } from "@/shared/reader/types";
import {
  NavigationHeader,
  SinglePageView,
  ContinuousScrollView,
  NavigationFooter,
  ControlsPanel,
} from "@/shared";
import { useAuth } from "@/hooks/useAuth";

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
  const { updateChapterViews, addToReadingHistory } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(
    new Set()
  );
  const [viewsUpdated, setViewsUpdated] = useState(false); // Флаг для отслеживания обновления просмотров
  const [readingMode, setReadingMode] = useState<"single" | "continuous">(
    "continuous"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [imageWidth, setImageWidth] = useState<"auto" | "fit" | "original">(
    "auto"
  );
  const [isNearBottom, setIsNearBottom] = useState(false);
  const [isNearTop, setIsNearTop] = useState(false);

  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Навигация по главам
  const currentChapterIndex = chapters.findIndex((ch) => ch._id === chapter._id);
  const prevChapter =
    currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter =
    currentChapterIndex < chapters.length - 1
      ? chapters[currentChapterIndex + 1]
      : null;

  // Сохранение прогресса
  const saveProgress = useCallback(
    (chapterId: string, imageIndex: number) => {
      if (typeof window !== "undefined") {
        const progress = {
          chapterId,
          imageIndex,
          timestamp: Date.now(),
          totalImages: chapter.images.length,
        };
        localStorage.setItem(`progress_${title._id}`, JSON.stringify(progress));
      }
    },
    [title._id, chapter.images.length]
  );


   // Навигация по изображениям
  const goToNextImage = useCallback(() => {
    if (currentImageIndex < chapter.images.length - 1) {
      setCurrentImageIndex((prev) => {
        const newIndex = prev + 1;
        saveProgress(chapter._id, newIndex);
        return newIndex;
      });
    } else if (nextChapter && nextChapter._id) {
      router.push(`/browse/${title._id}/chapter/${nextChapter._id}`);
    }
  }, [
    currentImageIndex,
    chapter.images.length,
    chapter._id,
    nextChapter,
    title._id,
    router,
    saveProgress,
  ]);

  const goToPrevImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => {
        const newIndex = prev - 1;
        saveProgress(chapter._id, newIndex);
        return newIndex;
      });
    } else if (prevChapter && prevChapter._id) {
      router.push(`/browse/${title._id}/chapter/${prevChapter._id}`);
    }
  }, [
    currentImageIndex,
    chapter._id,
    prevChapter,
    title._id,
    router,
    saveProgress,
  ]);

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
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
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

  // Управление контролами
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const isMouseNearTop = e.clientY < 100; // Верхняя зона 100px
      const isMouseNearBottom = e.clientY > window.innerHeight - 150; // Нижняя зона 150px

      // Показываем контролы если мышь в верхней или нижней зоне
      if ((isMouseNearTop || isMouseNearBottom) && !isNearBottom) {
        showControlsTemporarily();
      }
    },
    [showControlsTemporarily, isNearBottom]
  );

  const handleClick = useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Определение близости к верхней и нижней части страницы
  useEffect(() => {
    const checkScrollPosition = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // Считаем, что мы внизу, если до конца страницы меньше 300px
      const atBottom = scrollHeight - scrollTop - clientHeight < 300;
      setIsNearBottom(atBottom);

      // Считаем, что мы вверху, если прокрутка меньше 100px
      const atTop = scrollTop < 100;
      setIsNearTop(atTop);
    };

    window.addEventListener("scroll", checkScrollPosition);
    checkScrollPosition();

    return () => window.removeEventListener("scroll", checkScrollPosition);
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

  // Автоматически показываем контролы при приближении к верхней части
  useEffect(() => {
    if (isNearTop) {
      showControlsTemporarily();
    }
  }, [isNearTop, showControlsTemporarily]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Обновление счетчиков просмотров при загрузке компонента
  useEffect(() => {
    let isCancelled = false;

    const updateViews = async () => {
      // Проверяем, что запрос еще не был отправлен и есть необходимые данные
      if (!viewsUpdated && title._id && chapter._id) {
        // Передаем _id главы и текущее значение просмотров
        // Дополнительная проверка для удовлетворения TypeScript
        const chapterId = chapter._id;
        if (chapterId) {
          try {
            const result = await updateChapterViews(chapterId, chapter.views);
            if (result.error) {
              console.error("Failed to update chapter views:", result.error);
              // Не повторяем запрос при ошибке
              return;
            }
            // Устанавливаем флаг, что запрос был отправлен
            setViewsUpdated(true);
          } catch (error) {
            console.error("Error updating chapter views:", error);
            // Не повторяем запрос при ошибке
            return;
          }
        }
      }
    };

    const updateReadingHistory = async () => {
      // Добавляем запись в историю чтения
      if (title._id && chapter._id) {
        try {
          // Дополнительная проверка для удовлетворения TypeScript
          if (chapter._id) {
            const result = await addToReadingHistory(title._id.toString(), chapter._id.toString());
            if (result.error) {
              console.error("Failed to add to reading history:", result.error);
            }
          }
        } catch (error) {
          console.error("Error adding to reading history:", error);
        }
      }
    };

    updateViews();
    updateReadingHistory();

    return () => {
      isCancelled = true;
    };
  }, [title._id, chapter._id, viewsUpdated]); // Добавляем viewsUpdated в зависимости

  // Обработка ошибок загрузки изображений
  const handleImageError = (index: number) => {
    const imageUrl = chapter.images?.[index] || 'undefined';
    console.error(`Error loading image ${index}:`, imageUrl);
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

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <NavigationHeader
        title={title}
        chapter={chapter}
        currentImageIndex={currentImageIndex}
        showControls={showControls || isNearTop} // Всегда показываем хедер в верхней части
        onImageIndexChange={(newIndex) => {
          setCurrentImageIndex(newIndex);
          saveProgress(chapter._id, newIndex);
        }}
        imagesCount={chapter.images.length}
      />

      <main
        className="flex-1 overflow-auto"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        {readingMode === "single" ? (
          <SinglePageView
            chapter={chapter}
            currentImageIndex={currentImageIndex}
            imageWidth={imageWidth}
            imageLoadErrors={imageLoadErrors}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
            title={title}
            onPrevImage={goToPrevImage}
            onNextImage={goToNextImage}
            onImageError={handleImageError}
            onImageLoad={handleImageLoad}
          />
        ) : (
          <ContinuousScrollView
            chapter={chapter}
            imageWidth={imageWidth}
            imageLoadErrors={imageLoadErrors}
            onImageError={handleImageError}
            onImageLoad={handleImageLoad}
          />
        )}
      </main>

      <NavigationFooter
        title={title}
        prevChapter={prevChapter}
        nextChapter={nextChapter}
      />

      <ControlsPanel
        title={title}
        chapter={chapter}
        chapters={chapters}
        readingMode={readingMode}
        imageWidth={imageWidth}
        isFullscreen={isFullscreen}
        showControls={showControls}
        isNearBottom={isNearBottom}
        onReadingModeChange={setReadingMode}
        onImageWidthChange={setImageWidth}
        onToggleFullscreen={toggleFullscreen}
        onResetImageIndex={() => setCurrentImageIndex(0)}
      />
    </div>
  );
}
