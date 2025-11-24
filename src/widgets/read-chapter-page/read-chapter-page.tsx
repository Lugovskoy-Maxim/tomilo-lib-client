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
  const { currentChapter, currentChapterIndex } = useMemo(() => {
    const foundIndex = chapters.findIndex((ch) => ch._id === chapterId);
    return {
      currentChapter: chapter,
      currentChapterIndex: foundIndex !== -1 ? foundIndex : 0,
    };
  }, [chapters, chapterId, chapter]);

  // Состояния для бесконечной прокрутки
  const [loadedChapters, setLoadedChapters] = useState<ReaderChapter[]>([]);
  const [currentVisibleChapterIndex, setCurrentVisibleChapterIndex] =
    useState(0);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const lastUpdatedChapterIdRef = useRef<string>("");

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
  const chapterEndObserverRef = useRef<IntersectionObserver | null>(null);
  const chapterMarkerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Обновление просмотров и истории чтения при изменении видимой главы
  useEffect(() => {
    if (!title?._id || loadedChapters.length === 0) return;

    const visibleChapter = loadedChapters[currentVisibleChapterIndex];
    if (!visibleChapter?._id) return;

    const chapterKey = `${title._id}-${visibleChapter._id}`;

    // Обновляем просмотры только один раз
    if (!viewsUpdatedRef.current.has(chapterKey)) {
      updateChapterViews(visibleChapter._id, visibleChapter.views)
        .then(() => {
          viewsUpdatedRef.current.add(chapterKey);
        })
        .catch(console.error);
    }

    // Добавляем в историю чтения только один раз
    if (!historyAddedRef.current.has(chapterKey)) {
      addToReadingHistory(title._id.toString(), visibleChapter._id.toString())
        .then(() => {
          historyAddedRef.current.add(chapterKey);
        })
        .catch(console.error);
    }
  }, [
    currentVisibleChapterIndex,
    loadedChapters,
    title,
    updateChapterViews,
    addToReadingHistory,
  ]);

  // Debug logging for state changes
  useEffect(() => {
    console.log(
      "DEBUG: currentVisibleChapterIndex changed to:",
      currentVisibleChapterIndex
    );
    console.log(
      "DEBUG: loadedChapters:",
      loadedChapters.map((ch) => ({ id: ch._id, number: ch.number }))
    );
    console.log(
      "DEBUG: visible chapter:",
      loadedChapters[currentVisibleChapterIndex]
    );
  }, [currentVisibleChapterIndex, loadedChapters]);

  // Force re-render of ReaderControls when visible chapter changes
  const readerControlsKey = (
    loadedChapters[currentVisibleChapterIndex] || currentChapter
  )._id;

  // Обновление SEO при изменении видимой главы
  const visibleChapter = useMemo(() => {
    return loadedChapters[currentVisibleChapterIndex] || currentChapter;
  }, [loadedChapters, currentVisibleChapterIndex, currentChapter]);

  // Конфигурация SEO с актуальным URL
  const seoConfig = useMemo(() => {
    const chapter = visibleChapter;
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
      url: baseUrl, // Добавляем текущий URL для обновления og:url
    };
  }, [visibleChapter, titleId, title.title]);

  useSEO(seoConfig);

  // Инициализация и обновление загруженных глав при изменении chapterId
  useEffect(() => {
    if (!currentChapter) return;

    // Обновляем ref для отслеживания последней обновленной главы
    if (chapterId !== lastUpdatedChapterIdRef.current) {
      lastUpdatedChapterIdRef.current = chapterId;
    }

    // Проверяем, изменилась ли текущая глава
    const isCurrentChapterLoaded = loadedChapters.some(
      (ch) => ch._id === chapterId
    );

    // Если текущая глава не загружена или это явный переход (не через прокрутку)
    if (!isCurrentChapterLoaded || loadedChapters.length === 0) {
      // Находим индекс текущей главы в общем списке
      const foundIndex = chapters.findIndex((ch) => ch._id === chapterId);

      if (foundIndex !== -1) {
        // Загружаем текущую главу и следующую (если есть) для предзагрузки
        const initialChapters = [chapters[foundIndex]];
        if (foundIndex < chapters.length - 1) {
          initialChapters.push(chapters[foundIndex + 1]);
        }
        setLoadedChapters(initialChapters);
        setCurrentVisibleChapterIndex(0);

        // Прокручиваем в начало главы при явном переходе
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 100);
      }
    }
  }, [chapterId, currentChapter, chapters, loadedChapters]);

  // Обработчик ошибок загрузки изображений
  const handleImageError = useCallback(
    (chapterId: string, imageIndex: number) => {
      const errorKey = `${chapterId}-${imageIndex}`;
      setImageLoadErrors((prev) => new Set(prev).add(errorKey));
    },
    []
  );

  // Функция для плавного обновления URL без перезагрузки
  const updateUrlSmoothly = useCallback(
    (newChapterId: string) => {
      const newUrl = `/browse/${titleId}/chapter/${newChapterId}`;
      const currentUrl = window.location.pathname;

      // Обновляем URL только если он действительно изменился
      if (currentUrl === newUrl) {
        return;
      }

      // Используем только window.history.replaceState для плавного обновления без перезагрузки
      if (typeof window !== "undefined" && window.history) {
        try {
          // Получаем текущее состояние истории
          const currentState = window.history.state || {};

          // Обновляем URL через History API без перезагрузки страницы
          window.history.replaceState(
            { ...currentState, as: newUrl, url: newUrl },
            "",
            newUrl
          );

          // Обновляем состояние роутера асинхронно в следующем тике, чтобы не блокировать UI
          // Используем setTimeout с минимальной задержкой для плавности
          setTimeout(() => {
            // Проверяем, что URL все еще нужно обновить (на случай если пользователь уже перешел)
            if (window.location.pathname !== newUrl) {
              router.replace(newUrl, { scroll: false });
            }
          }, 0);
        } catch (error) {
          console.warn("Failed to update URL smoothly:", error);
          // Fallback на обычный replace только в случае ошибки
          router.replace(newUrl, { scroll: false });
        }
      }
    },
    [titleId, router]
  );

  // Функция для загрузки следующей главы
  const loadNextChapter = useCallback(() => {
    if (isLoadingNext) return;

    const lastLoadedIndex =
      loadedChapters.length > 0
        ? chapters.findIndex(
            (ch) => ch._id === loadedChapters[loadedChapters.length - 1]._id
          )
        : currentChapterIndex;

    if (lastLoadedIndex < chapters.length - 1) {
      setIsLoadingNext(true);
      const nextChapter = chapters[lastLoadedIndex + 1];
      setLoadedChapters((prev) => {
        const newChapters = [...prev, nextChapter];
        // После добавления новой главы, убеждаемся что её маркер будет наблюдаться
        setTimeout(() => {
          const newMarker = chapterMarkerRefs.current.get(nextChapter._id);
          if (newMarker && chapterEndObserverRef.current) {
            try {
              chapterEndObserverRef.current.observe(newMarker);
            } catch (error) {
              console.debug("Failed to observe new chapter marker:", error);
            }
          }
        }, 150);
        return newChapters;
      });
      setIsLoadingNext(false);
    }
  }, [isLoadingNext, loadedChapters, chapters, currentChapterIndex]);

  // IntersectionObserver для отслеживания видимой главы и автоматической загрузки следующей
  useEffect(() => {
    if (!containerRef.current || loadedChapters.length === 0) return;

    // Отключаем предыдущий observer
    if (chapterEndObserverRef.current) {
      chapterEndObserverRef.current.disconnect();
    }

    // Создаем новый observer для отслеживания начала каждой главы
    chapterEndObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const observedChapterId =
              entry.target.getAttribute("data-chapter-id");
            if (!observedChapterId) return;

            // Находим индекс видимой главы
            const visibleIndex = loadedChapters.findIndex(
              (ch) => ch._id === observedChapterId
            );
            if (visibleIndex !== -1) {
              const newChapterId = loadedChapters[visibleIndex]._id;

              // Обновляем состояние и URL только если это действительно новая глава
              if (newChapterId !== lastUpdatedChapterIdRef.current) {
                lastUpdatedChapterIdRef.current = newChapterId;

                // Обновляем индекс видимой главы
                if (visibleIndex !== currentVisibleChapterIndex) {
                  setCurrentVisibleChapterIndex(visibleIndex);
                }

                // Плавно обновляем URL без перезагрузки страницы
                updateUrlSmoothly(newChapterId);
              }

              // Если это последняя загруженная глава, загружаем следующую
              if (visibleIndex === loadedChapters.length - 1) {
                loadNextChapter();
              }
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "-20% 0px -70% 0px", // Срабатывает когда маркер в верхней части экрана
        threshold: 0.1,
      }
    );

    // Наблюдаем за маркерами начала глав
    // Используем requestAnimationFrame для более надежного добавления в observer
    const observeMarkers = () => {
      chapterMarkerRefs.current.forEach((marker, chapterId) => {
        if (marker && chapterEndObserverRef.current) {
          try {
            chapterEndObserverRef.current.observe(marker);
          } catch (error) {
            // Маркер уже наблюдается или был удален - это нормально
            console.debug("Marker observation skipped for chapter:", chapterId, error);
          }
        }
      });
    };

    // Используем несколько попыток для надежности при загрузке новых глав
    requestAnimationFrame(() => {
      observeMarkers();
      // Повторная попытка через небольшую задержку для новых маркеров
      setTimeout(observeMarkers, 100);
    });

    return () => {
      if (chapterEndObserverRef.current) {
        chapterEndObserverRef.current.disconnect();
      }
    };
  }, [
    loadedChapters,
    currentVisibleChapterIndex,
    loadNextChapter,
    updateUrlSmoothly,
  ]);

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

  // Проверка достижения низа страницы, скролл для хедера и предзагрузка следующей главы
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      const isNearBottom = scrollTop + windowHeight >= documentHeight - 100; // 100px от низа

      if (isNearBottom) {
        setIsMobileControlsVisible(true);

        // Предзагрузка следующей главы при приближении к концу
        if (!isLoadingNext && loadedChapters.length > 0) {
          const lastLoadedIndex = chapters.findIndex(
            (ch) => ch._id === loadedChapters[loadedChapters.length - 1]._id
          );

          // Если осталось меньше 500px до конца и есть следующая глава
          const distanceToBottom = documentHeight - scrollTop - windowHeight;
          if (distanceToBottom < 500 && lastLoadedIndex < chapters.length - 1) {
            loadNextChapter();
          }
        }
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

    // Используем throttling для оптимизации производительности
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
  }, [lastScrollY, isLoadingNext, loadedChapters, chapters, loadNextChapter]);

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
        key={readerControlsKey}
        currentChapter={
          loadedChapters[currentVisibleChapterIndex] || currentChapter
        }
        chapters={chapters}
        onChapterSelect={(chapterId) =>
          router.push(`/browse/${titleId}/chapter/${chapterId}`)
        }
        onPrev={() => {
          const visibleChapter =
            loadedChapters[currentVisibleChapterIndex] || currentChapter;
          const visibleIndex = chapters.findIndex(
            (ch) => ch._id === visibleChapter._id
          );
          if (visibleIndex > 0) {
            const prevChapter = chapters[visibleIndex - 1];
            router.push(`/browse/${titleId}/chapter/${prevChapter._id}`);
          }
        }}
        onNext={() => {
          const visibleChapter =
            loadedChapters[currentVisibleChapterIndex] || currentChapter;
          const visibleIndex = chapters.findIndex(
            (ch) => ch._id === visibleChapter._id
          );
          if (visibleIndex < chapters.length - 1) {
            const nextChapter = chapters[visibleIndex + 1];
            router.push(`/browse/${titleId}/chapter/${nextChapter._id}`);
          }
        }}
        canGoPrev={
          (loadedChapters[currentVisibleChapterIndex] || currentChapter) &&
          chapters.findIndex(
            (ch) =>
              ch._id ===
              (loadedChapters[currentVisibleChapterIndex] || currentChapter)._id
          ) > 0
        }
        canGoNext={
          (loadedChapters[currentVisibleChapterIndex] || currentChapter) &&
          chapters.findIndex(
            (ch) =>
              ch._id ===
              (loadedChapters[currentVisibleChapterIndex] || currentChapter)._id
          ) <
            chapters.length - 1
        }
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
                  {loadedChapters[currentVisibleChapterIndex] ? (
                    <>
                      Глава {loadedChapters[currentVisibleChapterIndex].number}{" "}
                      {loadedChapters[currentVisibleChapterIndex].title &&
                        `- ${loadedChapters[currentVisibleChapterIndex].title}`}
                    </>
                  ) : (
                    <>
                      Глава {currentChapter.number}{" "}
                      {currentChapter.title && `- ${currentChapter.title}`}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={
                  loadedChapters[currentVisibleChapterIndex]?._id ||
                  currentChapter._id
                }
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
        {/* Изображения всех загруженных глав с бесконечной прокруткой */}
        <div className="container mx-auto">
          {loadedChapters.map((chapter, chapterIdx) => (
            <div
              key={`${chapter._id}-${chapterIdx}`}
              className="chapter-container"
            >
              {/* Маркер начала главы для IntersectionObserver (кроме первой главы) */}
              {chapterIdx > 0 && (
                <div
                  ref={(el) => {
                    if (el) {
                      chapterMarkerRefs.current.set(chapter._id, el);
                      // Наблюдаем за маркером после добавления в DOM
                      // Используем requestAnimationFrame для надежности
                      requestAnimationFrame(() => {
                        if (chapterEndObserverRef.current && el) {
                          try {
                            chapterEndObserverRef.current.observe(el);
                          } catch (error) {
                            // Маркер уже наблюдается
                            console.debug("Marker already observed:", error);
                          }
                        }
                      });
                    } else {
                      // Удаляем маркер из observer при размонтировании
                      if (chapterMarkerRefs.current.has(chapter._id)) {
                        const marker = chapterMarkerRefs.current.get(
                          chapter._id
                        );
                        if (marker && chapterEndObserverRef.current) {
                          chapterEndObserverRef.current.unobserve(marker);
                        }
                        chapterMarkerRefs.current.delete(chapter._id);
                      }
                    }
                  }}
                  data-chapter-id={chapter._id}
                  className="h-2 w-full"
                  aria-hidden="true"
                />
              )}

              {/* Заголовок главы (только для первой главы или при переходе) */}
              {chapterIdx === 0 || chapterIdx === currentVisibleChapterIndex ? (
                <div className="py-2 text-center border-b border-[var(--border)] mb-2">
                  <h2 className="text-xl font-semibold">
                    Глава {chapter.number}
                    {chapter.title && ` - ${chapter.title}`}
                  </h2>
                </div>
              ) : null}

              {/* Изображения главы */}
              {chapter.images.map((src, imageIndex) => {
                const errorKey = `${chapter._id}-${imageIndex}`;
                const isError = imageLoadErrors.has(errorKey);
                const isFirstChapterFirstImages =
                  chapterIdx === 0 && imageIndex < 3;

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
                          loading={isFirstChapterFirstImages ? "eager" : "lazy"}
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

              {/* Маркер конца главы для предзагрузки следующей главы */}
              {chapterIdx === loadedChapters.length - 1 && (
                <div className="h-20 w-full" aria-hidden="true" />
              )}

              {/* Индикатор загрузки следующей главы */}
              {chapterIdx === loadedChapters.length - 1 && isLoadingNext && (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-2"></div>
                  <p className="text-[var(--muted-foreground)] text-sm">
                    Загрузка следующей главы...
                  </p>
                </div>
              )}

              {/* Футер главы с кнопками навигации */}
              <div className="py-6 border-t border-[var(--border)] mt-8">
                <div className="flex justify-center items-center space-x-4">
                  <button
                    onClick={() => {
                      const visibleChapter =
                        loadedChapters[currentVisibleChapterIndex] ||
                        currentChapter;
                      const visibleIndex = chapters.findIndex(
                        (ch) => ch._id === visibleChapter._id
                      );
                      if (visibleIndex > 0) {
                        const prevChapter = chapters[visibleIndex - 1];
                        router.push(
                          `/browse/${titleId}/chapter/${prevChapter._id}`
                        );
                      }
                    }}
                    disabled={
                      (loadedChapters[currentVisibleChapterIndex] ||
                        currentChapter) &&
                      chapters.findIndex(
                        (ch) =>
                          ch._id ===
                          (
                            loadedChapters[currentVisibleChapterIndex] ||
                            currentChapter
                          )._id
                      ) === 0
                    }
                    className="flex items-center space-x-2 px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <ArrowBigLeft className="w-4 h-4" />
                    <span>Предыдущая глава</span>
                  </button>

                  <button
                    onClick={() => {
                      const visibleChapter =
                        loadedChapters[currentVisibleChapterIndex] ||
                        currentChapter;
                      const visibleIndex = chapters.findIndex(
                        (ch) => ch._id === visibleChapter._id
                      );
                      if (visibleIndex < chapters.length - 1) {
                        const nextChapter = chapters[visibleIndex + 1];
                        router.push(
                          `/browse/${titleId}/chapter/${nextChapter._id}`
                        );
                      }
                    }}
                    disabled={
                      (loadedChapters[currentVisibleChapterIndex] ||
                        currentChapter) &&
                      chapters.findIndex(
                        (ch) =>
                          ch._id ===
                          (
                            loadedChapters[currentVisibleChapterIndex] ||
                            currentChapter
                          )._id
                      ) ===
                        chapters.length - 1
                    }
                    className="flex items-center space-x-2 px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <span>Следующая глава</span>
                    <ArrowBigRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Сообщение о завершении всех глав */}
          {loadedChapters.length > 0 &&
            loadedChapters[loadedChapters.length - 1]._id ===
              chapters[chapters.length - 1]?._id && (
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
