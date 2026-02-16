"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ReportModal } from "@/shared/report/ReportModal";

import { useAuth } from "@/hooks/useAuth";
import { ReaderTitle } from "@/types/title";
import { ReaderChapter } from "@/types/chapter";
import { Chapter } from "@/types/title";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import ReaderControls from "@/shared/reader/ReaderControls";
import NavigationHeader from "@/shared/reader/NavigationHeader";
import { useIncrementChapterViewsMutation, useLazyGetChapterByIdQuery } from "@/store/api/chaptersApi";
import { useReaderSettings } from "@/shared/reader/hooks/useReaderSettings";
import { normalizeAssetUrl } from "@/lib/asset-url";

import {
  saveReadingPosition,
  getReadingPosition,
  createDebouncedSave,
  createScrollDebounce,
  getCurrentPageEnhanced,
  clearOtherChaptersPositions,
} from "@/lib/reading-position";

import AdBlockReading from "@/shared/ad-block/AdBlockReading";
import ChapterErrorState from "@/shared/error-state/ChapterErrorState";
import ReadingPositionRestoreModal from "@/shared/reader/ReadingPositionRestoreModal";

function apiChapterToReaderChapter(ch: Chapter): ReaderChapter {
  const pages = ch.pages || ch.images || [];
  return {
    _id: ch._id,
    number: Number(ch.chapterNumber) || 0,
    title: ch.title || "",
    date: ch.releaseDate || "",
    views: Number(ch.views) || 0,
    images: pages.map((p: string) => normalizeAssetUrl(p)),
  };
}

export default function ReadChapterPage({
  title,
  chapter,
  chapters,
  slug,
}: {
  title: ReaderTitle;
  chapter: ReaderChapter;
  chapters: ReaderChapter[];
  slug?: string;
}) {
  const router = useRouter();

  const { updateChapterViews, addToReadingHistory, isAuthenticated } = useAuth();
  const { readChaptersInRow, readingMode } = useReaderSettings();
  const [fetchChapterById] = useLazyGetChapterByIdQuery();

  const [incrementChapterViews] = useIncrementChapterViewsMutation();

  const titleId = title._id;
  const chapterId = chapter._id;

  // Находим текущую главу и её индекс
  const currentChapterIndex = useMemo(() => {
    const foundIndex = chapters.findIndex(ch => ch._id === chapterId);
    return foundIndex !== -1 ? foundIndex : 0;
  }, [chapters, chapterId]);

  // Состояния
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [, setIsFullscreen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isMobileControlsVisible, setIsMobileControlsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [hideBottomMenuSetting, setHideBottomMenuSetting] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [imageWidth, setImageWidth] = useState(1200);
  const [isPositionRestored, setIsPositionRestored] = useState(false);

  const [savedReadingPage, setSavedReadingPage] = useState<number | null>(null);
  const [savedPositionTimestamp, setSavedPositionTimestamp] = useState<number>(0);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [imageLoadPriority, setImageLoadPriority] = useState<
    Map<number, "low" | "medium" | "high">
  >(new Map());
  const [forceStopAutoScroll, setForceStopAutoScroll] = useState(false);
  const [preloadAllImages, setPreloadAllImages] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const isPagedMode = readingMode === "paged";
  const isChaptersInRowMode = readChaptersInRow && !isPagedMode;

  // Чтение глав подряд: загруженные главы (текущая + подгруженные сверху/снизу)
  const [loadedChapters, setLoadedChapters] = useState<ReaderChapter[]>(() => [chapter]);
  const [firstLoadedIndex, setFirstLoadedIndex] = useState(currentChapterIndex);
  const [lastLoadedIndex, setLastLoadedIndex] = useState(currentChapterIndex);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [visibleChapterId, setVisibleChapterId] = useState<string>(chapterId);
  const chapterSectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const loadingChapterIdsRef = useRef<Set<string>>(new Set());

  // Синхронизируем loadedChapters при смене главы (напр. по URL)
  useEffect(() => {
    setLoadedChapters([chapter]);
    setFirstLoadedIndex(currentChapterIndex);
    setLastLoadedIndex(currentChapterIndex);
    setVisibleChapterId(chapter._id);
  }, [chapter._id, currentChapterIndex]);

  // Сброс флага остановки автопрокрутки через некоторое время после остановки
  useEffect(() => {
    if (forceStopAutoScroll) {
      const timeout = setTimeout(() => {
        setForceStopAutoScroll(false);
      }, 1000); // Сброс через 1 секунду
      return () => clearTimeout(timeout);
    }
  }, [forceStopAutoScroll]);

  // Report state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Определение мобильного устройства
  const [isMobile, setIsMobile] = useState(false);

  // Загрузка ширины изображений из localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem("reader-image-width");
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (width >= 768 && width <= 1440) {
        setImageWidth(width);
      }
    }

    // Загрузка настройки скрытия нижнего меню
    const savedHideBottomMenu = localStorage.getItem("reader-hide-bottom-menu");
    if (savedHideBottomMenu !== null) {
      setHideBottomMenuSetting(savedHideBottomMenu === "true");
    }
  }, []);

  // Сохранение ширины изображений в localStorage
  const handleImageWidthChange = useCallback((width: number) => {
    setImageWidth(width);
    localStorage.setItem("reader-image-width", width.toString());
  }, []);

  // Обработчик изменения настройки скрытия нижнего меню
  const handleHideBottomMenuChange = useCallback((value: boolean) => {
    setHideBottomMenuSetting(value);
    localStorage.setItem("reader-hide-bottom-menu", value.toString());
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Refs для предотвращения повторных вызовов
  const historyAddedRef = useRef<Set<string>>(new Set());
  const viewsUpdatedRef = useRef<Set<string>>(new Set());
  const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Функция для показа меню и сброса таймера скрытия
  const showMenuAndResetTimeout = useCallback(() => {
    setIsMenuCollapsed(false);
    resetHideTimeout();
  }, []);

  // Функция для сброса таймера скрытия меню
  const resetHideTimeout = useCallback(() => {
    if (menuHideTimeoutRef.current) {
      clearTimeout(menuHideTimeoutRef.current);
    }
    if (hideBottomMenuSetting && !isMenuCollapsed) {
      menuHideTimeoutRef.current = setTimeout(() => {
        setIsMenuCollapsed(true);
      }, 5000);
    }
  }, [hideBottomMenuSetting, isMenuCollapsed]);

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
  const imageLoader = useCallback(
    ({ src, width }: { src: string; width: number }) => {
      const imageUrl = getImageUrl(src);
      // Добавляем параметр ширины к URL для оптимизации
      return `${imageUrl}?w=${width}`;
    },
    [getImageUrl],
  );

  // Обновление просмотров и истории чтения
  useEffect(() => {
    if (!title?._id || !chapter?._id) return;

    const chapterKey = `${title._id}-${chapter._id}`;

    // Обновляем просмотры только один раз (для всех пользователей)
    if (!viewsUpdatedRef.current.has(chapterKey)) {
      if (isAuthenticated) {
        // Для авторизованных пользователей используем полную функцию с обновлением в БД
        updateChapterViews(chapter._id, chapter.views || 0)
          .then(() => {
            viewsUpdatedRef.current.add(chapterKey);
          })
          .catch(console.error);
      } else {
        // Для неавторизованных используем специальную функцию увеличения просмотров
        incrementChapterViews(chapter._id)
          .then(() => {
            viewsUpdatedRef.current.add(chapterKey);
          })
          .catch(console.error);
      }
    }

    // Добавляем в историю чтения только для авторизованных пользователей
    if (!isAuthenticated) return;

    if (!historyAddedRef.current.has(chapterKey)) {
      addToReadingHistory(title._id.toString(), chapter._id.toString())
        .then(() => {
          historyAddedRef.current.add(chapterKey);
        })
        .catch(error => {
          console.error("Error adding to reading history:", error);
          // Не перебрасываем ошибку, чтобы избежать бесконечных запросов
        });
    }
  }, [
    chapter._id,
    title._id,
    chapter.views,
    updateChapterViews,
    incrementChapterViews,
    addToReadingHistory,
    isAuthenticated,
  ]);

  // Обработчик ошибок загрузки изображений
  const handleImageError = useCallback((chapterId: string, imageIndex: number) => {
    const errorKey = `${chapterId}-${imageIndex}`;
    setImageLoadErrors(prev => new Set(prev).add(errorKey));
  }, []);

  // Функция для получения корректного пути
  const getChapterPath = useCallback(
    (chapterId: string) => {
      return slug
        ? `/titles/${slug}/chapter/${chapterId}`
        : `/titles/${titleId}/chapter/${chapterId}`;
    },
    [slug, titleId],
  );

  const getTitlePath = useCallback(() => {
    return slug ? `/titles/${slug}` : `/titles/${titleId}`;
  }, [slug, titleId]);

  // Навигация по клавиатуре
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          if (currentChapterIndex > 0) {
            const prevChapter = chapters[currentChapterIndex - 1];
            // Очищаем позиции чтения других глав перед переходом
            clearOtherChaptersPositions(titleId, prevChapter._id);
            router.push(getChapterPath(prevChapter._id));
          }
          break;
        case "ArrowRight":
          if (currentChapterIndex < chapters.length - 1) {
            const nextChapter = chapters[currentChapterIndex + 1];
            // Очищаем позиции чтения других глав перед переходом
            clearOtherChaptersPositions(titleId, nextChapter._id);
            router.push(getChapterPath(nextChapter._id));
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
  }, [currentChapterIndex, chapters, titleId, router, getChapterPath]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Обработчики для мобильных контролов
  const handleMobileTap = () => {
    setIsMobileControlsVisible(true);

    // Отображение нижнего меню при тапе по экрану

    if (hideBottomMenuSetting) {
      showMenuAndResetTimeout();
      // Остановка автопрокрутки при тапе по экрану (только если меню было свернуто)
      if (isMenuCollapsed) {
        setForceStopAutoScroll(true);
      }
    }
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
            // Скрытие нижнего меню при скролле вниз
            if (hideBottomMenuSetting) {
              setIsMenuCollapsed(true);
            }
          } else if (currentScrollY < lastScrollY) {
            setIsHeaderVisible(true);
            // Отображение нижнего меню при скролле вверх
            if (hideBottomMenuSetting) {
              showMenuAndResetTimeout();
            }
            // Сброс флага остановки автопрокрутки при скролле вверх
            setForceStopAutoScroll(false);
          } else if (currentScrollY === lastScrollY) {
            // Сброс флага остановки автопрокрутки при остановке скролла
            setForceStopAutoScroll(false);
          }

          // Проверка достижения максимальной прокрутки
          if (window.innerHeight + currentScrollY >= document.body.offsetHeight - 100) {
            if (hideBottomMenuSetting) {
              setIsMenuCollapsed(true);
            }
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
  }, [lastScrollY, hideBottomMenuSetting, showMenuAndResetTimeout]);

  // Загрузка настройки предзагрузки из localStorage
  useEffect(() => {
    const savedPreload = localStorage.getItem("reader-preload-all-images");
    if (savedPreload === "true") {
      setPreloadAllImages(true);
    }
  }, []);

  // Функция восстановления позиции
  const restorePosition = useCallback((page: number) => {
    setSavedReadingPage(page);

    const timeoutId = setTimeout(async () => {
      try {
        const pageElement = document.querySelector(`[data-page="${page}"]`);
        if (pageElement) {
          pageElement.scrollIntoView({
            behavior: "auto",
            block: "center",
          });
        }
        setCurrentPage(page);

        // Устанавливаем приоритеты загрузки изображений
        const priorities = new Map<number, "low" | "medium" | "high">();
        chapter.images.forEach((_, index) => {
          const pageNum = index + 1;
          if (pageNum === page) {
            priorities.set(pageNum, "high");
          } else if (Math.abs(pageNum - page) <= 2) {
            priorities.set(pageNum, "medium");
          } else {
            priorities.set(pageNum, "low");
          }
        });
        setImageLoadPriority(priorities);

        setIsPositionRestored(true);
      } catch (error) {
        console.warn("Failed to restore reading position:", error);
        setCurrentPage(1);
        setIsPositionRestored(true);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [chapter.images]);

  // Функция сброса позиции (начать сначала)
  const resetPosition = useCallback(() => {
    setSavedReadingPage(1);
    setCurrentPage(1);
    setIsPositionRestored(true);
    
    // Устанавливаем низкий приоритет для всех, кроме первых 3 страниц
    const priorities = new Map<number, "low" | "medium" | "high">();
    chapter.images.forEach((_, index) => {
      const pageNum = index + 1;
      if (pageNum <= 3) {
        priorities.set(pageNum, "high");
      } else {
        priorities.set(pageNum, "low");
      }
    });
    setImageLoadPriority(priorities);
  }, [chapter.images]);

  // Восстановление позиции чтения при загрузке компонента
  useEffect(() => {
    if (!titleId || !chapterId) return;

    const savedPosition = getReadingPosition(titleId, chapterId);
    if (savedPosition && savedPosition.page > 1) {
      setSavedReadingPage(savedPosition.page);
      setSavedPositionTimestamp(savedPosition.timestamp);
      setIsRestoreModalOpen(true);
    } else {
      setIsPositionRestored(true);
    }
  }, [titleId, chapterId]);

  // Предзагрузка всех изображений при включенной настройке
  useEffect(() => {
    if (!preloadAllImages || !chapter.images.length || !isPositionRestored) return;

    let loadedCount = 0;
    const totalImages = chapter.images.length;

    const updateProgress = () => {
      loadedCount++;
      setPreloadProgress(Math.round((loadedCount / totalImages) * 100));
    };

    // Предзагружаем все изображения
    chapter.images.forEach((src) => {
      const img = new window.Image();
      img.onload = updateProgress;
      img.onerror = updateProgress;
      img.src = getImageUrl(src);
    });

    // Устанавливаем высокий приоритет для всех страниц
    const priorities = new Map<number, "low" | "medium" | "high">();
    chapter.images.forEach((_, index) => {
      priorities.set(index + 1, "high");
    });
    setImageLoadPriority(priorities);
  }, [preloadAllImages, chapter.images, isPositionRestored, getImageUrl]);

  // Создание дебаунс-функции для сохранения позиции
  const debouncedSavePosition = useMemo(
    () =>
      createDebouncedSave((page: number) => {
        saveReadingPosition(titleId, chapterId, page);
      }, 1000),
    [titleId, chapterId],
  );

  // Отслеживание текущей страницы с помощью улучшенного алгоритма
  useEffect(() => {
    if (isPagedMode) {
      return;
    }

    const updateCurrentPage = () => {
      // Не обновляем страницу сразу после восстановления позиции
      if (!isPositionRestored) {
        return;
      }

      const currentPageNum = getCurrentPageEnhanced();
      setCurrentPage(currentPageNum);

      // Сохраняем позицию с debounce, только если страница больше 1
      if (currentPageNum > 1) {
        debouncedSavePosition(currentPageNum);
      }

      // Обновляем приоритеты загрузки для новой текущей страницы
      if (savedReadingPage && currentPageNum !== savedReadingPage) {
        const priorities = new Map<number, "low" | "medium" | "high">();
        chapter.images.forEach((_, index) => {
          const pageNum = index + 1;
          if (pageNum === currentPageNum) {
            priorities.set(pageNum, "high"); // Текущая страница - высокий приоритет
          } else if (pageNum === savedReadingPage || Math.abs(pageNum - currentPageNum) <= 2) {
            priorities.set(pageNum, "medium"); // Недавно просмотренные страницы - средний приоритет
          } else {
            priorities.set(pageNum, "low"); // Остальные - низкий приоритет
          }
        });
        setImageLoadPriority(priorities);
      }
    };

    // Обновляем сразу при загрузке, если позиция уже восстановлена
    if (isPositionRestored) {
      updateCurrentPage();
    }

    // Создаем debounced scroll handler
    const debouncedScrollHandler = createScrollDebounce(updateCurrentPage, 150);

    window.addEventListener("scroll", debouncedScrollHandler, {
      passive: true,
    });

    // Также обновляем при изменении размера окна
    window.addEventListener("resize", updateCurrentPage, { passive: true });

    return () => {
      window.removeEventListener("scroll", debouncedScrollHandler);
      window.removeEventListener("resize", updateCurrentPage);
    };
  }, [chapter.images, debouncedSavePosition, isPositionRestored, savedReadingPage, isPagedMode]);

  // В постраничном режиме сохраняем текущую страницу при каждом переходе
  useEffect(() => {
    if (!isPagedMode || !isPositionRestored) return;
    if (currentPage > 1) {
      debouncedSavePosition(currentPage);
    }
  }, [isPagedMode, isPositionRestored, currentPage, debouncedSavePosition]);

  // Подгрузка предыдущей/следующей главы при чтении подряд
  const loadPrevChapter = useCallback(async () => {
    if (!isChaptersInRowMode || firstLoadedIndex <= 0 || loadingPrev) return;
    const prevId = chapters[firstLoadedIndex - 1]?._id;
    if (!prevId || loadingChapterIdsRef.current.has(prevId)) return;
    loadingChapterIdsRef.current.add(prevId);
    setLoadingPrev(true);
    try {
      const result = await fetchChapterById(prevId).unwrap();
      const readerCh = apiChapterToReaderChapter(result);
      setLoadedChapters(prev => [readerCh, ...prev]);
      setFirstLoadedIndex(i => i - 1);
      // Сохраняем позицию прокрутки: после вставки сверху контент сдвигается вниз
      requestAnimationFrame(() => {
        const el = chapterSectionRefs.current.get(prevId);
        if (el) window.scrollBy(0, el.getBoundingClientRect().height + 24);
      });
    } finally {
      setLoadingPrev(false);
      loadingChapterIdsRef.current.delete(prevId);
    }
  }, [isChaptersInRowMode, firstLoadedIndex, loadingPrev, chapters, fetchChapterById]);

  const loadNextChapter = useCallback(async () => {
    if (!isChaptersInRowMode || lastLoadedIndex >= chapters.length - 1 || loadingNext) return;
    const nextId = chapters[lastLoadedIndex + 1]?._id;
    if (!nextId || loadingChapterIdsRef.current.has(nextId)) return;
    loadingChapterIdsRef.current.add(nextId);
    setLoadingNext(true);
    try {
      const result = await fetchChapterById(nextId).unwrap();
      const readerCh = apiChapterToReaderChapter(result);
      setLoadedChapters(prev => [...prev, readerCh]);
      setLastLoadedIndex(i => i + 1);
    } finally {
      setLoadingNext(false);
      loadingChapterIdsRef.current.delete(nextId);
    }
  }, [isChaptersInRowMode, lastLoadedIndex, chapters.length, loadingNext, chapters, fetchChapterById]);

  useEffect(() => {
    if (!isChaptersInRowMode) return;
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const winH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      if (scrollTop < 300) loadPrevChapter();
      if (docH - scrollTop - winH < 400) loadNextChapter();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isChaptersInRowMode, loadPrevChapter, loadNextChapter]);

  // Обновление URL при смене видимой главы (чтение подряд)
  useEffect(() => {
    if (!isChaptersInRowMode || loadedChapters.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length === 0) return;
        const byRatio = visible.sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
        const id = byRatio[0]?.target.getAttribute("data-chapter-id");
        if (id && id !== visibleChapterId) {
          setVisibleChapterId(id);
          const path = slug ? `/titles/${slug}/chapter/${id}` : `/titles/${titleId}/chapter/${id}`;
          window.history.replaceState(null, "", path);
        }
      },
      { root: null, rootMargin: "0px", threshold: [0.1, 0.2, 0.5, 0.8] },
    );
    chapterSectionRefs.current.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [isChaptersInRowMode, loadedChapters.length, visibleChapterId, slug, titleId]);

  const loading = !chapter;

  // В режиме «главы подряд» текущая для хедера/контролов — видимая глава
  const effectiveChapter = isChaptersInRowMode
    ? (loadedChapters.find(c => c._id === visibleChapterId) ?? chapter)
    : chapter;
  const pagedImageIndex = Math.min(
    Math.max(currentPage - 1, 0),
    Math.max(chapter.images.length - 1, 0),
  );

  useEffect(() => {
    if (!isPagedMode) return;
    if (currentPage > chapter.images.length && chapter.images.length > 0) {
      setCurrentPage(chapter.images.length);
    }
  }, [isPagedMode, currentPage, chapter.images.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <p className="text-[var(--foreground)]">Загрузка главы...</p>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <ChapterErrorState
        title="Глава не найдена"
        message="Попробуйте обновить страницу или выбрать другую главу"
        slug={slug}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Модальное окно восстановления позиции */}
      <ReadingPositionRestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onRestore={() => restorePosition(savedReadingPage || 1)}
        onReset={resetPosition}
        page={savedReadingPage || 1}
        timestamp={savedPositionTimestamp}
        totalPages={chapter.images.length}
      />

      {/* Индикатор предзагрузки */}
      {preloadAllImages && preloadProgress < 100 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] bg-[var(--card)]/95 backdrop-blur-md border border-[var(--border)] rounded-full px-4 py-2 shadow-lg flex items-center gap-3">
          <div className="w-32 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
              style={{ width: `${preloadProgress}%` }}
            />
          </div>
          <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
            Загрузка {preloadProgress}%
          </span>
        </div>
      )}

      {/* Меню управления */}
      <ReaderControls
        key={effectiveChapter._id}
        currentChapter={effectiveChapter}
        currentPage={currentPage}
        chapterImageLength={effectiveChapter.images.length}
        chapters={chapters}
        onChapterSelect={chapterId => router.push(getChapterPath(chapterId))}
        onPrev={() => {
          if (currentChapterIndex > 0) {
            const prevChapter = chapters[currentChapterIndex - 1];
            // Очищаем позиции чтения других глав перед переходом
            clearOtherChaptersPositions(titleId, prevChapter._id);
            router.push(getChapterPath(prevChapter._id));
          }
        }}
        onNext={() => {
          if (currentChapterIndex < chapters.length - 1) {
            const nextChapter = chapters[currentChapterIndex + 1];
            // Очищаем позиции чтения других глав перед переходом
            clearOtherChaptersPositions(titleId, nextChapter._id);
            router.push(getChapterPath(nextChapter._id));
          }
        }}
        canGoPrev={currentChapterIndex > 0}
        canGoNext={currentChapterIndex < chapters.length - 1}
        titleId={titleId}
        creatorId={title.creatorId}
        imageWidth={imageWidth}
        onImageWidthChange={handleImageWidthChange}
        isMenuHidden={isMenuCollapsed}
        hideBottomMenuSetting={hideBottomMenuSetting}
        onHideBottomMenuChange={handleHideBottomMenuChange}
        onToggleMenu={() => setIsMenuCollapsed(false)}
        forceStopAutoScroll={forceStopAutoScroll}
        onMenuOpen={() => setForceStopAutoScroll(true)}
        onAutoScrollStart={() => {
          setIsMenuCollapsed(false);
        }}
        preloadAllImages={preloadAllImages}
        onPreloadChange={(value) => {
          setPreloadAllImages(value);
          localStorage.setItem("reader-preload-all-images", value.toString());
        }}
        preloadProgress={preloadProgress}
        onJumpToPage={(page) => {
          if (isPagedMode) {
            setCurrentPage(page);
            return;
          }
          const pageElement = document.querySelector(`[data-page="${page}"]`);
          if (pageElement) {
            pageElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
          setCurrentPage(page);
        }}
      />

      {/* Хедер */}
      <NavigationHeader
        title={title}
        chapter={effectiveChapter}
        currentImageIndex={currentPage - 1}
        showControls={isHeaderVisible}
        onImageIndexChange={() => {}}
        imagesCount={effectiveChapter.images.length}
        onReportError={() => setIsReportModalOpen(true)}
        onChapterMenuOpen={() => {
          // Открываем меню выбора главы через ReaderControls
          const event = new CustomEvent('openChapterMenu');
          window.dispatchEvent(event);
        }}
        onPrevChapter={() => {
          if (currentChapterIndex > 0) {
            const prevChapter = chapters[currentChapterIndex - 1];
            clearOtherChaptersPositions(titleId, prevChapter._id);
            router.push(getChapterPath(prevChapter._id));
          }
        }}
        onNextChapter={() => {
          if (currentChapterIndex < chapters.length - 1) {
            const nextChapter = chapters[currentChapterIndex + 1];
            clearOtherChaptersPositions(titleId, nextChapter._id);
            router.push(getChapterPath(nextChapter._id));
          }
        }}
        canGoPrev={currentChapterIndex > 0}
        canGoNext={currentChapterIndex < chapters.length - 1}
      />

      {/* Основной контент */}
      <main
        className={`pt-20 sm:pt-16 ${isMenuCollapsed ? "pb-0" : "pb-16"}`}
        onClick={handleMobileTap}
      >
        <div className="container mx-auto">
          {isChaptersInRowMode ? (
            <>
              {loadingPrev && (
                <div className="py-8 text-center text-[var(--muted-foreground)]">
                  Загрузка предыдущей главы…
                </div>
              )}
              {loadedChapters.map(ch => (
                <div
                  key={ch._id}
                  ref={el => {
                    if (el) chapterSectionRefs.current.set(ch._id, el);
                  }}
                  data-chapter-id={ch._id}
                  className="chapter-container"
                >
                  <div className="py-3 sm:py-2 text-center border-b border-[var(--border)] mb-3 sm:mb-2 px-4 sm:px-0">
                    <h2 className="text-lg sm:text-xl font-semibold leading-tight">
                      Глава {ch.number}
                      {ch.title && ` - ${ch.title}`}
                    </h2>
                  </div>
                  {ch.images.map((src, imageIndex) => {
                    const errorKey = `${ch._id}-${imageIndex}`;
                    const isError = imageLoadErrors.has(errorKey);
                    const imageUrl = getImageUrl(src);
                    return (
                      <div key={`${ch._id}-${imageIndex}`} className="flex justify-center">
                        <div
                          className="relative w-full flex justify-center px-0 sm:px-4"
                          data-page={imageIndex + 1}
                          style={{
                            maxWidth: isMobile ? "100%" : `${imageWidth}px`,
                          }}
                        >
                          {!isError ? (
                            <Image
                              key={`${ch._id}-${imageIndex}-${imageWidth}`}
                              loader={imageLoader}
                              src={src}
                              alt={`Глава ${ch.number}, Страница ${imageIndex + 1}`}
                              width={isMobile ? 800 : imageWidth}
                              height={isMobile ? 1200 : Math.round((imageWidth * 1600) / 1200)}
                              className="w-full h-auto shadow-lg sm:shadow-2xl"
                              quality={85}
                              loading={imageIndex < (isMobile ? 6 : 3) ? "eager" : "lazy"}
                              onError={() => handleImageError(ch._id, imageIndex)}
                              priority={imageIndex < (isMobile ? 3 : 1)}
                            />
                          ) : (
                            <div className="w-full min-h-[200px] sm:h-64 bg-[var(--card)] flex items-center justify-center px-4">
                              <div className="text-center">
                                <div className="text-[var(--destructive)] mb-3 text-sm sm:text-base">
                                  Ошибка загрузки изображения
                                </div>
                                <button
                                  onClick={() => {
                                    setImageLoadErrors(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(errorKey);
                                      return newSet;
                                    });
                                  }}
                                  className="px-4 py-3 sm:py-2 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/80 rounded-lg sm:rounded transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation"
                                >
                                  Повторить загрузку
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {ch._id === loadedChapters[loadedChapters.length - 1]?._id && <AdBlockReading />}
                </div>
              ))}
              {loadingNext && (
                <div className="py-8 text-center text-[var(--muted-foreground)]">
                  Загрузка следующей главы…
                </div>
              )}
            </>
          ) : (
          <>
          <div className=" chapter-container">
            {/* Заголовок главы */}
            <div className="py-3 sm:py-2 text-center border-b border-[var(--border)] mb-3 sm:mb-2 px-4 sm:px-0">
              <h2 className="text-lg sm:text-xl font-semibold leading-tight">
                Глава {chapter.number}
                {chapter.title && ` - ${chapter.title}`}
              </h2>
            </div>

            {/* Изображения главы */}
            {isPagedMode ? (
              <>
                <div className="py-3 sm:py-2 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--muted)]/60 text-sm text-[var(--muted-foreground)]">
                    Страница <span className="font-semibold text-[var(--foreground)]">{currentPage}</span> / {chapter.images.length}
                  </div>
                </div>
                {chapter.images[pagedImageIndex] && (() => {
                  const imageIndex = pagedImageIndex;
                  const src = chapter.images[imageIndex];
                  const errorKey = `${chapter._id}-${imageIndex}`;
                  const isError = imageLoadErrors.has(errorKey);
                  const imageUrl = getImageUrl(src);

                  return (
                    <div key={`${chapter._id}-${imageIndex}`} className="flex justify-center">
                      <div
                        className="relative w-full flex justify-center px-0 sm:px-4"
                        data-page={imageIndex + 1}
                        style={{
                          maxWidth: isMobile ? "100%" : `${imageWidth}px`,
                        }}
                      >
                        {!isError ? (
                          <Image
                            key={`${chapter._id}-${imageIndex}-${imageWidth}`}
                            loader={imageLoader}
                            src={src}
                            alt={`Глава ${chapter.number}, Страница ${imageIndex + 1}`}
                            width={isMobile ? 800 : imageWidth}
                            height={isMobile ? 1200 : Math.round((imageWidth * 1600) / 1200)}
                            className="w-full h-auto shadow-lg sm:shadow-2xl"
                            quality={85}
                            loading="eager"
                            onError={() => handleImageError(chapter._id, imageIndex)}
                            priority
                          />
                        ) : (
                          <div className="w-full min-h-[200px] sm:h-64 bg-[var(--card)] flex items-center justify-center px-4">
                            <div className="text-center">
                              <div className="text-[var(--destructive)] mb-3 text-sm sm:text-base">
                                Ошибка загрузки изображения
                              </div>
                              <button
                                onClick={() => {
                                  setImageLoadErrors(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(errorKey);
                                    return newSet;
                                  });
                                }}
                                className="px-4 py-3 sm:py-2 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/80 rounded-lg sm:rounded transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation"
                              >
                                Повторить загрузку
                              </button>
                              <div className="mt-3 text-xs sm:text-sm text-[var(--muted-foreground)] break-all max-w-[280px] sm:max-w-md">
                                URL: {imageUrl}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <div className="py-5 sm:py-6 px-4 sm:px-0">
                  <div className="flex items-center justify-center gap-3 max-w-xl mx-auto">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1}
                      className="group flex cursor-pointer items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 text-sm font-medium min-h-[48px] touch-manipulation active:scale-95"
                    >
                      <ArrowBigLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                      <span>Предыдущая страница</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(chapter.images.length, prev + 1))}
                      disabled={currentPage >= chapter.images.length}
                      className="group flex cursor-pointer items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 text-sm font-medium min-h-[48px] touch-manipulation active:scale-95"
                    >
                      <span>Следующая страница</span>
                      <ArrowBigRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              chapter.images.map((src, imageIndex) => {
                const errorKey = `${chapter._id}-${imageIndex}`;
                const isError = imageLoadErrors.has(errorKey);
                const imageUrl = getImageUrl(src);

                return (
                  <div key={`${chapter._id}-${imageIndex}`} className="flex justify-center">
                    <div
                      className="relative w-full flex justify-center px-0 sm:px-4"
                      data-page={imageIndex + 1}
                      style={{
                        maxWidth: isMobile ? "100%" : `${imageWidth}px`,
                      }}
                    >
                      {!isError ? (
                        <Image
                          key={`${chapter._id}-${imageIndex}-${imageWidth}`}
                          loader={imageLoader}
                          src={src}
                          alt={`Глава ${chapter.number}, Страница ${imageIndex + 1}`}
                          width={isMobile ? 800 : imageWidth}
                          height={isMobile ? 1200 : Math.round((imageWidth * 1600) / 1200)}
                          className="w-full h-auto shadow-lg sm:shadow-2xl"
                          quality={
                            imageLoadPriority.size > 0
                              ? (() => {
                                  const priority = imageLoadPriority.get(imageIndex + 1);
                                  switch (priority) {
                                    case "high":
                                      return 85;
                                    case "medium":
                                      return 70;
                                    case "low":
                                      return 60;
                                    default:
                                      return 85;
                                  }
                                })()
                              : 85
                          }
                          loading={
                            imageLoadPriority.size > 0
                              ? imageLoadPriority.get(imageIndex + 1) === "high"
                                ? "eager"
                                : "lazy"
                              : imageIndex < (isMobile ? 6 : 3)
                                ? "eager"
                                : "lazy"
                          }
                          onError={() => handleImageError(chapter._id, imageIndex)}
                          priority={
                            imageLoadPriority.size > 0
                              ? imageLoadPriority.get(imageIndex + 1) === "high"
                              : imageIndex < (isMobile ? 3 : 1)
                          }
                        />
                      ) : (
                        <div className="w-full min-h-[200px] sm:h-64 bg-[var(--card)] flex items-center justify-center px-4">
                          <div className="text-center">
                            <div className="text-[var(--destructive)] mb-3 text-sm sm:text-base">
                              Ошибка загрузки изображения
                            </div>
                            <button
                              onClick={() => {
                                setImageLoadErrors(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(errorKey);
                                  return newSet;
                                });
                              }}
                              className="px-4 py-3 sm:py-2 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/80 rounded-lg sm:rounded transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation"
                            >
                              Повторить загрузку
                            </button>
                            <div className="mt-3 text-xs sm:text-sm text-[var(--muted-foreground)] break-all max-w-[280px] sm:max-w-md">
                              URL: {imageUrl}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Рекламный блок */}
            <AdBlockReading />

            {/* Футер главы с кнопками навигации */}
            <div className="py-8 sm:py-12 border-t border-[var(--border)] mt-8 sm:mt-10 px-4 sm:px-0">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 max-w-2xl mx-auto">
                <button
                  onClick={() => {
                    if (currentChapterIndex > 0) {
                      const prevChapter = chapters[currentChapterIndex - 1];
                      // Очищаем позиции чтения других глав перед переходом
                      clearOtherChaptersPositions(titleId, prevChapter._id);
                      router.push(getChapterPath(prevChapter._id));
                    }
                  }}
                  disabled={currentChapterIndex === 0}
                  className="group flex cursor-pointer items-center justify-center gap-3 w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-4 bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--secondary)] rounded-2xl sm:rounded-xl transition-all duration-200 text-sm sm:text-base font-medium min-h-[56px] sm:min-h-[52px] touch-manipulation active:scale-95 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <ArrowBigLeft className="w-6 h-6 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1" />
                  <span>Предыдущая глава</span>
                </button>

                {/* Индикатор текущей главы для десктопа */}
                <div className="hidden sm:flex items-center px-4 py-2 bg-[var(--muted)]/50 rounded-full text-sm text-[var(--muted-foreground)]">
                  <span className="font-medium text-[var(--foreground)]">{chapter.number}</span>
                  <span className="mx-2">/</span>
                  <span>{chapters.length}</span>
                </div>


                <button
                  onClick={() => {
                    if (currentChapterIndex < chapters.length - 1) {
                      const nextChapter = chapters[currentChapterIndex + 1];
                      // Очищаем позиции чтения других глав перед переходом
                      clearOtherChaptersPositions(titleId, nextChapter._id);
                      router.push(getChapterPath(nextChapter._id));
                    }
                  }}
                  disabled={currentChapterIndex === chapters.length - 1}
                  className="group flex cursor-pointer items-center justify-center gap-3 w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-4 bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--secondary)] rounded-2xl sm:rounded-xl transition-all duration-200 text-sm sm:text-base font-medium min-h-[56px] sm:min-h-[52px] touch-manipulation active:scale-95 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span>Следующая глава</span>
                  <ArrowBigRight className="w-6 h-6 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Сообщение о завершении всех глав */}
          {currentChapterIndex === chapters.length - 1 && (
            <div className="py-6 sm:py-8 text-center border-t border-[var(--border)] mt-6 sm:mt-8 px-4 sm:px-0">
              <p className="text-base sm:text-lg font-semibold mb-4">Вы дочитали до конца!</p>

              <button
                onClick={() => router.push(getTitlePath())}
                className="w-full sm:w-auto px-6 py-4 sm:py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/80 rounded-xl sm:rounded-lg transition-colors text-sm sm:text-base min-h-[48px] touch-manipulation active:scale-95"
              >
                Вернуться к тайтлу
              </button>
            </div>
          )}
          </>
          )}
        </div>
      </main>

      {/* Футер */}
      {/* <footer className="bg-[var(--card)] border-t border-[var(--border)] py-4 sm:py-6">
        <div className="container mx-auto px-4 text-center text-[var(--muted-foreground)] text-xs sm:text-sm">
          <p className="hidden md:block">Используйте ← → для навигации между главами</p>
          <p className="md:hidden">Свайпайте влево/вправо или используйте кнопки для навигации</p>
        </div>
      </footer> */}

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        entityType="chapter"
        entityId={effectiveChapter._id}
        entityTitle={`Глава ${effectiveChapter.number}${effectiveChapter.title ? ` - ${effectiveChapter.title}` : ""}`}
        titleId={title._id}
        creatorId={title.creatorId}
      />
    </div>
  );
}
