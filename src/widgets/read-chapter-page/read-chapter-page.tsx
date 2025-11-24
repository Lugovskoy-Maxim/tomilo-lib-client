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
  const { updateChapterViews, addToReadingHistory } = useAuth();

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

  // Refs для предотвращения повторных вызовов
  const containerRef = useRef<HTMLDivElement>(null);
  const historyAddedRef = useRef<Set<string>>(new Set());
  const viewsUpdatedRef = useRef<Set<string>>(new Set());
  const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mobileControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Обновление просмотров и истории чтения
  useEffect(() => {
    if (!title?._id || !chapter?._id) return;

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
        .catch(console.error);
    }
  }, [chapter, title, updateChapterViews, addToReadingHistory]);

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

  // Скрытие хедера при скролле
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledHandleScroll, { passive: true });
    return () => window.removeEventListener("scroll", throttledHandleScroll);
  }, [lastScrollY]);

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
        isMobileControlsVisible={isMobileControlsVisible}
      />

      {/* Хедер */}
      <header
        className={`fixed top-0 left-0 right-0 bg-[var(--card)]/90 backdrop-blur-sm z-50 border-b border-[var(--border)] transition-transform duration-300 ${
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
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors flex-shrink-0"
              >
                ← Назад
              </button>

              {/* Изображение тайтла */}
              {title.image && (
                <div className="relative w-10 h-12 flex-shrink-0">
                  <Image
                    src={process.env.NEXT_PUBLIC_URL + title.image}
                    alt={title.title}
                    fill
                    className="object-cover rounded-md"
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

            <div className="flex items-center space-x-2 w-full sm:w-auto">
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
            </div>
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
          <div className="chapter-container">
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

              return (
                <div
                  key={`${chapter._id}-${imageIndex}`}
                  className="flex justify-center"
                >
                  <div className="relative max-w-4xl w-full">
                    {!isError ? (
                      <Image
                        src={src}
                        alt={`Глава ${chapter.number}, Страница ${
                          imageIndex + 1
                        }`}
                        width={1200}
                        height={1600}
                        className="w-full h-auto shadow-2xl"
                        quality={85}
                        loading={imageIndex < 3 ? "eager" : "lazy"}
                        onError={() =>
                          handleImageError(chapter._id, imageIndex)
                        }
                      />
                    ) : (
                      <div className="w-full h-64 bg-[var(--card)] flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-[var(--destructive)]">
                            Ошибка загрузки
                          </div>
                          <button
                            onClick={() => {
                              setImageLoadErrors((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(errorKey);
                                return newSet;
                              });
                            }}
                            className="px-3 py-1 bg-[var(--primary)] hover:bg-[var(--primary)]/80 rounded transition-colors"
                          >
                            Повторить
                          </button>
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
                  className="flex items-center space-x-2 px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
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
                  className="flex items-center space-x-2 px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <span>Следующая глава</span>
                  <ArrowBigRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Сообщение о завершении всех глав */}
          {currentChapterIndex === chapters.length - 1 && (
            <div className="py-8 text-center border-t border-[var(--border)] mt-8">
              <p className="text-lg font-semibold mb-2">
                Вы дочитали до конца!
              </p>
              <button
                onClick={() => router.push(`/browse/${titleId}`)}
                className="px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/80 rounded-lg transition-colors"
              >
                Вернуться к тайтлу
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Футер */}
      <footer className="bg-[var(--card)] border-t border-[var(--border)] py-4">
        <div className="container mx-auto px-4 text-center text-[var(--muted-foreground)] text-sm">
          <p>Используйте ← → для навигации между главами</p>
        </div>
      </footer>
    </div>
  );
}
