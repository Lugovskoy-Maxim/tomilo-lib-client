"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useAuth } from "@/hooks/useAuth";
import { ReaderTitle } from "@/types/title";
import { ReaderChapter } from "@/types/chapter";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import ReaderControls from "@/shared/reader/reader-controls";
import { useSEO, seoConfigs } from "@/hooks/useSEO";

export default function ReadChapterPage({
  title,
  chapter,
  chapters,
}: {
  title: ReaderTitle;
  chapter: ReaderChapter;
  chapters: ReaderChapter[];
}) {
  const router = useRouter();
  const { updateChapterViews, addToReadingHistory, isAuthenticated } =
    useAuth();

  const titleId = title._id;
  const chapterId = chapter._id;

  // Находим текущую главу и её индекс
  const currentChapterIndex = useMemo(() => {
    const foundIndex = chapters.findIndex((ch) => ch._id === chapterId);
    return foundIndex !== -1 ? foundIndex : 0;
  }, [chapters, chapterId]);

  // Состояния
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set()
  );
  const [, setIsFullscreen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isMobileControlsVisible, setIsMobileControlsVisible] = useState(false);
  const [, setHasTapped] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [imageWidth, setImageWidth] = useState(1200);

  // Определение мобильного устройства
  const [isMobile, setIsMobile] = useState(false);

  // Загрузка ширины изображений из localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('reader-image-width');
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (width >= 768 && width <= 1440) {
        setImageWidth(width);
      }
    }
  }, []);

  // Сохранение ширины изображений в localStorage
  const handleImageWidthChange = useCallback((width: number) => {
    setImageWidth(width);
    localStorage.setItem('reader-image-width', width.toString());
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent)
      );
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Refs для предотвращения повторных вызовов
  const containerRef = useRef<HTMLDivElement>(null);
  const historyAddedRef = useRef<Set<string>>(new Set());
  const viewsUpdatedRef = useRef<Set<string>>(new Set());
  const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mobileControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Функция для получения корректного URL изображения
  const getImageUrl = useCallback((url: string) => {
    if (!url) return "";

    // Если URL уже абсолютный (начинается с http), возвращаем как есть
    if (url.startsWith("http")) {
      return url;
    }

    // Если URL относительный, добавляем базовый URL
    return `${process.env.NEXT_PUBLIC_URL}${url}`;
  }, []);

  // Функция загрузчика изображений с поддержкой ширины
  const imageLoader = useCallback(({ src, width }: { src: string; width: number }) => {
    const imageUrl = getImageUrl(src);
    // Добавляем параметр ширины к URL для оптимизации
    return `${imageUrl}?w=${width}`;
  }, [getImageUrl]);

  // Обновление просмотров и истории чтения
  useEffect(() => {
    if (!title?._id || !chapter?._id || !isAuthenticated) return;

    const chapterKey = `${title._id}-${chapter._id}`;

    // Обновляем просмотры только один раз
    if (!viewsUpdatedRef.current.has(chapterKey)) {
      updateChapterViews(chapter._id, chapter.views)
        .then(() => {
          viewsUpdatedRef.current.add(chapterKey);
        })
        .catch(console.error);
    }

    // Добавляем в историю чтения только один раз
    if (!historyAddedRef.current.has(chapterKey)) {
      addToReadingHistory(title._id.toString(), chapter._id.toString())
        .then(() => {
          historyAddedRef.current.add(chapterKey);
        })
        .catch((error) => {
          console.error("Error adding to reading history:", error);
          // Не перебрасываем ошибку, чтобы избежать бесконечных запросов
        });
    }
  }, [
    chapter._id,
    title._id,
    chapter.views,
    updateChapterViews,
    addToReadingHistory,
    isAuthenticated,
  ]);

  // Конфигурация SEO для текущей главы
  const seoConfig = useMemo(() => {
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/browse/${titleId}/chapter/${chapter._id}`
        : "";

    return {
      ...seoConfigs.chapter(
        {
          name: title.title,
          title: title.title,
        },
        chapter.number,
        chapter.title
      ),
      url: baseUrl,
    };
  }, [chapter, titleId, title.title]);

  useSEO(seoConfig);

  // Обработчик ошибок загрузки изображений
  const handleImageError = useCallback(
    (chapterId: string, imageIndex: number) => {
      const errorKey = `${chapterId}-${imageIndex}`;
      setImageLoadErrors((prev) => new Set(prev).add(errorKey));
    },
    []
  );

  // Навигация по клавиатуре
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          if (currentChapterIndex > 0) {
            const prevChapter = chapters[currentChapterIndex - 1];
            router.push(`/browse/${titleId}/chapter/${prevChapter._id}`);
          }
          break;
        case "ArrowRight":
          if (currentChapterIndex < chapters.length - 1) {
            const nextChapter = chapters[currentChapterIndex + 1];
            router.push(`/browse/${titleId}/chapter/${nextChapter._id}`);
          }
          break;
        case "Escape":
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentChapterIndex, chapters, titleId, router]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Обработчики для хедера
  const handleHeaderMouseEnter = () => {
    if (headerTimeoutRef.current) {
      clearTimeout(headerTimeoutRef.current);
    }
    setIsHeaderVisible(true);
  };

  const handleHeaderMouseLeave = () => {
    headerTimeoutRef.current = setTimeout(() => {
      setIsHeaderVisible(false);
    }, 1000);
  };

  // Обработчики для мобильных контролов
  const handleMobileTap = () => {
    setHasTapped(true);
    setIsMobileControlsVisible(true);
    if (mobileControlsTimeoutRef.current) {
      clearTimeout(mobileControlsTimeoutRef.current);
    }
    mobileControlsTimeoutRef.current = setTimeout(() => {
      setIsMobileControlsVisible(false);
    }, 3000);
  };

  // Скрытие хедера при скролле с оптимизацией
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsHeaderVisible(false);
          } else if (currentScrollY < lastScrollY) {
            setIsHeaderVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Используем passive: true для лучшей производительности
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Отслеживание текущей страницы с помощью scroll event
  useEffect(() => {
    const handleScroll = () => {
      const pageElements = document.querySelectorAll("[data-page]");
      let maxVisible = 0;
      let current = 1;
      pageElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const visibleHeight = Math.max(
          0,
          Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
        );
        const visibleRatio = visibleHeight / rect.height;
        if (visibleRatio > maxVisible) {
          maxVisible = visibleRatio;
          current = parseInt(el.getAttribute("data-page") || "1");
        }
      });
      setCurrentPage(current);
    };

    handleScroll(); // initial update

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [chapter.images]);

  const loading = !chapter;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <p className="text-[var(--foreground)]">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            Глава не найдена
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Попробуйте обновить страницу или выбрать другую главу
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Меню управления */}
      <ReaderControls
        key={chapter._id}
        currentChapter={chapter}
        currentPage={currentPage}
        chapterImageLength={chapter.images.length}
        chapters={chapters}
        onChapterSelect={(chapterId) =>
          router.push(`/browse/${titleId}/chapter/${chapterId}`)
        }
        onPrev={() => {
          if (currentChapterIndex > 0) {
            const prevChapter = chapters[currentChapterIndex - 1];
            router.push(`/browse/${titleId}/chapter/${prevChapter._id}`);
          }
        }}
        onNext={() => {
          if (currentChapterIndex < chapters.length - 1) {
            const nextChapter = chapters[currentChapterIndex + 1];
            router.push(`/browse/${titleId}/chapter/${nextChapter._id}`);
          }
        }}
        canGoPrev={currentChapterIndex > 0}
        canGoNext={currentChapterIndex < chapters.length - 1}
        titleId={titleId}
        isMobileControlsVisible={isMobileControlsVisible}
        imageWidth={imageWidth}
        onImageWidthChange={handleImageWidthChange}
      />

      {/* Хедер */}
      <header
        className={`fixed top-0 left-0 right-0 bg-[var(--card)]/90 backdrop-blur-sm z-50 border-b border-[var(--border)] transition-transform duration-300 ease-out will-change-transform ${
          isHeaderVisible ? "translate-y-0" : "-translate-y-full"
        }`}
        onMouseEnter={handleHeaderMouseEnter}
        onMouseLeave={handleHeaderMouseLeave}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <button
                onClick={() => router.push(`/browse/${titleId}`)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors flex-shrink-0 cursor-pointer"
              >
                <ArrowBigLeft className="h-4 w-4" />
              </button>

              {/* Изображение тайтла */}
              {title.image && (
                <div className="relative w-10 h-12 flex-shrink-0">
                  <Image
                    loader={() => getImageUrl(title.image)}
                    src={getImageUrl(title.image)}
                    alt={title.title}
                    fill
                    className="object-cover rounded-md"
                    sizes="40px"
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h1
                  className="font-semibold text-lg truncate"
                  title={title.title}
                >
                  {title.title}
                </h1>
                <p className="text-[var(--muted-foreground)] text-sm truncate">
                  Глава {chapter.number} {chapter.title && `- ${chapter.title}`}
                </p>
              </div>
            </div>

            {/* <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={chapter._id}
                onChange={(e) =>
                  router.push(`/browse/${titleId}/chapter/${e.target.value}`)
                }
                className="bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] w-full sm:min-w-[200px]"
              >
                {chapters.map((chapter) => (
                  <option key={chapter._id} value={chapter._id}>
                    Глава {chapter.number}{" "}
                    {chapter.title && `- ${chapter.title}`}
                  </option>
                ))}
              </select>
            </div> */}
          </div>
        </div>
      </header>

      {/* Основной контент - ТОЛЬКО ОДНА ГЛАВА */}
      <main
        ref={containerRef}
        className="pt-20 sm:pt-16"
        onClick={handleMobileTap}
      >
        <div className="container mx-auto">
          <div className=" chapter-container">
            {/* Заголовок главы */}
            <div className="py-2 text-center border-b border-[var(--border)] mb-2">
              <h2 className="text-xl font-semibold">
                Глава {chapter.number}
                {chapter.title && ` - ${chapter.title}`}
              </h2>
            </div>

            {/* Изображения главы */}
            {chapter.images.map((src, imageIndex) => {
              const errorKey = `${chapter._id}-${imageIndex}`;
              const isError = imageLoadErrors.has(errorKey);
              const imageUrl = getImageUrl(src);

              return (
                <div
                  key={`${chapter._id}-${imageIndex}`}
                  className="flex justify-center"
                >
                  <div
                    className="relative w-full flex justify-center"
                    data-page={imageIndex + 1}
                    style={{ maxWidth: isMobile ? '1200px' : `${imageWidth}px` }}
                  >
                    {!isError ? (
                      <Image
                        key={`${chapter._id}-${imageIndex}-${imageWidth}`}
                        loader={imageLoader}
                        src={src}
                        alt={`Глава ${chapter.number}, Страница ${
                          imageIndex + 1
                        }`}
                        width={isMobile ? 1200 : imageWidth}
                        height={isMobile ? 1600 : Math.round((imageWidth * 1600) / 1200)}
                        className="w-full h-auto shadow-2xl"
                        quality={85}
                        loading={
                          imageIndex < (isMobile ? 6 : 3) ? "eager" : "lazy"
                        }
                        onError={() =>
                          handleImageError(chapter._id, imageIndex)
                        }
                        priority={imageIndex < (isMobile ? 3 : 1)}
                      />
                    ) : (
                      <div className="w-full h-64 bg-[var(--card)] flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-[var(--destructive)] mb-2">
                            Ошибка загрузки изображения
                          </div>
                          <button
                            onClick={() => {
                              setImageLoadErrors((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(errorKey);
                                return newSet;
                              });
                            }}
                            className="px-4 py-2 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/80 rounded transition-colors"
                          >
                            Повторить загрузку
                          </button>
                          <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                            URL: {imageUrl}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Футер главы с кнопками навигации */}
            <div className="py-6 border-t border-[var(--border)] mt-8">
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={() => {
                    if (currentChapterIndex > 0) {
                      const prevChapter = chapters[currentChapterIndex - 1];
                      router.push(
                        `/browse/${titleId}/chapter/${prevChapter._id}`
                      );
                    }
                  }}
                  disabled={currentChapterIndex === 0}
                  className="flex cursor-pointer items-center space-x-2 px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ArrowBigLeft className="w-4 h-4" />
                  <span>Предыдущая глава</span>
                </button>

                <button
                  onClick={() => {
                    if (currentChapterIndex < chapters.length - 1) {
                      const nextChapter = chapters[currentChapterIndex + 1];
                      router.push(
                        `/browse/${titleId}/chapter/${nextChapter._id}`
                      );
                    }
                  }}
                  disabled={currentChapterIndex === chapters.length - 1}
                  className="flex cursor-pointer items-center space-x-2 px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <span>Следующая глава</span>
                  <ArrowBigRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Сообщение о завершении всех глав */}
          {currentChapterIndex === chapters.length - 1 && (
            <div className="py-6 text-center border-t border-[var(--border)] mt-8">
              <p className="text-lg font-semibold mb-2">
                Вы дочитали до конца!
              </p>
              <button
                onClick={() => router.push(`/browse/${titleId}`)}
                className="px-6 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/80 rounded-lg transition-colors"
              >
                Вернуться к тайтлу
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Футер */}
      <footer className="bg-[var(--card)] border-t border-[var(--border)] py-4">
        <div className="container mx-auto px-4 text-center text-[var(--muted-foreground)] text-sm hidden md:block">
          <p>Используйте ← → для навигации между главами</p>
        </div>
      </footer>
    </div>
  );
}
