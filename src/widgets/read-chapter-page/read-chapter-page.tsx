
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { useGetChaptersByTitleQuery } from "@/store/api/chaptersApi";
import { useAuth } from "@/hooks/useAuth";
import { Chapter, ReaderTitle, Title } from "@/types/title";
import { ApiResponse } from "@/types/api";
import { ReaderChapter } from "@/types/chapter";
import { ArrowBigLeft, ArrowBigRight, Home } from "lucide-react";
import ReaderControls from "@/shared/reader/reader-controls";


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
  const { user, updateChapterViews, addToReadingHistory } = useAuth();

  const titleId = title._id;
  const chapterId = chapter._id;

  // Находим текущую главу и её индекс
  const { currentChapter, currentChapterIndex } = useMemo(() => {
    const foundIndex = chapters.findIndex((ch) => ch._id === chapterId);
    return {
      currentChapter: chapter,
      currentChapterIndex: foundIndex !== -1 ? foundIndex : 0,
    };
  }, [chapters, chapterId, chapter]);

  // Состояния
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(
    new Set()
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isMobileControlsVisible, setIsMobileControlsVisible] = useState(false);
  const [hasTapped, setHasTapped] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Refs для предотвращения повторных вызовов
  const containerRef = useRef<HTMLDivElement>(null);
  const historyAddedRef = useRef<Set<string>>(new Set());
  const viewsUpdatedRef = useRef<Set<string>>(new Set());
  const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mobileControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Обновление просмотров и истории чтения (без бесконечного цикла)
  useEffect(() => {
    if (!currentChapter?._id || !title?._id) return;

    const chapterKey = `${title._id}-${currentChapter._id}`;

    // Обновляем просмотры только один раз
    if (!viewsUpdatedRef.current.has(chapterKey)) {
      updateChapterViews(currentChapter._id, currentChapter.views)
        .then(() => {
          viewsUpdatedRef.current.add(chapterKey);
        })
        .catch(console.error);
    }

    // Добавляем в историю чтения только один раз
    if (!historyAddedRef.current.has(chapterKey)) {
      addToReadingHistory(title._id.toString(), currentChapter._id.toString())
        .then(() => {
          historyAddedRef.current.add(chapterKey);
        })
        .catch(console.error);
    }
  }, [currentChapter, title, updateChapterViews, addToReadingHistory]);

  // Обработчик ошибок загрузки изображений
  const handleImageError = useCallback((imageIndex: number) => {
    setImageLoadErrors((prev) => new Set(prev).add(imageIndex));
  }, []);

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
    }, 1000); // Скрываем через 1 секунду
  };

  // Обработчик скролла для авто-скрытия хедера
  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Скролл вниз - скрываем хедер
      setIsHeaderVisible(false);
    } else if (currentScrollY < lastScrollY) {
      // Скролл вверх - показываем хедер
      setIsHeaderVisible(true);
    }

    setLastScrollY(currentScrollY);
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
    }, 3000); // Скрываем через 3 секунды
  };

  // Проверка достижения низа страницы и скролл для хедера
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      const isNearBottom = scrollTop + windowHeight >= documentHeight - 100; // 100px от низа

      if (isNearBottom) {
        setIsMobileControlsVisible(true);
      }

      // Обработка скролла для хедера
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Скролл вниз - скрываем хедер
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Скролл вверх - показываем хедер
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const loading = !currentChapter;

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

  if (!currentChapter) {
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
        currentChapter={currentChapter}
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
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
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
                  Глава {currentChapter.number}{" "}
                  {currentChapter.title && `- ${currentChapter.title}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">

              <select
                value={currentChapter._id}
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

      {/* Основной контент */}
      <main
        ref={containerRef}
        className="pt-20 sm:pt-16 "
        onClick={handleMobileTap}
      >
        {/* Изображения текущей главы */}
        <div className="container mx-auto px-2 sm:px-4">
          {currentChapter.images.map((src, imageIndex) => (
            <div key={imageIndex} className="flex justify-center">
              <div className="relative max-w-4xl w-full">
                {!imageLoadErrors.has(imageIndex) ? (
                  <Image
                    src={src}
                    alt={`Страница ${imageIndex + 1}`}
                    width={1200}
                    height={1600}
                    className="w-full h-auto shadow-2xl"
                    quality={85}
                    loading={imageIndex < 3 ? "eager" : "lazy"}
                    onError={() => handleImageError(imageIndex)}
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
                            newSet.delete(imageIndex);
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
          ))}
        </div>

        {/* Навигация в конце главы */}
        <div className="flex flex-col container min-w-screen w-full">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center w-full space-y-2 sm:space-y-0 ">
            {/* Левая кнопка - предыдущая глава */}
            {currentChapterIndex > 0 ? (
              <button
                onClick={() => {
                  const prevChapter = chapters[currentChapterIndex - 1];
                  router.push(`/browse/${titleId}/chapter/${prevChapter._id}`);
                }}
                className={`flex items-center justify-center h-20 space-x-2 bg-[var(--muted)] hover:bg-[var(--muted)]/80 transition-colors w-full ${
                  typeof window !== 'undefined' && window.innerWidth < 640 ? 'hidden' : ''
                }`}
              >
                <ArrowBigLeft className="w-6 h-6" />
                <div className="text-center">
                  <div className="text-sm text-[var(--muted-foreground)]">
                    Предыдущая
                  </div>
                  <div className="font-semibold">
                    Глава {chapters[currentChapterIndex - 1].number}
                  </div>
                </div>
              </button>
            ) : (
              <div className={`w-full ${typeof window !== 'undefined' && window.innerWidth < 640 ? 'hidden' : ''}`}></div>
            )}

            {/* Правая кнопка - следующая глава или завершение */}
            {currentChapterIndex < chapters.length - 1 ? (
              <button
                onClick={() => {
                  const nextChapter = chapters[currentChapterIndex + 1];
                  router.push(`/browse/${titleId}/chapter/${nextChapter._id}`);
                }}
                className={`flex items-center justify-center space-x-2 h-20 bg-[var(--muted)] hover:bg-[var(--muted)]/80 w-full transition-colors w-full ${
                  typeof window !== 'undefined' && window.innerWidth < 640 ? 'hidden' : ''
                }`}
              >
                <div className="text-center">
                  <div className="text-sm text-[var(--muted-foreground)]">
                    Следующая
                  </div>
                  <div className="font-semibold">
                    Глава {chapters[currentChapterIndex + 1].number}
                  </div>
                </div>
                <ArrowBigRight className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={() => router.push(`/browse/${titleId}`)}
                className="flex items-center justify-center px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/80 rounded-lg transition-colors w-full"
              >
                <div className="text-center">
                  <div className="text-sm text-[var(--accent-foreground)]">
                    Завершить чтение
                  </div>
                  <div className="font-semibold">Вернуться к тайтлу</div>
                </div>
              </button>
            )}
          </div>
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
