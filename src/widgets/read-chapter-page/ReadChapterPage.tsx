"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ReportModal } from "@/shared/report/ReportModal";

import { useAuth } from "@/hooks/useAuth";
import { useIntersectionTrigger } from "@/hooks/useIntersectionTrigger";
import { ReaderTitle } from "@/types/title";
import { ReaderChapter } from "@/types/chapter";
import { Chapter } from "@/types/title";
import { ArrowBigLeft, ArrowBigRight, ChevronUp, Keyboard, ZoomIn } from "lucide-react";
import ReaderControls from "@/shared/reader/ReaderControls";
import NavigationHeader from "@/shared/reader/NavigationHeader";
import {
  useIncrementChapterViewsMutation,
  useLazyGetChapterByIdQuery,
} from "@/store/api/chaptersApi";
import {
  useReaderSettingsContext,
  ReaderSettingsProvider,
} from "@/shared/reader/hooks/useReaderSettings";
import { getImageUrls } from "@/lib/asset-url";

import {
  saveReadingPosition,
  getReadingPosition,
  createDebouncedSave,
  createScrollDebounce,
  getCurrentPageEnhanced,
  clearOtherChaptersPositions,
} from "@/lib/reading-position";

import ChapterErrorState from "@/shared/error-state/ChapterErrorState";
import ChapterNoPagesState from "@/shared/error-state/ChapterNoPagesState";
import ReadingPositionRestoreModal from "@/shared/reader/ReadingPositionRestoreModal";
import { ChapterCommentsSection } from "@/shared/reader/ChapterCommentsSection";
import { ChapterTranslatorInfo } from "@/shared/reader/ChapterTranslatorInfo";
import { ChapterReactions } from "@/shared/reader/ChapterReactions";

function apiChapterToReaderChapter(ch: Chapter): ReaderChapter {
  const pages = ch.pages || ch.images || [];
  return {
    _id: ch._id,
    number: Number(ch.chapterNumber) || 0,
    title: ch.title || "",
    date: ch.releaseDate || "",
    views: Number(ch.views) || 0,
    images: pages.map((p: string) => getImageUrls(p).primary),
    averageRating: ch.averageRating,
    ratingSum: ch.ratingSum,
    ratingCount: ch.ratingCount,
    userRating: ch.userRating,
    reactions: ch.reactions,
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
  return (
    <ReaderSettingsProvider>
      <ReadChapterPageContent title={title} chapter={chapter} chapters={chapters} slug={slug} />
    </ReaderSettingsProvider>
  );
}

function ReadChapterPageContent({
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
  const {
    readChaptersInRow,
    readingMode,
    pageGap,
    brightness,
    contrast,
    eyeComfortMode,
    fitMode,
    infiniteScroll,
    showHints,
    showProgress,
    getQualityValue,
    hapticEnabled,
  } = useReaderSettingsContext();

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [hapticEnabled]);

  const imageQuality = getQualityValue();
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
  const [imageFallbacks, setImageFallbacks] = useState<Set<string>>(new Set());
  const [, setIsFullscreen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  // По умолчанию мобильное нижнее меню показывается (false = не скрывать)
  const [hideBottomMenuSetting, setHideBottomMenuSetting] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [imageWidth, setImageWidth] = useState(768);
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
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{ src: string; alt: string } | null>(null);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [totalContentHeight, setTotalContentHeight] = useState(0);
  const isPagedMode = readingMode === "paged";
  const isChaptersInRowMode = readChaptersInRow && !isPagedMode;

  // Бесконечное чтение
  const [isLoadingNextChapter, setIsLoadingNextChapter] = useState(false);
  const loadedChapterIdsRef = useRef<Set<string>>(new Set([chapter._id]));
  const [loadedChapterIds, setLoadedChapterIds] = useState<Set<string>>(new Set([chapter._id]));
  void loadedChapterIds;

  // Чтение глав подряд: загруженные главы (текущая + подгруженные сверху/снизу)
  const [loadedChapters, setLoadedChapters] = useState<ReaderChapter[]>(() => [chapter]);

  const loadNextChapterInfiniteScroll = useCallback(() => {
    if (loadedChapters.length === 0) return;
    const lastLoadedChapter = loadedChapters[loadedChapters.length - 1];
    const lastChapterIndex = chapters.findIndex(ch => ch._id === lastLoadedChapter._id);
    if (lastChapterIndex < 0 || lastChapterIndex >= chapters.length - 1) return;
    const nextChapter = chapters[lastChapterIndex + 1];
    if (loadedChapterIdsRef.current.has(nextChapter._id)) return;
    loadedChapterIdsRef.current.add(nextChapter._id);
    setIsLoadingNextChapter(true);
    fetchChapterById(nextChapter._id)
      .unwrap()
      .then(chapterData => {
        if (chapterData && chapterData._id) {
          const apiData = chapterData as Chapter & {
            images?: string[];
            title?: string;
            teamId?: string;
            translatorTeamId?: string;
          };
          const rawPages = apiData.images || apiData.pages || [];
          const chapterImages = rawPages.map((p: string) => getImageUrls(p).primary);
          const chapterNumber = apiData.chapterNumber ?? 0;
          const mappedChapter: ReaderChapter = {
            _id: apiData._id,
            number: typeof chapterNumber === "string" ? parseFloat(chapterNumber) : chapterNumber,
            title: apiData.title || apiData.name || "",
            images: chapterImages,
            views: typeof apiData.views === "string" ? parseInt(apiData.views) : apiData.views || 0,
            createdAt: apiData.createdAt,
            updatedAt: apiData.updatedAt,
            teamId: apiData.teamId || apiData.translatorTeamId,
          };
          setLoadedChapters(prev => [...prev, mappedChapter]);
          setLoadedChapterIds(prev => new Set([...prev, mappedChapter._id]));
          if (isAuthenticated) {
            const key = `${titleId}-${mappedChapter._id}`;
            if (!historyAddedRef.current.has(key) && !historyPendingRef.current.has(key)) {
              historyPendingRef.current.add(key);
              addToReadingHistory(titleId, mappedChapter._id)
                .then(() => {
                  historyAddedRef.current.add(key);
                  historyPendingRef.current.delete(key);
                })
                .catch(() => historyPendingRef.current.delete(key));
            }
          }
        }
      })
      .catch(() => {
        loadedChapterIdsRef.current.delete(nextChapter._id);
      })
      .finally(() => {
        setIsLoadingNextChapter(false);
      });
  }, [loadedChapters, chapters, fetchChapterById, isAuthenticated, addToReadingHistory, titleId]);

  const infiniteScrollTriggerRef = useIntersectionTrigger(loadNextChapterInfiniteScroll, {
    enabled: Boolean(infiniteScroll && !isPagedMode && !isLoadingNextChapter),
    rootMargin: "300px",
    threshold: 0,
  });

  const calculateReadingTime = useCallback((imagesCount: number, contentHeight?: number) => {
    const pixelsPerSecond = 120;

    if (contentHeight && contentHeight > 0) {
      const totalSeconds = contentHeight / pixelsPerSecond;
      return Math.max(1, Math.ceil(totalSeconds / 60));
    }

    const avgPageHeight = 1400;
    const estimatedHeight = imagesCount * avgPageHeight;
    const totalSeconds = estimatedHeight / pixelsPerSecond;
    return Math.max(1, Math.ceil(totalSeconds / 60));
  }, []);

  // Чтение глав подряд: дополнительные состояния
  const [firstLoadedIndex, setFirstLoadedIndex] = useState(currentChapterIndex);
  const [lastLoadedIndex, setLastLoadedIndex] = useState(currentChapterIndex);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [visibleChapterId, setVisibleChapterId] = useState<string>(chapterId);
  const activeReadingChapterId =
    isChaptersInRowMode || infiniteScroll ? visibleChapterId : chapterId;
  const chapterSectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const firstChapterContainerRef = useRef<HTMLDivElement | null>(null);
  const loadingChapterIdsRef = useRef<Set<string>>(new Set());
  // Последовательное отображение картинок в режиме «главы подряд»: показываем только когда все предыдущие в главе загружены
  const [loadedImagesByChapter, setLoadedImagesByChapter] = useState<Record<string, Set<number>>>(
    {},
  );
  // Ref: загруженные картинки (chapterId-imageIndex), чтобы при ре-рендере не мигали уже загруженные
  const loadedImagesRef = useRef<Set<string>>(new Set());

  // Синхронизируем loadedChapters при смене главы (напр. по URL)
  useEffect(() => {
    setLoadedChapters([chapter]);
    setFirstLoadedIndex(currentChapterIndex);
    setLastLoadedIndex(currentChapterIndex);
    setVisibleChapterId(chapter._id);
    setLoadedImagesByChapter({});
    loadedImagesRef.current = new Set();
    const newSet = new Set([chapter._id]);
    setLoadedChapterIds(newSet);
    loadedChapterIdsRef.current = newSet;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const historyPendingRef = useRef<Set<string>>(new Set());
  const historyRetryAttemptedRef = useRef<Set<string>>(new Set());
  const viewsUpdatedRef = useRef<Set<string>>(new Set());
  const menuHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Функция для показа меню и сброса таймера скрытия
  const showMenuAndResetTimeout = useCallback(() => {
    setIsMenuCollapsed(false);
    resetHideTimeout();
  }, [resetHideTimeout]);

  // Очистка таймера скрытия меню при размонтировании (избегаем setState после unmount)
  useEffect(() => {
    return () => {
      if (menuHideTimeoutRef.current) {
        clearTimeout(menuHideTimeoutRef.current);
        menuHideTimeoutRef.current = null;
      }
    };
  }, []);

  // Функция для получения корректного URL изображения с учётом fallback
  const getImageUrlWithFallback = useCallback(
    (url: string, chapterId: string, imageIndex: number) => {
      if (!url) return "";

      const errorKey = `${chapterId}-${imageIndex}`;
      const { primary, fallback } = getImageUrls(url);

      // Если для этого изображения уже был переключен на fallback
      if (imageFallbacks.has(errorKey) && fallback && fallback !== primary) {
        return fallback;
      }

      return primary;
    },
    [imageFallbacks],
  );

  // Функция для получения корректного URL изображения (legacy)
  const getImageUrl = useCallback((url: string) => {
    if (!url) return "";
    return getImageUrls(url).primary;
  }, []);

  // CSS фильтры для изображений (яркость, контраст, режим защиты глаз)
  const imageFilterStyle = useMemo((): React.CSSProperties => {
    const filters: string[] = [];

    if (brightness !== 100) {
      filters.push(`brightness(${brightness / 100})`);
    }
    if (contrast !== 100) {
      filters.push(`contrast(${contrast / 100})`);
    }

    switch (eyeComfortMode) {
      case "warm":
        filters.push("sepia(15%)");
        break;
      case "sepia":
        filters.push("sepia(40%)");
        break;
      case "dark":
        filters.push("brightness(0.85) saturate(0.9)");
        break;
    }

    return filters.length > 0 ? { filter: filters.join(" ") } : {};
  }, [brightness, contrast, eyeComfortMode]);

  // Стиль подгонки изображения
  const imageFitClass = useMemo(() => {
    switch (fitMode) {
      case "width":
        return "w-full h-auto";
      case "height":
        return "h-screen w-auto max-w-full mx-auto";
      case "original":
        return "w-auto h-auto max-w-full";
      case "auto":
      default:
        return "w-full max-w-full h-auto";
    }
  }, [fitMode]);

  // Функция загрузчика изображений с поддержкой ширины и качества
  const imageLoader = useCallback(
    ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
      // src уже содержит корректный URL (primary или fallback) от getImageUrlWithFallback
      const separator = src.includes("?") ? "&" : "?";
      const params = new URLSearchParams();
      params.set("w", String(width));
      if (quality != null && quality > 0) {
        params.set("q", String(quality));
      }
      return `${src}${separator}${params.toString()}`;
    },
    [],
  );

  // Проверяет, нужно ли показывать название главы (не дублирует номер)
  const shouldShowChapterTitle = useCallback(
    (chapterTitle: string | undefined, chapterNumber: number): boolean => {
      if (!chapterTitle) return false;
      const titleLower = chapterTitle.toLowerCase().trim();
      const numberStr = String(chapterNumber);
      // Не показываем если: title === номер, или title === "глава N", или title === "N"
      if (titleLower === numberStr) return false;
      if (titleLower === `глава ${numberStr}`) return false;
      if (titleLower === `глава${numberStr}`) return false;
      if (/^глава\s*\d+$/.test(titleLower) && titleLower.includes(numberStr)) return false;
      return true;
    },
    [],
  );

  // Обновление просмотров и истории чтения
  useEffect(() => {
    if (!title?._id || !chapter?._id) return;

    const chapterKey = `${title._id}-${chapter._id}`;

    // Обновляем просмотры только один раз (для всех пользователей)
    if (!viewsUpdatedRef.current.has(chapterKey)) {
      if (isAuthenticated) {
        // Для авторизованных пользователей используем полную функцию с обновлением в БД
        updateChapterViews(chapter._id)
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

    if (!historyAddedRef.current.has(chapterKey) && !historyPendingRef.current.has(chapterKey)) {
      historyPendingRef.current.add(chapterKey);
      const doAdd = () =>
        addToReadingHistory(title._id.toString(), chapter._id.toString())
          .then(() => {
            historyAddedRef.current.add(chapterKey);
            historyPendingRef.current.delete(chapterKey);
            // Тосты опыта/уровня/достижений показываются только из WebSocket (ProgressNotificationContext),
            // чтобы не дублировать при одновременной отправке с сервера по сокету и в ответе API.
          })
          .catch(error => {
            console.error("Error adding to reading history:", error);
            // Одна повторная попытка через 2 с (сетевые сбои, 401 до refresh)
            if (!historyRetryAttemptedRef.current.has(chapterKey)) {
              historyRetryAttemptedRef.current.add(chapterKey);
              setTimeout(() => doAdd(), 2000);
            } else {
              historyPendingRef.current.delete(chapterKey);
            }
          });
      doAdd();
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

  // Обработчик ошибок загрузки изображений с fallback
  const handleImageError = useCallback(
    (chapterId: string, imageIndex: number, imageSrc: string) => {
      const errorKey = `${chapterId}-${imageIndex}`;
      // Если fallback ещё не использовался, пробуем его
      if (!imageFallbacks.has(errorKey)) {
        const { fallback } = getImageUrls(imageSrc);
        const { primary } = getImageUrls(imageSrc);
        if (fallback && fallback !== primary) {
          setImageFallbacks(prev => new Set(prev).add(errorKey));
          return;
        }
      }
      // Если fallback уже использован или его нет — помечаем как ошибку
      setImageLoadErrors(prev => new Set(prev).add(errorKey));
    },
    [imageFallbacks],
  );

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

  const isEditableTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;

    return Boolean(
      target.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]',
      ),
    );
  }, []);

  const isReaderDialogOpen = useCallback(() => {
    return Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
  }, []);

  const getChapterRootElement = useCallback((targetChapterId: string) => {
    return (
      chapterSectionRefs.current.get(targetChapterId) ??
      document.querySelector<HTMLDivElement>(`[data-chapter-root="${targetChapterId}"]`)
    );
  }, []);

  const findPageElementInChapter = useCallback(
    (targetChapterId: string, page: number) => {
      const chapterRoot = getChapterRootElement(targetChapterId);
      return chapterRoot?.querySelector<HTMLElement>(`[data-page="${page}"]`) ?? null;
    },
    [getChapterRootElement],
  );

  // Навигация по клавиатуре
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (isEditableTarget(e.target) || isReaderDialogOpen()) return;

      switch (e.key) {
        case "ArrowLeft":
          if (currentChapterIndex > 0) {
            const prevChapter = chapters[currentChapterIndex - 1];
            clearOtherChaptersPositions(titleId, prevChapter._id);
            triggerHaptic();
            router.push(getChapterPath(prevChapter._id));
          }
          break;
        case "ArrowRight":
          if (currentChapterIndex < chapters.length - 1) {
            const nextChapter = chapters[currentChapterIndex + 1];
            clearOtherChaptersPositions(titleId, nextChapter._id);
            triggerHaptic();
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
  }, [
    currentChapterIndex,
    chapters,
    titleId,
    router,
    getChapterPath,
    triggerHaptic,
    isEditableTarget,
    isReaderDialogOpen,
  ]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleOverlayEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (zoomedImage) {
        event.preventDefault();
        setZoomedImage(null);
        return;
      }

      if (showKeyboardHints) {
        event.preventDefault();
        setShowKeyboardHints(false);
        return;
      }

      if (isRestoreModalOpen) {
        event.preventDefault();
        setIsRestoreModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleOverlayEscape);
    return () => document.removeEventListener("keydown", handleOverlayEscape);
  }, [zoomedImage, showKeyboardHints, isRestoreModalOpen]);

  // Обработчики для мобильных контролов
  const handleMobileTap = () => {
    // Отображение нижнего меню при тапе по экрану
    if (hideBottomMenuSetting) {
      showMenuAndResetTimeout();
      if (isMenuCollapsed) {
        setForceStopAutoScroll(true);
      }
    }
  };

  // Unified scroll handler: логика появления/скрытия хедера
  const lastScrollYRef = useRef(0);
  const SCROLL_TOP_ZONE = 120; // в начале страницы хедер всегда виден
  const SCROLL_DOWN_THRESHOLD = 50; // скрыть хедер только после прокрутки вниз на N px
  const SCROLL_UP_THRESHOLD = 25; // показать хедер при прокрутке вверх на N px

  useEffect(() => {
    let ticking = false;
    let animationFrameId: number | null = null;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      animationFrameId = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const prevScrollY = lastScrollYRef.current;
        const delta = currentScrollY - prevScrollY;

        // В начале страницы хедер всегда показываем
        if (currentScrollY <= SCROLL_TOP_ZONE) {
          setIsHeaderVisible(true);
          if (hideBottomMenuSetting) {
            showMenuAndResetTimeout();
          }
          setForceStopAutoScroll(false);
        } else if (delta > SCROLL_DOWN_THRESHOLD) {
          // Прокрутка вниз — скрыть хедер
          setIsHeaderVisible(false);
          if (hideBottomMenuSetting) {
            setIsMenuCollapsed(true);
          }
        } else if (delta < -SCROLL_UP_THRESHOLD) {
          // Прокрутка вверх — показать хедер
          setIsHeaderVisible(true);
          if (hideBottomMenuSetting) {
            showMenuAndResetTimeout();
          }
          setForceStopAutoScroll(false);
        } else if (currentScrollY === prevScrollY) {
          setForceStopAutoScroll(false);
        }

        if (window.innerHeight + currentScrollY >= document.body.offsetHeight - 100) {
          if (hideBottomMenuSetting) {
            setIsMenuCollapsed(true);
          }
        }

        lastScrollYRef.current = currentScrollY;
        setLastScrollY(currentScrollY);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [hideBottomMenuSetting, showMenuAndResetTimeout]);

  // Обработчик двойного тапа для зума
  const handleImageDoubleTap = useCallback(
    (src: string, alt: string) => {
      const now = Date.now();
      if (now - lastTapTime < 300) {
        setZoomedImage({ src, alt });
      }
      setLastTapTime(now);
    },
    [lastTapTime],
  );

  // Scroll to top функция
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Swipe navigation для постраничного режима
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      touchEndX.current = e.changedTouches[0].clientX;
      const diffX = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 50;

      if (isPagedMode) {
        if (diffX > minSwipeDistance) {
          // Свайп влево
          if (currentPage >= chapter.images.length && currentChapterIndex < chapters.length - 1) {
            const nextChapter = chapters[currentChapterIndex + 1];
            clearOtherChaptersPositions(titleId, nextChapter._id);
            triggerHaptic();
            router.push(getChapterPath(nextChapter._id));
          } else if (chapter.images.length > 0) {
            setCurrentPage(prev => Math.min(chapter.images.length, Math.max(1, prev + 1)));
            triggerHaptic();
          }
        } else if (diffX < -minSwipeDistance) {
          // Свайп вправо
          if (currentPage <= 1 && currentChapterIndex > 0) {
            const prevChapter = chapters[currentChapterIndex - 1];
            clearOtherChaptersPositions(titleId, prevChapter._id);
            triggerHaptic();
            router.push(getChapterPath(prevChapter._id));
          } else if (chapter.images.length > 0) {
            setCurrentPage(prev => Math.max(1, prev - 1));
            triggerHaptic();
          }
        }
      }
    },
    [
      isPagedMode,
      chapter.images.length,
      currentPage,
      currentChapterIndex,
      chapters,
      titleId,
      getChapterPath,
      router,
      triggerHaptic,
    ],
  );

  // Загрузка настройки предзагрузки из localStorage
  useEffect(() => {
    const savedPreload = localStorage.getItem("reader-preload-all-images");
    if (savedPreload === "true") {
      setPreloadAllImages(true);
    }
  }, []);

  // Функция восстановления позиции
  const restorePosition = useCallback(
    (page: number) => {
      setSavedReadingPage(page);

      const timeoutId = setTimeout(async () => {
        try {
          const pageElement = findPageElementInChapter(chapterId, page);
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
    },
    [chapter.images, chapterId, findPageElementInChapter],
  );

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

  // Измерение реальной высоты контента после загрузки изображений
  useEffect(() => {
    if (isPagedMode || !isPositionRestored) return;

    const measureContentHeight = () => {
      const chapterContainer = document.querySelector(".chapter-container");
      if (chapterContainer) {
        const height = chapterContainer.scrollHeight;
        if (height > 0) {
          setTotalContentHeight(height);
        }
      }
    };

    // Измеряем после небольшой задержки, чтобы изображения успели загрузиться
    const timeoutId = setTimeout(measureContentHeight, 2000);

    // Также измеряем при каждой загрузке изображения
    const loadedCount = Object.values(loadedImagesByChapter).reduce(
      (acc, set) => acc + set.size,
      0,
    );
    if (loadedCount > 0) {
      measureContentHeight();
    }

    return () => clearTimeout(timeoutId);
  }, [isPagedMode, isPositionRestored, loadedImagesByChapter]);

  // Предзагрузка всех изображений при включенной настройке (с отменой при размонтировании/смене главы)
  const preloadImagesRef = useRef<HTMLImageElement[]>([]);
  useEffect(() => {
    if (!preloadAllImages || !chapter.images.length || !isPositionRestored) return;

    let cancelled = false;
    let loadedCount = 0;
    const totalImages = chapter.images.length;

    const updateProgress = () => {
      if (cancelled) return;
      loadedCount++;
      setPreloadProgress(Math.round((loadedCount / totalImages) * 100));
    };

    const images: HTMLImageElement[] = [];
    chapter.images.forEach(src => {
      const img = new window.Image();
      img.onload = updateProgress;
      img.onerror = updateProgress;
      img.src = getImageUrl(src);
      images.push(img);
    });
    preloadImagesRef.current = images;

    const priorities = new Map<number, "low" | "medium" | "high">();
    chapter.images.forEach((_, index) => {
      priorities.set(index + 1, "high");
    });
    setImageLoadPriority(priorities);

    return () => {
      cancelled = true;
      images.forEach(img => {
        img.onload = null;
        img.onerror = null;
        img.src = "";
      });
      preloadImagesRef.current = [];
    };
  }, [preloadAllImages, chapter.images, isPositionRestored, getImageUrl]);

  // Актуальная страница для синхронного сохранения при закрытии/уходе
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  // Создание дебаунс-функции для сохранения позиции + сохранение при beforeunload и размонтировании
  const debouncedSavePositionRef = useRef<ReturnType<typeof createDebouncedSave> | null>(null);

  useEffect(() => {
    debouncedSavePositionRef.current = createDebouncedSave((page: number) => {
      saveReadingPosition(titleId, activeReadingChapterId, page);
    }, 1000);

    const saveNow = () => {
      const page = currentPageRef.current;
      if (page > 1) saveReadingPosition(titleId, activeReadingChapterId, page);
    };

    const handleBeforeUnload = () => {
      saveNow();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      saveNow();
      debouncedSavePositionRef.current = null;
    };
  }, [titleId, activeReadingChapterId]);

  const debouncedSavePosition = useCallback((page: number) => {
    debouncedSavePositionRef.current?.(page);
  }, []);

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

      const chapterRoot = getChapterRootElement(activeReadingChapterId);
      const currentPageNum = getCurrentPageEnhanced(chapterRoot ?? undefined);
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
  }, [
    chapter.images,
    debouncedSavePosition,
    isPositionRestored,
    savedReadingPage,
    isPagedMode,
    getChapterRootElement,
    activeReadingChapterId,
  ]);

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
  }, [isChaptersInRowMode, lastLoadedIndex, chapters, loadingNext, fetchChapterById]);

  useEffect(() => {
    if (!isChaptersInRowMode) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const winH = window.innerHeight;
        const docH = document.documentElement.scrollHeight;
        if (scrollTop < 300) loadPrevChapter();
        if (docH - scrollTop - winH < 400) loadNextChapter();
        ticking = false;
      });
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
        const byRatio = visible.sort(
          (a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0),
        );
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

  // Обновление URL при смене видимой главы (бесконечное чтение)
  useEffect(() => {
    if (!infiniteScroll || isPagedMode || loadedChapters.length <= 1) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length === 0) return;

        // Находим главу с наибольшим пересечением
        const byRatio = visible.sort(
          (a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0),
        );
        const chapterId = byRatio[0]?.target.getAttribute("data-infinite-chapter");

        if (chapterId && chapterId !== visibleChapterId) {
          setVisibleChapterId(chapterId);
          const path = slug
            ? `/titles/${slug}/chapter/${chapterId}`
            : `/titles/${titleId}/chapter/${chapterId}`;
          window.history.replaceState(null, "", path);
        }
      },
      { root: null, rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.1, 0.25, 0.5] },
    );

    // Наблюдаем за разделителями глав
    const chapterDividers = document.querySelectorAll("[data-infinite-chapter]");
    chapterDividers.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [infiniteScroll, isPagedMode, loadedChapters.length, visibleChapterId, slug, titleId]);

  // Размонт первой главы, когда она ушла за верх экрана; компенсируем скролл, чтобы экран не прыгал
  useEffect(() => {
    if (!infiniteScroll || isPagedMode || loadedChapters.length <= 1) return;
    const el = firstChapterContainerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (!entry) return;
        const rect = entry.boundingClientRect;
        if (rect.bottom >= 0) return;
        const target = entry.target as HTMLElement;
        const chapterId = target.getAttribute("data-infinite-chapter");
        if (!chapterId) return;
        const height = target.offsetHeight;
        setLoadedChapters(prev => {
          if (prev.length <= 1 || prev[0]._id !== chapterId) return prev;
          return prev.slice(1);
        });
        setLoadedImagesByChapter(im => {
          const next = { ...im };
          delete next[chapterId];
          return next;
        });
        loadedImagesRef.current = new Set(
          [...loadedImagesRef.current].filter(k => !k.startsWith(`${chapterId}-`)),
        );
        setLoadedChapterIds(prev => {
          const next = new Set(prev);
          next.delete(chapterId);
          return next;
        });
        loadedChapterIdsRef.current.delete(chapterId);
        requestAnimationFrame(() => window.scrollBy(0, -height));
      },
      { root: null, rootMargin: "0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [infiniteScroll, isPagedMode, loadedChapters.length]);

  // В режиме «главы подряд» или бесконечного чтения текущая для хедера/контролов — видимая глава
  const effectiveChapter =
    isChaptersInRowMode || infiniteScroll
      ? (loadedChapters.find(c => c._id === visibleChapterId) ?? chapter)
      : chapter;

  // В бесконечном чтении первый блок — первая глава из списка; при выходе из viewport она размонтируется
  const displayChapter =
    infiniteScroll && !isPagedMode && loadedChapters.length > 0 ? loadedChapters[0] : chapter;

  const estimatedReadingTime = useMemo(() => {
    if (!effectiveChapter) return 1;
    return calculateReadingTime(effectiveChapter.images.length, totalContentHeight);
  }, [effectiveChapter, totalContentHeight, calculateReadingTime]);
  void estimatedReadingTime;

  // Динамическое обновление SEO при смене главы (бесконечное чтение)
  useEffect(() => {
    if (!infiniteScroll || !effectiveChapter) return;

    const chapterTitle = shouldShowChapterTitle(effectiveChapter.title, effectiveChapter.number)
      ? `Глава ${effectiveChapter.number}: ${effectiveChapter.title}`
      : `Глава ${effectiveChapter.number}`;

    const fullTitle = `${chapterTitle} - ${title.title} | Manga-shi`;

    // Обновляем title
    document.title = fullTitle;

    // Обновляем Open Graph meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", fullTitle);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      const newUrl = slug
        ? `${window.location.origin}/titles/${slug}/chapter/${effectiveChapter._id}`
        : `${window.location.origin}/titles/${titleId}/chapter/${effectiveChapter._id}`;
      ogUrl.setAttribute("content", newUrl);
    }

    // Обновляем description
    const description = `Читать ${chapterTitle} манги ${title.title} онлайн на Manga-shi`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", description);
    // shouldShowChapterTitle — стабильная функция из контекста
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infiniteScroll, effectiveChapter, title.title, slug, titleId]);
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

  if (!chapter) {
    return (
      <ChapterErrorState
        title="Глава не найдена"
        message="Попробуйте обновить страницу или выбрать другую главу"
        slug={slug}
      />
    );
  }

  if (!chapter.images?.length) {
    return <ChapterNoPagesState title={title} chapter={chapter} chapters={chapters} slug={slug} />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Модальное окно восстановления позиции */}
      <ReadingPositionRestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onRestore={() => restorePosition(savedReadingPage || 1)}
        onReset={resetPosition}
        onJumpToPage={page => {
          restorePosition(page);
        }}
        page={savedReadingPage || 1}
        timestamp={savedPositionTimestamp}
        totalPages={chapter.images.length}
        chapterTitle={
          shouldShowChapterTitle(chapter.title, chapter.number)
            ? `Глава ${chapter.number} - ${chapter.title}`
            : `Глава ${chapter.number}`
        }
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
            clearOtherChaptersPositions(titleId, prevChapter._id);
            triggerHaptic();
            router.push(getChapterPath(prevChapter._id));
          }
        }}
        onNext={() => {
          if (currentChapterIndex < chapters.length - 1) {
            const nextChapter = chapters[currentChapterIndex + 1];
            clearOtherChaptersPositions(titleId, nextChapter._id);
            triggerHaptic();
            router.push(getChapterPath(nextChapter._id));
          }
        }}
        canGoPrev={currentChapterIndex > 0}
        canGoNext={currentChapterIndex < chapters.length - 1}
        titleId={titleId}
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
        onPreloadChange={value => {
          setPreloadAllImages(value);
          localStorage.setItem("reader-preload-all-images", value.toString());
        }}
        preloadProgress={preloadProgress}
        onJumpToPage={page => {
          if (isPagedMode) {
            setCurrentPage(page);
            return;
          }
          const pageElement = findPageElementInChapter(effectiveChapter._id, page);
          if (pageElement) {
            pageElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
          setCurrentPage(page);
        }}
        chapterImages={effectiveChapter.images}
        shareChapterUrl={
          typeof window !== "undefined"
            ? `${window.location.origin}${getChapterPath(effectiveChapter._id)}`
            : undefined
        }
        shareTitleName={title.title}
        shareChapterNumber={effectiveChapter.number}
      />

      <div
        aria-hidden
        className={`transition-[height] duration-300 ease-out ${
          isHeaderVisible ? "h-20 sm:h-24" : "h-0"
        }`}
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
          const event = new CustomEvent("openChapterMenu");
          window.dispatchEvent(event);
        }}
        onPrevChapter={() => {
          if (currentChapterIndex > 0) {
            const prevChapter = chapters[currentChapterIndex - 1];
            clearOtherChaptersPositions(titleId, prevChapter._id);
            triggerHaptic();
            router.push(getChapterPath(prevChapter._id));
          }
        }}
        onNextChapter={() => {
          if (currentChapterIndex < chapters.length - 1) {
            const nextChapter = chapters[currentChapterIndex + 1];
            clearOtherChaptersPositions(titleId, nextChapter._id);
            triggerHaptic();
            router.push(getChapterPath(nextChapter._id));
          }
        }}
        canGoPrev={currentChapterIndex > 0}
        canGoNext={currentChapterIndex < chapters.length - 1}
      />

      {/* Основной контент */}
      <main
        className={`${isMenuCollapsed ? "pb-0" : "pb-[calc(4rem+env(safe-area-inset-bottom,0px))]"} reader-scroll-container reader-prevent-refresh`}
        onClick={handleMobileTap}
      >
        <div className="container mx-auto">
          {isChaptersInRowMode ? (
            <>
              {loadingPrev && (
                <div className="py-10 flex flex-col items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-2 border-[var(--primary)]/20 border-t-[var(--primary)] animate-spin" />
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Загрузка предыдущей главы…
                  </p>
                </div>
              )}
              {loadedChapters.map(ch => (
                <div
                  key={ch._id}
                  ref={el => {
                    if (el) {
                      chapterSectionRefs.current.set(ch._id, el);
                    } else {
                      chapterSectionRefs.current.delete(ch._id);
                    }
                  }}
                  data-chapter-id={ch._id}
                  data-chapter-root={ch._id}
                  className="chapter-container"
                >
                  <div className="bg-[var(--primary)]/10 py-6">
                    <div className="max-w-2xl mx-auto px-4 flex items-center justify-center gap-4">
                      <div className="h-px bg-[var(--primary)]/30 flex-1" />
                      <div className="flex items-center gap-3 px-4 py-2 bg-[var(--card)] rounded-full border border-[var(--primary)]/30">
                        <span className="text-sm font-bold text-[var(--primary)]">
                          Глава {ch.number}
                        </span>
                        {shouldShowChapterTitle(ch.title, ch.number) && (
                          <span className="text-sm text-[var(--muted-foreground)]">{ch.title}</span>
                        )}
                      </div>
                      <div className="h-px bg-[var(--primary)]/30 flex-1" />
                    </div>
                  </div>
                  {ch.images.map((src, imageIndex) => {
                    const errorKey = `${ch._id}-${imageIndex}`;
                    const isError = imageLoadErrors.has(errorKey);
                    const imageUrl = getImageUrlWithFallback(src, ch._id, imageIndex);
                    const useFallback = imageFallbacks.has(errorKey);
                    const imageLoadKey = `${ch._id}-${imageIndex}`;
                    const loadedInChapter = loadedImagesByChapter[ch._id] ?? new Set<number>();
                    const isImageLoaded =
                      loadedImagesRef.current.has(imageLoadKey) || loadedInChapter.has(imageIndex);

                    return (
                      <div
                        key={`${ch._id}-${imageIndex}`}
                        className="flex justify-center reader-image-container"
                        style={{ marginBottom: `${pageGap}px` }}
                      >
                        <div
                          className="relative w-full flex justify-center px-0 sm:px-4"
                          data-page={imageIndex + 1}
                          style={{
                            maxWidth: isMobile ? "100%" : `${imageWidth}px`,
                            transition: "filter 200ms ease-out",
                            ...imageFilterStyle,
                          }}
                        >
                          {/* Skeleton loader */}
                          {!isImageLoaded && !isError && (
                            <div
                              className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--card)] rounded-lg overflow-hidden z-10"
                              style={{ minHeight: isMobile ? "400px" : "600px" }}
                            >
                              <div
                                className="absolute inset-0 bg-gradient-to-r from-[var(--muted)] via-[var(--card)] to-[var(--muted)] animate-shimmer"
                                style={{ backgroundSize: "200% 100%" }}
                              />
                              <div className="relative z-10 flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                                  <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                </div>
                                <span className="text-sm text-[var(--muted-foreground)]">
                                  Страница {imageIndex + 1}
                                </span>
                              </div>
                            </div>
                          )}

                          {!isError ? (
                            <Image
                              key={`${ch._id}-${imageIndex}-${imageWidth}-${imageQuality}-${useFallback ? "fb" : "pr"}`}
                              loader={imageLoader}
                              src={imageUrl}
                              alt={`Глава ${ch.number}, Страница ${imageIndex + 1}`}
                              width={isMobile ? 800 : imageWidth}
                              height={isMobile ? 1200 : Math.round((imageWidth * 1600) / 1200)}
                              className={`${imageFitClass} shadow-lg sm:shadow-2xl cursor-zoom-in ${isImageLoaded ? "opacity-100" : "opacity-0 transition-opacity duration-300"}`}
                              quality={imageQuality}
                              loading={imageIndex < (isMobile ? 6 : 3) ? "eager" : "lazy"}
                              onLoad={() => {
                                loadedImagesRef.current.add(imageLoadKey);
                                setLoadedImagesByChapter(prev => ({
                                  ...prev,
                                  [ch._id]: new Set(prev[ch._id] ?? []).add(imageIndex),
                                }));
                              }}
                              onError={() => handleImageError(ch._id, imageIndex, src)}
                              priority={imageIndex < (isMobile ? 3 : 1)}
                              onClick={() =>
                                handleImageDoubleTap(
                                  imageUrl,
                                  `Глава ${ch.number}, Страница ${imageIndex + 1}`,
                                )
                              }
                            />
                          ) : (
                            <div className="w-full min-h-[180px] sm:min-h-[240px] bg-gradient-to-b from-[var(--card)] to-[var(--secondary)]/50 flex items-center justify-center px-4 rounded-lg border border-[var(--border)]/50">
                              <div className="text-center max-w-xs">
                                <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center">
                                  <svg
                                    className="w-5 h-5 text-[var(--destructive)]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-2.5">
                                  Страница {imageIndex + 1} не загрузилась
                                </p>
                                <button
                                  onClick={() => {
                                    setImageLoadErrors(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(errorKey);
                                      return newSet;
                                    });
                                    setImageFallbacks(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(errorKey);
                                      return newSet;
                                    });
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 rounded-lg transition-colors text-xs sm:text-sm font-medium min-h-[40px] touch-manipulation active:scale-95"
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                  </svg>
                                  Повторить
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* ch._id === loadedChapters[loadedChapters.length - 1]?._id && <AdBlockReading /> */}
                </div>
              ))}
              {loadingNext && (
                <div className="py-10 flex flex-col items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-2 border-[var(--primary)]/20 border-t-[var(--primary)] animate-spin" />
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Загрузка следующей главы…
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div
                ref={el => {
                  if (infiniteScroll && !isPagedMode) {
                    firstChapterContainerRef.current = el;
                  }

                  if (el) {
                    chapterSectionRefs.current.set(displayChapter._id, el);
                  } else {
                    chapterSectionRefs.current.delete(displayChapter._id);
                  }
                }}
                className="chapter-container"
                data-infinite-chapter={displayChapter._id}
                data-chapter-root={displayChapter._id}
              >
                {/* Заголовок главы */}
                <div className="bg-[var(--primary)]/10 py-6">
                  <div className="max-w-2xl mx-auto px-4 flex items-center justify-center gap-4">
                    <div className="h-px bg-[var(--primary)]/30 flex-1" />
                    <div className="flex items-center gap-3 px-4 py-2 bg-[var(--card)] rounded-full border border-[var(--primary)]/30">
                      <span className="text-sm font-bold text-[var(--primary)]">
                        Глава {displayChapter.number}
                      </span>
                      {shouldShowChapterTitle(displayChapter.title, displayChapter.number) && (
                        <span className="text-sm text-[var(--muted-foreground)]">
                          {displayChapter.title}
                        </span>
                      )}
                    </div>
                    <div className="h-px bg-[var(--primary)]/30 flex-1" />
                  </div>
                </div>

                {/* Изображения главы */}
                {isPagedMode ? (
                  <>
                    <div className="py-3 sm:py-2 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--muted)]/60 text-sm text-[var(--muted-foreground)]">
                        Страница{" "}
                        <span className="font-semibold text-[var(--foreground)]">
                          {currentPage}
                        </span>{" "}
                        / {displayChapter.images.length}
                      </div>
                    </div>
                    {displayChapter.images[pagedImageIndex] &&
                      (() => {
                        const imageIndex = pagedImageIndex;
                        const src = displayChapter.images[imageIndex];
                        const errorKey = `${displayChapter._id}-${imageIndex}`;
                        const isError = imageLoadErrors.has(errorKey);
                        const imageUrl = getImageUrlWithFallback(
                          src,
                          displayChapter._id,
                          imageIndex,
                        );
                        const useFallback = imageFallbacks.has(errorKey);
                        const imageLoadKey = `${displayChapter._id}-${imageIndex}`;
                        const loadedInChapter =
                          loadedImagesByChapter[displayChapter._id] ?? new Set<number>();
                        const isImageLoaded =
                          loadedImagesRef.current.has(imageLoadKey) ||
                          loadedInChapter.has(imageIndex);

                        return (
                          <div
                            key={`${displayChapter._id}-${imageIndex}`}
                            className="flex justify-center select-none"
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                          >
                            <div
                              className="relative w-full flex justify-center px-0 sm:px-4"
                              data-page={imageIndex + 1}
                              style={{
                                maxWidth: isMobile ? "100%" : `${imageWidth}px`,
                                transition: "filter 200ms ease-out",
                                ...imageFilterStyle,
                              }}
                              onClick={() =>
                                handleImageDoubleTap(
                                  imageUrl,
                                  `Глава ${displayChapter.number}, Страница ${imageIndex + 1}`,
                                )
                              }
                            >
                              {/* Skeleton loader */}
                              {!isImageLoaded && !isError && (
                                <div
                                  className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--card)] rounded-lg overflow-hidden z-10"
                                  style={{ minHeight: isMobile ? "400px" : "600px" }}
                                >
                                  <div
                                    className="absolute inset-0 bg-gradient-to-r from-[var(--muted)] via-[var(--card)] to-[var(--muted)] animate-shimmer"
                                    style={{ backgroundSize: "200% 100%" }}
                                  />
                                  <div className="relative z-10 flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                                      <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <span className="text-sm text-[var(--muted-foreground)]">
                                      Страница {imageIndex + 1}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {!isError ? (
                                <>
                                  <Image
                                    key={`${displayChapter._id}-${imageIndex}-${imageWidth}-${imageQuality}-${useFallback ? "fb" : "pr"}`}
                                    loader={imageLoader}
                                    src={imageUrl}
                                    alt={`Глава ${displayChapter.number}, Страница ${imageIndex + 1}`}
                                    width={isMobile ? 800 : imageWidth}
                                    height={
                                      isMobile ? 1200 : Math.round((imageWidth * 1600) / 1200)
                                    }
                                    className={`${imageFitClass} shadow-lg sm:shadow-2xl cursor-zoom-in ${isImageLoaded ? "opacity-100" : "opacity-0 transition-opacity duration-300"}`}
                                    quality={imageQuality}
                                    loading="eager"
                                    onLoad={() => {
                                      loadedImagesRef.current.add(imageLoadKey);
                                      setLoadedImagesByChapter(prev => ({
                                        ...prev,
                                        [displayChapter._id]: new Set(
                                          prev[displayChapter._id] ?? [],
                                        ).add(imageIndex),
                                      }));
                                    }}
                                    onError={() =>
                                      handleImageError(displayChapter._id, imageIndex, src)
                                    }
                                    priority
                                  />
                                  {/* Zoom hint on first page */}
                                  {showHints && imageIndex === 0 && isImageLoaded && (
                                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white/80 opacity-0 animate-fade-in-delayed pointer-events-none">
                                      <ZoomIn className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">
                                        Двойной клик для зума
                                      </span>
                                      <span className="sm:hidden">2x тап для зума</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="w-full min-h-[300px] sm:min-h-[400px] bg-gradient-to-b from-[var(--card)] to-[var(--secondary)]/50 flex items-center justify-center px-4 rounded-xl border border-[var(--border)]/50">
                                  <div className="text-center max-w-xs">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center">
                                      <svg
                                        className="w-8 h-8 text-[var(--destructive)]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={1.5}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </div>
                                    <h4 className="font-medium text-[var(--foreground)] mb-2">
                                      Не удалось загрузить страницу {imageIndex + 1}
                                    </h4>
                                    <p className="text-sm text-[var(--muted-foreground)] mb-4">
                                      Проверьте подключение к интернету и попробуйте снова
                                    </p>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        setImageLoadErrors(prev => {
                                          const newSet = new Set(prev);
                                          newSet.delete(errorKey);
                                          return newSet;
                                        });
                                        setImageFallbacks(prev => {
                                          const newSet = new Set(prev);
                                          newSet.delete(errorKey);
                                          return newSet;
                                        });
                                      }}
                                      className="inline-flex items-center gap-2 px-5 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 rounded-xl transition-colors text-sm font-medium min-h-[44px] touch-manipulation active:scale-95"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                      </svg>
                                      Повторить
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    {/* Swipe hint для мобильных */}
                    {showHints && isMobile && currentPage === 1 && (
                      <div className="py-3 text-center animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-[var(--secondary)]/80 rounded-full text-xs text-[var(--muted-foreground)]">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M7 16l-4-4m0 0l4-4m-4 4h18"
                            />
                          </svg>
                          <span>Свайпайте для навигации</span>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="py-5 sm:py-6 px-4 sm:px-0">
                      <div className="flex items-center justify-center gap-3 max-w-xl mx-auto">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage <= 1}
                          className="group flex cursor-pointer items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 text-sm font-medium min-h-[48px] touch-manipulation active:scale-95"
                        >
                          <ArrowBigLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                          <span className="hidden sm:inline">Предыдущая страница</span>
                          <span className="sm:hidden">Назад</span>
                        </button>
                        <button
                          onClick={() =>
                            setCurrentPage(prev => Math.min(displayChapter.images.length, prev + 1))
                          }
                          disabled={currentPage >= displayChapter.images.length}
                          className="group flex cursor-pointer items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 bg-[var(--secondary)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 text-sm font-medium min-h-[48px] touch-manipulation active:scale-95"
                        >
                          <span className="hidden sm:inline">Следующая страница</span>
                          <span className="sm:hidden">Далее</span>
                          <ArrowBigRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  displayChapter.images.map((src, imageIndex) => {
                    const errorKey = `${displayChapter._id}-${imageIndex}`;
                    const isError = imageLoadErrors.has(errorKey);
                    const imageUrl = getImageUrlWithFallback(src, displayChapter._id, imageIndex);
                    const useFallback = imageFallbacks.has(errorKey);
                    const imageLoadKey = `${displayChapter._id}-${imageIndex}`;
                    const loadedInChapter =
                      loadedImagesByChapter[displayChapter._id] ?? new Set<number>();
                    const isImageLoaded =
                      loadedImagesRef.current.has(imageLoadKey) || loadedInChapter.has(imageIndex);

                    return (
                      <div
                        key={`${displayChapter._id}-${imageIndex}`}
                        className="flex justify-center reader-image-container"
                        style={{ marginBottom: `${pageGap}px` }}
                      >
                        <div
                          className="relative w-full flex justify-center px-0 sm:px-4"
                          data-page={imageIndex + 1}
                          style={{
                            maxWidth: isMobile ? "100%" : `${imageWidth}px`,
                            transition: "filter 200ms ease-out",
                            ...imageFilterStyle,
                          }}
                        >
                          {/* Skeleton loader пока изображение загружается */}
                          {!isImageLoaded && !isError && (
                            <div
                              className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--card)] rounded-lg overflow-hidden z-10"
                              style={{
                                minHeight: isMobile ? "400px" : "600px",
                              }}
                            >
                              <div
                                className="absolute inset-0 bg-gradient-to-r from-[var(--muted)] via-[var(--card)] to-[var(--muted)] animate-shimmer"
                                style={{ backgroundSize: "200% 100%" }}
                              />
                              <div className="relative z-10 flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                                  <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                </div>
                                <span className="text-sm text-[var(--muted-foreground)]">
                                  Страница {imageIndex + 1}
                                </span>
                              </div>
                            </div>
                          )}

                          {!isError ? (
                            <Image
                              key={`${displayChapter._id}-${imageIndex}-${imageWidth}-${imageQuality}-${useFallback ? "fb" : "pr"}`}
                              loader={imageLoader}
                              src={imageUrl}
                              alt={`Глава ${displayChapter.number}, Страница ${imageIndex + 1}`}
                              width={isMobile ? 800 : imageWidth}
                              height={isMobile ? 1200 : Math.round((imageWidth * 1600) / 1200)}
                              className={`${imageFitClass} shadow-lg sm:shadow-2xl ${isImageLoaded ? "opacity-100" : "opacity-0 transition-opacity duration-300"}`}
                              quality={
                                imageLoadPriority.size > 0
                                  ? (() => {
                                      const priority = imageLoadPriority.get(imageIndex + 1);
                                      switch (priority) {
                                        case "high":
                                          return imageQuality;
                                        case "medium":
                                          return Math.max(50, imageQuality - 15);
                                        case "low":
                                          return Math.max(40, imageQuality - 25);
                                        default:
                                          return imageQuality;
                                      }
                                    })()
                                  : imageQuality
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
                              onLoad={() => {
                                loadedImagesRef.current.add(imageLoadKey);
                                setLoadedImagesByChapter(prev => ({
                                  ...prev,
                                  [displayChapter._id]: new Set(prev[displayChapter._id] ?? []).add(
                                    imageIndex,
                                  ),
                                }));
                              }}
                              onError={() => handleImageError(displayChapter._id, imageIndex, src)}
                              priority={
                                imageLoadPriority.size > 0
                                  ? imageLoadPriority.get(imageIndex + 1) === "high"
                                  : imageIndex < (isMobile ? 3 : 1)
                              }
                            />
                          ) : (
                            <div className="w-full min-h-[200px] sm:min-h-[280px] bg-gradient-to-b from-[var(--card)] to-[var(--secondary)]/50 flex items-center justify-center px-4 rounded-lg border border-[var(--border)]/50">
                              <div className="text-center max-w-xs">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center">
                                  <svg
                                    className="w-6 h-6 text-[var(--destructive)]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                                  Страница {imageIndex + 1} не загрузилась
                                </p>
                                <button
                                  onClick={() => {
                                    setImageLoadErrors(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(errorKey);
                                      return newSet;
                                    });
                                    setImageFallbacks(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(errorKey);
                                      return newSet;
                                    });
                                  }}
                                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 rounded-lg transition-colors text-sm font-medium min-h-[44px] touch-manipulation active:scale-95"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                  </svg>
                                  Повторить
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Рекламный блок — временно отключено
            <AdBlockReading />
            */}

                {/* Реакции на главу */}
                <div
                  className="mx-auto px-0 sm:px-4 mt-8"
                  style={{ maxWidth: isMobile ? "100%" : `${imageWidth}px` }}
                >
                  <ChapterReactions
                    chapterId={displayChapter._id}
                    titleId={titleId}
                    initialRating={
                      displayChapter.averageRating != null ||
                      displayChapter.ratingCount != null ||
                      displayChapter.userRating != null
                        ? {
                            averageRating: displayChapter.averageRating,
                            ratingSum: displayChapter.ratingSum,
                            ratingCount: displayChapter.ratingCount,
                            userRating: displayChapter.userRating,
                          }
                        : undefined
                    }
                    initialReactions={
                      displayChapter.reactions?.length ? displayChapter.reactions : undefined
                    }
                  />
                </div>

                {/* Информация о переводчике */}
                <div className="max-w-2xl mx-auto px-4 sm:px-0 mt-6">
                  <ChapterTranslatorInfo titleId={titleId} />
                </div>

                <ChapterCommentsSection chapterId={displayChapter._id} />

                {/* Футер главы с кнопками навигации */}
                {!infiniteScroll && (
                  <div className="py-8 sm:py-12 border-t border-[var(--border)] mt-8 sm:mt-10 px-4 sm:px-0">
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 max-w-2xl mx-auto">
                      <button
                        onClick={() => {
                          if (currentChapterIndex > 0) {
                            const prevChapter = chapters[currentChapterIndex - 1];
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

                      <div className="hidden sm:flex items-center px-4 py-2 bg-[var(--muted)]/50 rounded-full text-sm text-[var(--muted-foreground)]">
                        <span className="font-medium text-[var(--foreground)]">
                          {chapter.number}
                        </span>
                        <span className="mx-2">/</span>
                        <span>{chapters.length}</span>
                      </div>

                      <button
                        onClick={() => {
                          if (currentChapterIndex < chapters.length - 1) {
                            const nextChapter = chapters[currentChapterIndex + 1];
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
                )}

                {/* Бесконечное чтение: триггер и индикатор после комментариев (только для первой главы, если нет дополнительных) */}
                {infiniteScroll && !isPagedMode && loadedChapters.length === 1 && (
                  <div className="py-8 sm:py-12 border-t border-[var(--border)] mt-8 sm:mt-10">
                    {/* Невидимый триггер для Intersection Observer */}
                    <div ref={infiniteScrollTriggerRef} className="h-1" />

                    {/* Индикатор загрузки */}
                    {isLoadingNextChapter && (
                      <div className="flex flex-col items-center justify-center gap-3 py-4">
                        <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Загрузка следующей главы...
                        </p>
                      </div>
                    )}

                    {/* Сообщение когда больше нет глав */}
                    {!isLoadingNextChapter &&
                      (() => {
                        const currentId = loadedChapters[0]?._id ?? chapter._id;
                        const lastChapterIndex = chapters.findIndex(ch => ch._id === currentId);
                        const hasMoreChapters = lastChapterIndex < chapters.length - 1;

                        return !hasMoreChapters ? (
                          <div className="text-center py-4">
                            <p className="text-sm font-medium text-[var(--foreground)]">
                              Это последняя глава
                            </p>
                            <button
                              onClick={() => router.push(getTitlePath())}
                              className="mt-4 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/80 rounded-xl transition-colors text-sm"
                            >
                              Вернуться к тайтлу
                            </button>
                          </div>
                        ) : (
                          <div className="text-center text-xs text-[var(--muted-foreground)] py-2">
                            Прокрутите вниз для загрузки следующей главы
                          </div>
                        );
                      })()}
                  </div>
                )}
              </div>

              {/* В бесконечном чтении в DOM только текущая глава — дополнительные не рендерятся */}
              {infiniteScroll && !isPagedMode && loadedChapters.length > 1 && (
                <>
                  {loadedChapters.slice(1).map((loadedChapter, chapterIdx) => {
                    const loadedChapterIndex = chapters.findIndex(
                      ch => ch._id === loadedChapter._id,
                    );
                    const isLastLoadedChapter = chapterIdx === loadedChapters.length - 2;
                    const hasMoreChapters = loadedChapterIndex < chapters.length - 1;

                    return (
                      <div
                        key={loadedChapter._id}
                        className="mt-0"
                        ref={el => {
                          if (el) {
                            chapterSectionRefs.current.set(loadedChapter._id, el);
                          } else {
                            chapterSectionRefs.current.delete(loadedChapter._id);
                          }
                        }}
                        data-chapter-root={loadedChapter._id}
                      >
                        <div
                          className="bg-[var(--primary)]/10 py-6"
                          data-infinite-chapter={loadedChapter._id}
                        >
                          <div className="max-w-2xl mx-auto px-4 flex items-center justify-center gap-4">
                            <div className="h-px bg-[var(--primary)]/30 flex-1" />
                            <div className="flex items-center gap-3 px-4 py-2 bg-[var(--card)] rounded-full border border-[var(--primary)]/30">
                              <span className="text-sm font-bold text-[var(--primary)]">
                                Глава {loadedChapter.number}
                              </span>
                              {shouldShowChapterTitle(
                                loadedChapter.title,
                                loadedChapter.number,
                              ) && (
                                <span className="text-sm text-[var(--muted-foreground)]">
                                  {loadedChapter.title}
                                </span>
                              )}
                            </div>
                            <div className="h-px bg-[var(--primary)]/30 flex-1" />
                          </div>
                        </div>
                        <div className="max-w-4xl mx-auto">
                          {loadedChapter.images.map((src, imageIndex) => {
                            const errorKey = `${loadedChapter._id}-${imageIndex}`;
                            const isError = imageLoadErrors.has(errorKey);
                            const imageUrl = getImageUrlWithFallback(
                              src,
                              loadedChapter._id,
                              imageIndex,
                            );
                            const useFallback = imageFallbacks.has(errorKey);
                            const imageLoadKey = `${loadedChapter._id}-${imageIndex}`;
                            const loadedInChapter =
                              loadedImagesByChapter[loadedChapter._id] ?? new Set<number>();
                            const isImageLoaded =
                              loadedImagesRef.current.has(imageLoadKey) ||
                              loadedInChapter.has(imageIndex);
                            const visible =
                              imageIndex === 0 ||
                              Array.from({ length: imageIndex }, (_, i) => i).every(
                                i =>
                                  loadedImagesRef.current.has(`${loadedChapter._id}-${i}`) ||
                                  loadedInChapter.has(i),
                              );

                            return (
                              <div
                                key={`${loadedChapter._id}-${imageIndex}`}
                                className="flex justify-center reader-image-container"
                                style={{ marginBottom: `${pageGap}px` }}
                              >
                                <div
                                  className="relative w-full flex justify-center px-0 sm:px-4"
                                  data-chapter={loadedChapter._id}
                                  data-page={imageIndex + 1}
                                  style={{
                                    maxWidth: isMobile ? "100%" : `${imageWidth}px`,
                                    opacity: visible ? 1 : 0,
                                    transition: "opacity 200ms ease-out, filter 200ms ease-out",
                                    ...imageFilterStyle,
                                  }}
                                >
                                  {/* Skeleton loader пока изображение загружается */}
                                  {!isImageLoaded && !isError && (
                                    <div
                                      className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--card)] rounded-lg overflow-hidden"
                                      style={{
                                        minHeight: isMobile ? "400px" : "600px",
                                        aspectRatio: "3/4",
                                      }}
                                    >
                                      {/* Анимированный gradient skeleton */}
                                      <div
                                        className="absolute inset-0 bg-gradient-to-r from-[var(--muted)] via-[var(--card)] to-[var(--muted)] animate-shimmer"
                                        style={{ backgroundSize: "200% 100%" }}
                                      />
                                      {/* Иконка и текст */}
                                      <div className="relative z-10 flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                                          <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                        </div>
                                        <span className="text-sm text-[var(--muted-foreground)]">
                                          Страница {imageIndex + 1}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {!isError ? (
                                    <Image
                                      key={`${loadedChapter._id}-${imageIndex}-${imageWidth}-${imageQuality}-${useFallback ? "fb" : "pr"}`}
                                      loader={imageLoader}
                                      src={imageUrl}
                                      alt={`Глава ${loadedChapter.number}, Страница ${imageIndex + 1}`}
                                      width={isMobile ? 800 : imageWidth}
                                      height={
                                        isMobile ? 1200 : Math.round((imageWidth * 1600) / 1200)
                                      }
                                      className={`${imageFitClass} shadow-lg sm:shadow-2xl ${isImageLoaded ? "opacity-100" : "opacity-0 transition-opacity duration-300"}`}
                                      quality={imageQuality}
                                      loading="lazy"
                                      onLoad={() => {
                                        loadedImagesRef.current.add(imageLoadKey);
                                        setLoadedImagesByChapter(prev => ({
                                          ...prev,
                                          [loadedChapter._id]: new Set(
                                            prev[loadedChapter._id] ?? [],
                                          ).add(imageIndex),
                                        }));
                                      }}
                                      onError={() =>
                                        handleImageError(loadedChapter._id, imageIndex, src)
                                      }
                                    />
                                  ) : (
                                    <div className="w-full min-h-[180px] sm:min-h-[240px] bg-gradient-to-b from-[var(--card)] to-[var(--secondary)]/50 flex items-center justify-center px-4 rounded-lg border border-[var(--border)]/50">
                                      <div className="text-center max-w-xs">
                                        <p className="text-sm text-[var(--muted-foreground)]">
                                          Не удалось загрузить изображение
                                        </p>
                                        <button
                                          onClick={() => {
                                            setImageLoadErrors(prev => {
                                              const newSet = new Set(prev);
                                              newSet.delete(errorKey);
                                              return newSet;
                                            });
                                          }}
                                          className="mt-2 px-3 py-1.5 bg-[var(--primary)] text-white text-xs rounded-lg"
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
                        </div>

                        {/* Реакции на загруженную главу */}
                        <div
                          className="mx-auto px-0 sm:px-4 mt-8"
                          style={{ maxWidth: isMobile ? "100%" : `${imageWidth}px` }}
                        >
                          <ChapterReactions
                            chapterId={loadedChapter._id}
                            titleId={titleId}
                            initialRating={
                              loadedChapter.averageRating != null ||
                              loadedChapter.ratingCount != null ||
                              loadedChapter.userRating != null
                                ? {
                                    averageRating: loadedChapter.averageRating,
                                    ratingSum: loadedChapter.ratingSum,
                                    ratingCount: loadedChapter.ratingCount,
                                    userRating: loadedChapter.userRating,
                                  }
                                : undefined
                            }
                            initialReactions={
                              loadedChapter.reactions?.length ? loadedChapter.reactions : undefined
                            }
                          />
                        </div>

                        <ChapterCommentsSection chapterId={loadedChapter._id} />

                        {/* Триггер и индикатор для последней загруженной главы */}
                        {isLastLoadedChapter && (
                          <div className="py-8 sm:py-12 border-t border-[var(--border)] mt-8 sm:mt-10">
                            <div ref={infiniteScrollTriggerRef} className="h-1" />

                            {isLoadingNextChapter && (
                              <div className="flex flex-col items-center justify-center gap-3 py-4">
                                <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-[var(--muted-foreground)]">
                                  Загрузка следующей главы...
                                </p>
                              </div>
                            )}

                            {!isLoadingNextChapter && !hasMoreChapters && (
                              <div className="text-center py-4">
                                <p className="text-base font-semibold text-[var(--foreground)]">
                                  Вы прочитали все доступные главы!
                                </p>
                                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                  Загружено глав: {loadedChapters.length}
                                </p>
                                <button
                                  onClick={() => router.push(getTitlePath())}
                                  className="mt-4 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/80 rounded-xl transition-colors text-sm"
                                >
                                  Вернуться к тайтлу
                                </button>
                              </div>
                            )}

                            {!isLoadingNextChapter && hasMoreChapters && (
                              <div className="text-center text-xs text-[var(--muted-foreground)] py-2">
                                Прокрутите вниз для загрузки следующей главы
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Сообщение о завершении всех глав (только без бесконечного чтения) */}
              {!infiniteScroll && currentChapterIndex === chapters.length - 1 && (
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
        entityTitle={`Глава ${effectiveChapter.number}${shouldShowChapterTitle(effectiveChapter.title, effectiveChapter.number) ? ` - ${effectiveChapter.title}` : ""}`}
        titleId={title._id}
      />

      {/* Floating Progress Bar — плавная полоса прогресса чтения (включить в настройках читалки) */}
      {showProgress && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] h-1 overflow-hidden rounded-b-full"
          role="progressbar"
          aria-valuenow={Math.round((currentPage / Math.max(effectiveChapter.images.length, 1)) * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Трек */}
          <div className="absolute inset-0 bg-[var(--muted)]/20 backdrop-blur-[2px]" />
          {/* Заполнение с градиентом и скруглением */}
          <div
            className="absolute inset-y-0 left-0 min-w-[4px] rounded-r-full bg-gradient-to-r from-[var(--primary)] via-[var(--primary)] to-[var(--accent)] transition-[width] duration-500 ease-out"
            style={{
              width: `${Math.max(0, Math.min(100, (currentPage / Math.max(effectiveChapter.images.length, 1)) * 100))}%`,
              boxShadow: "0 0 12px rgba(var(--primary-rgb), 0.35)",
            }}
          />
          {/* Верхний блик для объёма */}
          <div
            className="absolute inset-y-0 left-0 rounded-r-full pointer-events-none opacity-30 transition-[width] duration-500 ease-out"
            style={{
              width: `${Math.max(0, Math.min(100, (currentPage / Math.max(effectiveChapter.images.length, 1)) * 100))}%`,
              background: "linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, transparent 60%)",
            }}
          />
        </div>
      )}

      {/* Scroll to Top Button — показывается только после прокрутки вниз */}
      {isHeaderVisible && lastScrollY > 600 && (
        <button
          onClick={scrollToTop}
          className="fixed left-4 z-[50] p-3 bg-[var(--card)]/95 backdrop-blur-sm border border-[var(--border)] rounded-full shadow-lg transition-all duration-300 hover:bg-[var(--accent)] hover:scale-110 active:scale-95 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
          title="Вернуться наверх"
        >
          <ChevronUp className="w-5 h-5 text-[var(--foreground)]" />
        </button>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardHints && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reader-keyboard-hints-title"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowKeyboardHints(false)}
          />
          <div className="relative w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                  <Keyboard className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <h3
                  id="reader-keyboard-hints-title"
                  className="font-semibold text-lg text-[var(--foreground)]"
                >
                  Горячие клавиши
                </h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[var(--foreground)]">Предыдущая глава</span>
                <kbd className="px-3 py-1.5 bg-[var(--secondary)] rounded-lg text-xs font-mono border border-[var(--border)]">
                  ←
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[var(--foreground)]">Следующая глава</span>
                <kbd className="px-3 py-1.5 bg-[var(--secondary)] rounded-lg text-xs font-mono border border-[var(--border)]">
                  →
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[var(--foreground)]">Выйти из полноэкранного</span>
                <kbd className="px-3 py-1.5 bg-[var(--secondary)] rounded-lg text-xs font-mono border border-[var(--border)]">
                  Esc
                </kbd>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]/50">
              <button
                onClick={() => setShowKeyboardHints(false)}
                className="w-full py-2.5 bg-[var(--secondary)] hover:bg-[var(--accent)] rounded-xl text-sm font-medium transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Image Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Увеличенное изображение страницы"
        >
          <div className="relative max-w-[95vw] max-h-[95vh] animate-in zoom-in-90 duration-200">
            <Image
              src={zoomedImage.src}
              alt={zoomedImage.alt}
              width={1920}
              height={2560}
              className="max-w-full max-h-[95vh] object-contain"
              quality={100}
              priority
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <span className="sr-only">Закрыть</span>
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
