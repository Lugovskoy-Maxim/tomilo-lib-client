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
      <div className="hidden sm:flex fixed right-1 top-1/2 -translate-y-1/2 z-40 flex-col gap-5">
        {/* Счётчик страниц */}
        <div className="w-full flex justify-center">
          <p className="text-[var(--muted-foreground)] text-sm border border-[var(--border)] bg-[var(--background)]/90 rounded-xl px-2 py-1">
            {currentPage} / {chapterImageLength}
          </p>
        </div>

        {/* Основные кнопки управления */}
        <div className="flex flex-col items-center space-y-2 w-12">
          {/* Кнопка автоскролла */}
          <button
            onClick={toggleAutoScroll}
            className={`p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95 ${
              isAutoScrolling ? "text-[var(--primary)] bg-[var(--primary)]/10" : ""
            }`}
            title={isAutoScrolling ? "Остановить автопрокрутку" : "Начать автопрокрутку"}
          >
            {isAutoScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Кнопка настроек */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95 ${
              isSettingsOpen ? "text-[var(--primary)] bg-[var(--primary)]/10" : ""
            }`}
            title="Настройки"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className="p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Предыдущая глава"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleMenuToggle}
            className="relative p-1.5 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95"
            title={`Глава ${currentChapter.number}`}
          >
            <span className="text-xs font-bold text-[var(--primary)] min-w-[1.2rem] text-center">
              {currentChapter.number}
            </span>
          </button>

          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Следующая глава"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleBookmarkToggle}
            disabled={isBookmarkLoading}
            className={`p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95 ${
              isBookmarked ? "text-[var(--primary)]" : ""
            } ${isBookmarkLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            title={isBookmarked ? "Удалить из закладок" : "Добавить в закладки"}
          >
            {isBookmarkLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
              <Bookmark className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} />
            )}
          </button>

          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className="p-2 relative bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95"
            title="Комментарии"
          >
            <MessageCircle className={`w-4 h-4 ${isCommentsOpen ? "text-[var(--primary)]" : ""}`} />
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
              className={`relative p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95 overflow-hidden ${isPressing ? 'scale-95' : ''}`}
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
              <RefreshCw className={`w-4 h-4 relative z-10 ${isPressing ? 'animate-spin' : ''}`} />
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
      <div className={`sm:hidden fixed z-[45] ${isMenuHidden ? 'bottom-12 -right-3' : 'bottom-12 left-0 right-0'}`}>
        {showPageCounter && (
          <div className={`flex ${isMenuHidden ? 'justify-center -translate-x-1/2' : 'justify-center'}`}>
            <p className="text-[var(--primary)] text-xs border border-[var(--border)] bg-[var(--background)]/85 rounded-lg px-2 py-0.5">
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
          className={`absolute right-5 bottom-1 p-2 bg-[var(--card)] border border-[var(--border)] text-[var(--primary)] rounded-full hover:bg-[var(--accent)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 shadow-lg ${
            hideBottomMenuSetting && isMenuHidden
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-75 pointer-events-none"
          }`}
          title="Показать меню"
        >
          <svg
            className="w-4 h-4 text-[var(--muted-foreground)]"
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
          className={`flex items-center justify-center gap-5 p-1 transition-all duration-300 ${
            hideBottomMenuSetting && isMenuHidden
              ? "opacity-0 scale-95 pointer-events-none"
              : "opacity-100 scale-100 pointer-events-auto"
          }`}
        >
          <button
            onClick={toggleAutoScroll}
            className={`p-2 bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 ${
              isAutoScrolling ? "text-[var(--primary)] bg-[var(--background)]/90" : ""
            }`}
            title={isAutoScrolling ? "Остановить автопрокрутку" : "Начать автопрокрутку"}
          >
            {isAutoScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2 bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 ${
              isSettingsOpen ? "text-[var(--primary)] bg-[var(--background)]/90" : ""
            }`}
            title="Настройки"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Блок с кнопками глав */}
          <div className="flex items-center gap-5 bg-[var(--card)] border border-[var(--border)] rounded-full">
            <button
              onClick={onPrev}
              disabled={!canGoPrev}
              className="p-2 rounded-full hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              title="Предыдущая глава"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--muted-foreground)]" />
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex flex-col items-center px-2 py-1 hover:bg-[var(--muted)] rounded-lg transition-colors active:scale-95"
              title={`Глава ${currentChapter.number}`}
            >
              <span className="text-sm font-medium text-[var(--foreground)]">
                {currentChapter.number}
              </span>
            </button>

            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="p-2 rounded-full hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              title="Следующая глава"
            >
              <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
            </button>
          </div>

          {/* Кнопка комментариев */}
          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className={`p-2 bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 ${
              isCommentsOpen ? "text-[var(--primary)] bg-[var(--primary)]/10" : ""
            }`}
            title="Комментарии"
          >
            <MessageCircle className="w-4 h-4" />
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
              className={`relative p-2 bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 overflow-hidden ${isPressing ? 'scale-95' : ''}`}
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
              <RefreshCw className={`w-4 h-4 relative z-10 ${isPressing ? 'animate-spin' : ''}`} />
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
        <div className="fixed sm:right-14 sm:top-1/2 sm:-translate-y-1/2 bottom-20 left-4 right-4 sm:left-auto sm:w-80 w-auto max-h-96 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl z-[60] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)]">
            <input
              type="text"
              placeholder="Поиск главы..."
              value={chapterSearch}
              onChange={e => setChapterSearch(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {filteredChapters.map(chapter => (
              <button
                key={chapter._id}
                onClick={() => {
                  onChapterSelect(chapter._id);
                  setIsMenuOpen(false);
                  setChapterSearch("");
                }}
                className={`w-full px-4 py-3 text-left hover:bg-[var(--muted)] transition-colors ${
                  chapter._id === currentChapter._id
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : ""
                }`}
              >
                <div className="font-medium">Глава {chapter.number}</div>
                {chapter.title && (
                  <div className="text-sm text-[var(--muted-foreground)] truncate">
                    {chapter.title}
                  </div>
                )}
              </button>
            ))}
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
