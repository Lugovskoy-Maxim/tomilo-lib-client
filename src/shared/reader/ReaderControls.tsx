"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  X,
  Bookmark,
  Settings,
  Play,
  Pause,
  RefreshCw,
  List,
} from "lucide-react";
import { ReaderChapter } from "@/types/chapter";
import { CommentsSection } from "@/shared/comments";
import { CommentEntityType } from "@/types/comment";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { ReportModal } from "@/shared/report/ReportModal";
import ThemeToggle from "@/shared/theme-toggle/ThemeToggle";
import ThemeToggleGroup from "@/shared/theme-toggle/ThemeToggleGroup";

interface ReaderControlsProps {
  currentChapter: ReaderChapter;
  chapters: ReaderChapter[];
  onChapterSelect: (chapterId: string) => void;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  currentPage: number;
  chapterImageLength: number;
  titleId: string;
  creatorId?: string;
  imageWidth?: number;
  onImageWidthChange?: (width: number) => void;
  isMenuHidden?: boolean;
  hideBottomMenuSetting?: boolean;
  onHideBottomMenuChange?: (value: boolean) => void;
  onToggleMenu?: () => void;
  forceStopAutoScroll?: boolean;
  onMenuOpen?: () => void;
  onAutoScrollStart?: () => void;
}

export default function ReaderControls({
  currentPage,
  chapterImageLength,
  currentChapter,
  chapters,
  onChapterSelect,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  titleId,
  creatorId,
  imageWidth,
  onImageWidthChange,
  isMenuHidden = false,
  hideBottomMenuSetting = false,
  onHideBottomMenuChange,
  onToggleMenu,
  forceStopAutoScroll = false,
  onMenuOpen,
  onAutoScrollStart,
}: ReaderControlsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollInterval, setAutoScrollInterval] = useState<NodeJS.Timeout | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState<"slow" | "medium" | "fast">("medium");
  const autoScrollSpeedRef = useRef(autoScrollSpeed);
  const [showPageCounter, setShowPageCounter] = useState(true);
  
  // Состояния для кнопки обновления с удержанием
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const [showRefreshTooltip, setShowRefreshTooltip] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Загрузка настроек из localStorage
  useEffect(() => {
    const savedAutoScrollSpeed = localStorage.getItem("reader-auto-scroll-speed");
    if (savedAutoScrollSpeed && ["slow", "medium", "fast"].includes(savedAutoScrollSpeed)) {
      setAutoScrollSpeed(savedAutoScrollSpeed as "slow" | "medium" | "fast");
    }
    
    const savedShowPageCounter = localStorage.getItem("reader-show-page-counter");
    if (savedShowPageCounter !== null) {
      setShowPageCounter(savedShowPageCounter === "true");
    }
  }, []);
  
  const toast = useToast();
  const { user, addBookmark, removeBookmark, isAuthenticated } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const router = useRouter();

  // Обновление закладки при изменении данных пользователя
  useEffect(() => {
    setIsBookmarked(user?.bookmarks?.includes(titleId) ?? false);
  }, [user?.bookmarks, titleId]);

  // Синхронизация ref со скоростью автоскролла
  useEffect(() => {
    autoScrollSpeedRef.current = autoScrollSpeed;
  }, [autoScrollSpeed]);

  // Сохранение настроек в localStorage при их изменении
  useEffect(() => {
    localStorage.setItem("reader-auto-scroll-speed", autoScrollSpeed);
  }, [autoScrollSpeed]);

  useEffect(() => {
    localStorage.setItem("reader-show-page-counter", showPageCounter.toString());
  }, [showPageCounter]);

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen && onMenuOpen) {
      onMenuOpen();
    }
  }, [isMenuOpen, onMenuOpen]);

  const settingsPanelRef = useRef<HTMLDivElement>(null);

  // Закрытие панели настроек при клике вне её
  const handleSettingsClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        isSettingsOpen &&
        settingsPanelRef.current &&
        !settingsPanelRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    },
    [isSettingsOpen],
  );

  useEffect(() => {
    if (isSettingsOpen) {
      document.addEventListener("mousedown", handleSettingsClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleSettingsClickOutside);
    };
  }, [isSettingsOpen, handleSettingsClickOutside]);

  // Слушатель события открытия меню главы из NavigationHeader
  useEffect(() => {
    const handleOpenChapterMenu = () => {
      setIsMenuOpen(true);
      if (onMenuOpen) {
        onMenuOpen();
      }
    };

    window.addEventListener('openChapterMenu', handleOpenChapterMenu);
    return () => {
      window.removeEventListener('openChapterMenu', handleOpenChapterMenu);
    };
  }, [onMenuOpen]);

  const filteredChapters = chapters.filter(
    chapter =>
      chapter.number.toString().includes(chapterSearch) ||
      chapter.title.toLowerCase().includes(chapterSearch.toLowerCase()),
  );

  const stopAutoScroll = useCallback(() => {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }
    setIsAutoScrolling(false);
  }, [autoScrollInterval]);

  // Остановка автопрокрутки при открытии меню или скролле
  useEffect(() => {
    if (forceStopAutoScroll && isAutoScrolling) {
      stopAutoScroll();
    }
  }, [forceStopAutoScroll, isAutoScrolling, stopAutoScroll]);

  const startAutoScroll = useCallback(() => {
    if (isAutoScrolling) return;
    setIsAutoScrolling(true);

    const speedMap = { slow: 1, medium: 3, fast: 6 };
    const speed = speedMap[autoScrollSpeed];

    const interval = setInterval(() => {
      window.scrollBy({ top: speed, behavior: "auto" });

      if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        stopAutoScroll();
      }
    }, 20);

    setAutoScrollInterval(interval);
  }, [isAutoScrolling, autoScrollSpeed, stopAutoScroll]);

  const toggleAutoScroll = useCallback(() => {
    isAutoScrolling ? stopAutoScroll() : startAutoScroll();
    if (!isAutoScrolling && onAutoScrollStart) {
      onAutoScrollStart();
    }
  }, [isAutoScrolling, startAutoScroll, stopAutoScroll, onAutoScrollStart]);

  // Очистка интервала при размонтировании
  useEffect(() => {
    return () => {
      if (autoScrollInterval) clearInterval(autoScrollInterval);
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [autoScrollInterval]);

  // Обработчики для удержания кнопки обновления
  const startPressing = useCallback(() => {
    setIsPressing(true);
    setPressProgress(0);
    setShowRefreshTooltip(false);
    
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += 2;
      setPressProgress(Math.min(progress, 100));
    }, 100);
    
    pressTimerRef.current = setTimeout(() => {
      router.refresh();
      setIsPressing(false);
      setPressProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }, 5000);
  }, [router]);

  const stopPressing = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    if (isPressing && pressProgress < 100) {
      setShowRefreshTooltip(true);
      setTimeout(() => setShowRefreshTooltip(false), 2000);
    }
    
    setIsPressing(false);
    setPressProgress(0);
  }, [isPressing, pressProgress]);

  const handleSimpleClick = useCallback(() => {
    if (!isPressing && pressProgress === 0) {
      setShowRefreshTooltip(true);
      setTimeout(() => setShowRefreshTooltip(false), 2000);
    }
  }, [isPressing, pressProgress]);

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      toast.warning("Пожалуйста, авторизуйтесь, чтобы добавить в закладки");
      return;
    }

    setIsBookmarkLoading(true);

    try {
      const result = isBookmarked ? await removeBookmark(titleId) : await addBookmark(titleId);

      if (result.success) {
        setIsBookmarked(!isBookmarked);
      } else {
        toast.error(`Ошибка при работе с закладками: ${result.error}`);
      }
    } catch (error) {
      console.error("Ошибка при работе с закладками:", error);
      toast.error("Произошла ошибка при работе с закладками");
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  return (
    <>
      {/* Панель настроек */}
      {isSettingsOpen && (
        <div ref={settingsPanelRef} className="fixed inset-0 z-[70]">
          {/* Десктопная панель */}
          <div
            className="absolute inset-y-0 right-0 w-96 bg-[var(--card)] border-l border-[var(--border)] shadow-xl sm:block hidden transform transition-transform duration-300 ease-in-out"
            style={{ transform: "translateX(0)" }}
          >
            <div className="p-4 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--foreground)]">Настройки</h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                  title="Закрыть"
                >
                  <X className="w-5 h-5 text-[var(--muted-foreground)]" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-6">
              {/* Ширина изображения */}
              {onImageWidthChange && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ширина картинки: {imageWidth}px
                  </label>
                  <input
                    type="range"
                    min="768"
                    max="1440"
                    step="64"
                    value={imageWidth}
                    onChange={e => onImageWidthChange(Number(e.target.value))}
                    className="w-full h-2 bg-[var(--muted)] rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
                    <span>768px</span>
                    <span>1440px</span>
                  </div>
                </div>
              )}

              {/* Скорость автоскролла */}
              <div>
                <label className="block text-sm font-medium mb-2">Скорость автоскролла</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["slow", "medium", "fast"] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => setAutoScrollSpeed(speed)}
                      className={`px-3 py-2 text-sm rounded transition-colors ${
                        autoScrollSpeed === speed
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "bg-[var(--secondary)] hover:bg-[var(--accent)]"
                      }`}
                    >
                      {speed === "slow" ? "Медленно" : speed === "medium" ? "Средне" : "Быстро"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Тема */}
              <div>
                <label className="block text-sm font-medium mb-2">Тема</label>
                <ThemeToggleGroup />
              </div>

              {/* Переключатель счетчика страниц */}
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPageCounter}
                    onChange={() => setShowPageCounter(prev => !prev)}
                    className="sr-only"
                  />
                  <div
                    className={`relative w-11 h-6 bg-[var(--muted)] rounded-full transition-colors ${
                      showPageCounter ? "bg-[var(--primary)]" : ""
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        showPageCounter ? "transform translate-x-5" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="ml-3 text-sm">Отображать счетчик страниц</span>
                </label>
              </div>

              {/* Переключатель скрытия нижнего меню */}
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideBottomMenuSetting}
                    onChange={() => onHideBottomMenuChange?.(!hideBottomMenuSetting)}
                    className="sr-only"
                  />
                  <div
                    className={`relative w-11 h-6 bg-[var(--muted)] rounded-full transition-colors ${
                      hideBottomMenuSetting ? "bg-[var(--primary)]" : ""
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        hideBottomMenuSetting ? "transform translate-x-5" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="ml-3 text-sm">Скрывать нижнее меню</span>
                </label>
              </div>
            </div>
          </div>

          {/* Мобильная панель */}
          <div
            className="sm:hidden fixed bottom-0 left-0 right-0 bg-[var(--card)] border-t border-[var(--border)] shadow-lg z-[70] max-h-[70vh] overflow-y-auto"
          >
            <div className="p-4 border-b border-[var(--border)] sticky top-0 bg-[var(--card)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--foreground)]">Настройки</h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                  title="Закрыть"
                >
                  <X className="w-5 h-5 text-[var(--muted-foreground)]" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Скорость автоскролла</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["slow", "medium", "fast"] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => setAutoScrollSpeed(speed)}
                      className={`px-3 py-2 text-sm rounded transition-colors ${
                        autoScrollSpeed === speed
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "bg-[var(--secondary)] hover:bg-[var(--accent)]"
                      }`}
                    >
                      {speed === "slow" ? "Медленно" : speed === "medium" ? "Средне" : "Быстро"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Тема</label>
                <ThemeToggleGroup />
              </div>

              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPageCounter}
                    onChange={() => setShowPageCounter(!showPageCounter)}
                    className="sr-only"
                  />
                  <div
                    className={`relative w-11 h-6 bg-[var(--muted)] rounded-full transition-colors ${
                      showPageCounter ? "bg-[var(--primary)]" : ""
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        showPageCounter ? "transform translate-x-5" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="ml-3 text-sm">Отображать счетчик страниц</span>
                </label>
              </div>

              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideBottomMenuSetting}
                    onChange={() => onHideBottomMenuChange?.(!hideBottomMenuSetting)}
                    className="sr-only"
                  />
                  <div
                    className={`relative w-11 h-6 bg-[var(--muted)] rounded-full transition-colors ${
                      hideBottomMenuSetting ? "bg-[var(--primary)]" : ""
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        hideBottomMenuSetting ? "transform translate-x-5" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="ml-3 text-sm">Скрывать нижнее меню</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Боковое меню (десктоп) */}
      <div className="hidden sm:flex fixed right-4 top-1/2 -translate-y-1/2 z-40 flex-col gap-3">
        {/* Счётчик страниц */}
        <div className="w-full flex justify-center">
          <p className="text-[var(--muted-foreground)] text-sm border border-[var(--border)] bg-[var(--card)]/95 rounded-2xl shadow-lg px-3 py-1.5 font-medium backdrop-blur-sm">
            {currentPage} / {chapterImageLength}
          </p>
        </div>

        {/* Основные кнопки управления */}
        <div className="flex flex-col items-center gap-2 bg-[var(--card)]/95 border border-[var(--border)] rounded-2xl p-3 shadow-lg backdrop-blur-sm">
          {/* Кнопка автоскролла */}
          <button
            onClick={toggleAutoScroll}
            className={`p-3 min-h-[44px] min-w-[44px] flex items-center justify-center bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-110 active:scale-95 ${
              isAutoScrolling ? "text-[var(--primary)] bg-[var(--primary)]/10" : ""
            }`}
            title={isAutoScrolling ? "Остановить автопрокрутку" : "Начать автопрокрутку"}
          >
            {isAutoScrolling ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          {/* Кнопка настроек */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-3 min-h-[44px] min-w-[44px] flex items-center justify-center bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-110 active:scale-95 ${
              isSettingsOpen ? "text-[var(--primary)] bg-[var(--primary)]/10" : ""
            }`}
            title="Настройки"
          >
            <Settings className="w-5 h-5" />
          </button>

          <div className="w-8 h-px bg-[var(--border)] my-1" />

          <button
            onClick={handleBookmarkToggle}
            disabled={isBookmarkLoading}
            className={`p-3 min-h-[44px] min-w-[44px] flex items-center justify-center bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-110 active:scale-95 ${
              isBookmarked ? "text-[var(--primary)]" : ""
            } ${isBookmarkLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            title={isBookmarked ? "Удалить из закладок" : "Добавить в закладки"}
          >
            {isBookmarkLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <Bookmark className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} />
            )}
          </button>

          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center relative bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-110 active:scale-95"
            title="Комментарии"
          >
            <MessageCircle className={`w-5 h-5 ${isCommentsOpen ? "text-[var(--primary)]" : ""}`} />
          </button>

          {/* Кнопка обновления страницы с удержанием */}
          <div className="relative">
            <button
              onMouseDown={startPressing}
              onMouseUp={stopPressing}
              onMouseLeave={stopPressing}
              onTouchStart={startPressing}
              onTouchEnd={stopPressing}
              onClick={handleSimpleClick}
              className={`relative p-3 min-h-[44px] min-w-[44px] flex items-center justify-center bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-110 active:scale-95 overflow-hidden ${isPressing ? 'scale-95' : ''}`}
              title="Удерживайте 5 секунд для обновления"
            >
              {isPressing && (
                <div
                  className="absolute inset-0 bg-[var(--primary)]/30 transition-all duration-100 ease-linear"
                  style={{
                    clipPath: `inset(0 ${100 - pressProgress}% 0 0)`
                  }}
                />
              )}
              <RefreshCw className={`w-5 h-5 relative z-10 ${isPressing ? 'animate-spin' : ''}`} />
            </button>

            {showRefreshTooltip && (
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg text-xs text-[var(--foreground)] whitespace-nowrap z-50 animate-fade-in">
                Удерживайте 5 секунд
                <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-[var(--card)]" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Мобильный счётчик */}
      <div
        className={`sm:hidden fixed z-[45] transition-all duration-300 ease-in-out ${
          isMenuHidden ? 'bottom-16 right-4 opacity-100' : 'bottom-16 left-0 right-0 opacity-100'
        }`}
      >
        {showPageCounter && (
          <div className={`flex transition-all duration-300 ease-in-out ${isMenuHidden ? 'justify-end' : 'justify-center'}`}>
            <p className={`text-[var(--primary)] text-sm font-medium border border-[var(--border)] bg-[var(--card)]/95 rounded-xl px-3 py-1.5 shadow-lg backdrop-blur-sm transition-all duration-300 ${isMenuHidden ? 'scale-90' : 'scale-100'}`}>
              {currentPage} / {chapterImageLength}
            </p>
          </div>
        )}
      </div>

      {/* Мобильное нижнее меню */}
      <div className="sm:hidden fixed bottom-2 z-[55] left-0 right-0">
        {/* Свернутое меню - только иконка бургер */}
        <button
          onClick={() => {
            onToggleMenu?.();
            onMenuOpen?.();
          }}
          className={`absolute right-5 bottom-1 min-h-[44px] min-w-[44px] p-2 bg-[var(--card)] border border-[var(--border)] text-[var(--primary)] rounded-full hover:bg-[var(--accent)] transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 shadow-lg flex items-center justify-center ${
            hideBottomMenuSetting && isMenuHidden
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-50 translate-y-4 pointer-events-none"
          }`}
          title="Показать меню"
        >
          <svg
            className="w-5 h-5 text-[var(--muted-foreground)]"
            fill="none"
            stroke="white"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Развернутое меню */}
        <div
          className={`flex items-center justify-center gap-3 p-2 transition-all duration-500 ease-out ${
            hideBottomMenuSetting && isMenuHidden
              ? "opacity-0 scale-90 translate-y-8 pointer-events-none"
              : "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          }`}
        >
          <button
            onClick={toggleAutoScroll}
            className={`min-h-[44px] min-w-[44px] p-2 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 ${
              isAutoScrolling ? "text-[var(--primary)] bg-[var(--background)]/90" : ""
            }`}
            title={isAutoScrolling ? "Остановить автопрокрутку" : "Начать автопрокрутку"}
          >
            {isAutoScrolling ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`min-h-[44px] min-w-[44px] p-2 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 ${
              isSettingsOpen ? "text-[var(--primary)] bg-[var(--background)]/90" : ""
            }`}
            title="Настройки"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Блок с кнопками глав */}
          <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-full px-2">
            <button
              onClick={onPrev}
              disabled={!canGoPrev}
              className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              title="Предыдущая глава"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center px-3 hover:bg-[var(--muted)] rounded-lg transition-colors active:scale-95"
              title={`Глава ${currentChapter.number}`}
            >
              <span className="text-sm font-medium text-[var(--foreground)]">
                {currentChapter.number}
              </span>
            </button>

            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              title="Следующая глава"
            >
              <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
          </div>

          {/* Кнопка комментариев */}
          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className={`min-h-[44px] min-w-[44px] p-2 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 ${
              isCommentsOpen ? "text-[var(--primary)] bg-[var(--primary)]/10" : ""
            }`}
            title="Комментарии"
          >
            <MessageCircle className="w-5 h-5" />
          </button>

          {/* Кнопка обновления страницы с удержанием */}
          <div className="relative">
            <button
              onMouseDown={startPressing}
              onMouseUp={stopPressing}
              onMouseLeave={stopPressing}
              onTouchStart={startPressing}
              onTouchEnd={stopPressing}
              onClick={handleSimpleClick}
              className={`relative min-h-[44px] min-w-[44px] p-2 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 overflow-hidden ${isPressing ? 'scale-95' : ''}`}
              title="Удерживайте 5 секунд"
            >
              {isPressing && (
                <div 
                  className="absolute inset-0 bg-[var(--primary)]/30 transition-all duration-100 ease-linear"
                  style={{ 
                    clipPath: `inset(0 ${100 - pressProgress}% 0 0)` 
                  }}
                />
              )}
              <RefreshCw className={`w-5 h-5 relative z-10 ${isPressing ? 'animate-spin' : ''}`} />
            </button>
            
            {showRefreshTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg text-xs text-[var(--foreground)] whitespace-nowrap z-50 animate-fade-in">
                Удерживайте 5 секунд
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--card)]" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Выпадающее меню выбора главы */}
      {isMenuOpen && (
        <div className="fixed sm:right-24 sm:top-1/2 sm:-translate-y-1/2 bottom-0 left-0 right-0 sm:left-auto sm:w-96 w-auto max-h-[70vh] sm:max-h-[80vh] bg-[var(--card)] border border-[var(--border)] sm:rounded-2xl rounded-t-2xl shadow-2xl z-[60] overflow-hidden flex flex-col">
          {/* Заголовок с поиском */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--background)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                <List className="w-5 h-5 text-[var(--primary)]" />
                Выбор главы
              </h3>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors min-h-[40px] min-w-[40px] touch-manipulation"
                title="Закрыть"
              >
                <X className="w-5 h-5 text-[var(--muted-foreground)]" />
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск по номеру или названию..."
                value={chapterSearch}
                onChange={e => setChapterSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all text-sm"
              />
              <List className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            </div>
          </div>
          
          {/* Список глав */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredChapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mb-4">
                  <List className="w-8 h-8 text-[var(--muted-foreground)]" />
                </div>
                <p className="text-[var(--muted-foreground)] text-sm">Главы не найдены</p>
                <p className="text-[var(--muted-foreground)]/60 text-xs mt-1">Попробуйте изменить поисковый запрос</p>
              </div>
            ) : (
              filteredChapters.map(chapter => (
                <button
                  key={chapter._id}
                  onClick={() => {
                    onChapterSelect(chapter._id);
                    setIsMenuOpen(false);
                    setChapterSearch("");
                  }}
                  className={`w-full px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                    chapter._id === currentChapter._id
                      ? "bg-[var(--primary)]/10 border border-[var(--primary)]/30"
                      : "hover:bg-[var(--accent)] border border-transparent hover:border-[var(--border)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Номер главы */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      chapter._id === currentChapter._id
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--secondary)] text-[var(--foreground)] group-hover:bg-[var(--primary)]/20"
                    }`}>
                      {chapter.number}
                    </div>
                    
                    {/* Информация о главе */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${
                        chapter._id === currentChapter._id ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                      }`}>
                        {chapter.title || `Глава ${chapter.number}`}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mt-0.5">
                        <span>{chapter.date ? new Date(chapter.date).toLocaleDateString('ru-RU') : ''}</span>
                        {chapter.views > 0 && (
                          <>
                            <span>•</span>
                            <span>{chapter.views.toLocaleString('ru-RU')} просмотров</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Индикатор текущей главы */}
                    {chapter._id === currentChapter._id && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                        <svg className="w-4 h-4 text-[var(--primary-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
          
          {/* Футер с информацией */}
          <div className="p-3 border-t border-[var(--border)] bg-[var(--background)] text-center">
            <p className="text-xs text-[var(--muted-foreground)]">
              {filteredChapters.length} из {chapters.length} глав
            </p>
          </div>
        </div>
      )}

      {/* Overlay для закрытия меню */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={() => {
            setIsMenuOpen(false);
            setChapterSearch("");
          }}
        />
      )}

      {/* Панель комментариев */}
      {isCommentsOpen && (
        <>
          {/* Overlay для закрытия панели комментариев */}
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm sm:hidden"
            onClick={() => setIsCommentsOpen(false)}
          />

          {/* Боковая панель комментариев (десктоп) */}
          <div className="hidden sm:block fixed right-14 top-1/2 -translate-y-1/2 w-96 max-h-[80vh] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl z-[60] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--background)]">
              <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[var(--primary)]" />
                Комментарии к главе
              </h3>
              <button
                onClick={() => setIsCommentsOpen(false)}
                className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                title="Закрыть"
              >
                <X className="w-4 h-4 text-[var(--muted-foreground)]" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-60px)] p-4">
              <CommentsSection
                entityType={CommentEntityType.CHAPTER}
                entityId={currentChapter._id}
              />
            </div>
          </div>

          {/* Мобильная панель комментариев */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[60] bg-[var(--card)] border-t border-[var(--border)] shadow-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--background)]">
              <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[var(--primary)]" />
                Комментарии к главе
              </h3>
              <button
                onClick={() => setIsCommentsOpen(false)}
                className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                title="Закрыть"
              >
                <X className="w-5 h-5 text-[var(--muted-foreground)]" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <CommentsSection
                entityType={CommentEntityType.CHAPTER}
                entityId={currentChapter._id}
              />
            </div>
          </div>
        </>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        entityType="chapter"
        entityId={currentChapter._id}
        entityTitle={`Глава ${currentChapter.number}${
          currentChapter.title ? ` - ${currentChapter.title}` : ""
        }`}
        titleId={titleId}
        creatorId={creatorId}
      />
    </>
  );
}
