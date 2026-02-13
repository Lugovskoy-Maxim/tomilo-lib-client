"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Download,
  Wifi,
  WifiOff,
} from "lucide-react";
import { ReaderChapter } from "@/types/chapter";
import { CommentsSection } from "@/shared/comments";
import { CommentEntityType } from "@/types/comment";
import { ReportModal } from "@/shared/report/ReportModal";
import ThemeToggle from "@/shared/theme-toggle/ThemeToggle";
import ThemeToggleGroup from "@/shared/theme-toggle/ThemeToggleGroup";
import { useAutoScroll, useBookmark, useReaderSettings, useRefreshButton, READ_CHAPTERS_IN_ROW_ENABLED } from "./hooks";

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
  preloadAllImages?: boolean;
  onPreloadChange?: (value: boolean) => void;
  preloadProgress?: number;
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
  preloadAllImages = false,
  onPreloadChange,
  preloadProgress = 0,
}: ReaderControlsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Custom hooks
  const {
    isAutoScrolling,
    autoScrollSpeed,
    setAutoScrollSpeed,
    stopAutoScroll,
    toggleAutoScroll,
  } = useAutoScroll({ onAutoScrollStart });

  const {
    isBookmarked,
    isBookmarkLoading,
    handleBookmarkToggle,
  } = useBookmark({ titleId });

  const {
    showPageCounter,
    setShowPageCounter,
    readChaptersInRow,
    setReadChaptersInRow,
  } = useReaderSettings();

  const {
    isPressing,
    pressProgress,
    showRefreshTooltip,
    startPressing,
    stopPressing,
    handleSimpleClick,
  } = useRefreshButton();

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

  // Ref для скролла к текущей главе
  const currentChapterRef = useRef<HTMLButtonElement>(null);
  const chapterListRef = useRef<HTMLDivElement>(null);

  // Скролл к текущей главе при открытии меню
  useEffect(() => {
    if (isMenuOpen && currentChapterRef.current && chapterListRef.current) {
      setTimeout(() => {
        currentChapterRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [isMenuOpen]);

  const filteredChapters = chapters.filter(
    chapter =>
      chapter.number.toString().includes(chapterSearch) ||
      chapter.title.toLowerCase().includes(chapterSearch.toLowerCase()),
  );

  // Остановка автопрокрутки при открытии меню или скролле
  useEffect(() => {
    if (forceStopAutoScroll && isAutoScrolling) {
      stopAutoScroll();
    }
  }, [forceStopAutoScroll, isAutoScrolling, stopAutoScroll]);

  return (
    <>
      {/* Панель настроек */}
      {isSettingsOpen && (
        <div ref={settingsPanelRef} className="fixed inset-0 z-[70]">
          {/* Десктопная панель */}
          <div
            className="absolute inset-y-0 right-0 w-[420px] bg-[var(--card)]/95 backdrop-blur-md border-l border-[var(--border)] shadow-2xl sm:block hidden transform transition-transform duration-300 ease-in-out rounded-l-3xl"
            style={{ transform: "translateX(0)" }}
          >
            <div className="p-6 border-b border-[var(--border)] bg-[var(--background)]/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-[var(--foreground)] flex items-center gap-2">
                  <Settings className="w-6 h-6 text-[var(--primary)]" />
                  Настройки
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-[var(--muted)] rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Закрыть"
                >
                  <X className="w-6 h-6 text-[var(--muted-foreground)]" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-8">
              {/* Ширина изображения */}
              {onImageWidthChange && (
                <div className="bg-[var(--background)]/50 rounded-2xl p-4 border border-[var(--border)]">
                  <label className="block text-sm font-medium mb-3">
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
                  <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-2">
                    <span>768px</span>
                    <span>1440px</span>
                  </div>
                </div>
              )}

              {/* Скорость автоскролла */}
              <div className="bg-[var(--background)]/50 rounded-2xl p-4 border border-[var(--border)]">
                <label className="block text-sm font-medium mb-3">Скорость автоскролла</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["slow", "medium", "fast"] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => setAutoScrollSpeed(speed)}
                      className={`px-4 py-3 text-sm rounded-xl transition-colors ${
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
              <div className="bg-[var(--background)]/50 rounded-2xl p-4 border border-[var(--border)]">
                <label className="block text-sm font-medium mb-3">Тема</label>
                <ThemeToggleGroup />
              </div>

              {/* Переключатель счетчика страниц */}
              <div className="bg-[var(--background)]/50 rounded-2xl p-4 border border-[var(--border)]">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPageCounter}
                    onChange={() => setShowPageCounter(!showPageCounter)}
                    className="sr-only"
                  />
                  <div
                    className={`relative w-14 h-7 bg-[var(--muted)] rounded-full transition-colors ${
                      showPageCounter ? "bg-[var(--primary)]" : ""
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${
                        showPageCounter ? "transform translate-x-7" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="ml-4 text-sm">Отображать счетчик страниц</span>
                </label>
              </div>

              {/* Переключатель скрытия нижнего меню */}
              <div className="bg-[var(--background)]/50 rounded-2xl p-4 border border-[var(--border)]">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideBottomMenuSetting}
                    onChange={() => onHideBottomMenuChange?.(!hideBottomMenuSetting)}
                    className="sr-only"
                  />
                  <div
                    className={`relative w-14 h-7 bg-[var(--muted)] rounded-full transition-colors ${
                      hideBottomMenuSetting ? "bg-[var(--primary)]" : ""
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${
                        hideBottomMenuSetting ? "transform translate-x-7" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="ml-4 text-sm">Скрывать нижнее меню</span>
                </label>
              </div>

              {/* Чтение глав подряд (отключено) */}
              {READ_CHAPTERS_IN_ROW_ENABLED && (
                <div className="bg-[var(--background)]/50 rounded-2xl p-4 border border-[var(--border)]">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={readChaptersInRow}
                      onChange={() => setReadChaptersInRow(!readChaptersInRow)}
                      className="sr-only"
                    />
                    <div
                      className={`relative w-14 h-7 bg-[var(--muted)] rounded-full transition-colors ${
                        readChaptersInRow ? "bg-[var(--primary)]" : ""
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${
                          readChaptersInRow ? "transform translate-x-7" : ""
                        }`}
                      ></div>
                    </div>
                    <span className="ml-4 text-sm">Чтение глав подряд</span>
                  </label>
                  <p className="text-xs text-[var(--muted-foreground)] mt-2 ml-0">
                    При прокрутке до конца или начала подгружается следующая/предыдущая глава, адрес обновляется.
                  </p>
                </div>
              )}

              {/* Переключатель предзагрузки всех изображений */}
              {onPreloadChange && (
                <div className="bg-[var(--background)]/50 rounded-2xl p-4 border border-[var(--border)]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${preloadAllImages ? 'bg-[var(--primary)]/10' : 'bg-[var(--muted)]'}`}>
                      {preloadAllImages ? (
                        <Download className="w-5 h-5 text-[var(--primary)]" />
                      ) : (
                        <Wifi className="w-5 h-5 text-[var(--muted-foreground)]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preloadAllImages}
                          onChange={() => onPreloadChange(!preloadAllImages)}
                          className="sr-only"
                        />
                        <div
                          className={`relative w-14 h-7 bg-[var(--muted)] rounded-full transition-colors ${
                            preloadAllImages ? "bg-[var(--primary)]" : ""
                          }`}
                        >
                          <div
                            className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${
                              preloadAllImages ? "transform translate-x-7" : ""
                            }`}
                          ></div>
                        </div>
                        <span className="ml-3 text-sm font-medium">Предзагружать всю главу</span>
                      </label>
                      <p className="text-xs text-[var(--muted-foreground)] mt-2 leading-relaxed">
                        Для нестабильного интернета. Загружает все страницы сразу, но требует больше трафика.
                      </p>
                    </div>
                  </div>
                  
                  {/* Прогресс предзагрузки */}
                  {preloadAllImages && preloadProgress > 0 && preloadProgress < 100 && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-[var(--muted-foreground)]">Загрузка главы...</span>
                        <span className="font-medium text-[var(--primary)]">{preloadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                          style={{ width: `${preloadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {preloadAllImages && preloadProgress === 100 && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Глава полностью загружена</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Мобильная панель */}
          <div
            className="sm:hidden fixed bottom-0 left-0 right-0 bg-[var(--card)]/95 backdrop-blur-md border-t border-[var(--border)] shadow-2xl z-[70] max-h-[70vh] overflow-y-auto rounded-t-3xl"
          >
            <div className="p-5 border-b border-[var(--border)] sticky top-0 bg-[var(--background)]/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-[var(--foreground)] flex items-center gap-2">
                  <Settings className="w-6 h-6 text-[var(--primary)]" />
                  Настройки
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-[var(--muted)] rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Закрыть"
                >
                  <X className="w-6 h-6 text-[var(--muted-foreground)]" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-[var(--background)]/50 rounded-2xl p-4 border border-[var(--border)]">
                <label className="block text-sm font-medium mb-3">Скорость автоскролла</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["slow", "medium", "fast"] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => setAutoScrollSpeed(speed)}
                      className={`px-4 py-3 text-sm rounded-xl transition-colors ${
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

              <div className="bg-[var(--background)]/50 rounded-2xl p-4 border border-[var(--border)]">
                <label className="block text-sm font-medium mb-3">Тема</label>
                <ThemeToggleGroup />
              </div>

              <div className="bg-[var(--background)]/50 rounded-2xl p-4 border border-[var(--border)]">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPageCounter}
                    onChange={() => setShowPageCounter(!showPageCounter)}
                    className="sr-only"
                  />
                  <div
                    className={`relative w-14 h-7 bg-[var(--muted)] rounded-full transition-colors ${
                      showPageCounter ? "bg-[var(--primary)]" : ""
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${
                        showPageCounter ? "transform translate-x-7" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="ml-4 text-sm">Отображать счетчик страниц</span>
                </label>
              </div>

              <div className="bg-[var(--background)]/50 rounded-2xl p-4 border border-[var(--border)]">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideBottomMenuSetting}
                    onChange={() => onHideBottomMenuChange?.(!hideBottomMenuSetting)}
                    className="sr-only"
                  />
                  <div
                    className={`relative w-14 h-7 bg-[var(--muted)] rounded-full transition-colors ${
                      hideBottomMenuSetting ? "bg-[var(--primary)]" : ""
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${
                        hideBottomMenuSetting ? "transform translate-x-7" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="ml-4 text-sm">Скрывать нижнее меню</span>
                </label>
              </div>

              {READ_CHAPTERS_IN_ROW_ENABLED && (
                <div className="bg-[var(--background)]/50 rounded-2xl p-4 border border-[var(--border)]">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={readChaptersInRow}
                      onChange={() => setReadChaptersInRow(!readChaptersInRow)}
                      className="sr-only"
                    />
                    <div
                      className={`relative w-14 h-7 bg-[var(--muted)] rounded-full transition-colors ${
                        readChaptersInRow ? "bg-[var(--primary)]" : ""
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${
                          readChaptersInRow ? "transform translate-x-7" : ""
                        }`}
                      ></div>
                    </div>
                    <span className="ml-4 text-sm">Чтение глав подряд</span>
                  </label>
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">При прокрутке подгружается следующая/предыдущая глава.</p>
                </div>
              )}

              {/* Переключатель предзагрузки - мобильная версия */}
              {onPreloadChange && (
                <div className="bg-[var(--background)]/50 rounded-2xl p-4 border border-[var(--border)]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${preloadAllImages ? 'bg-[var(--primary)]/10' : 'bg-[var(--muted)]'}`}>
                      {preloadAllImages ? (
                        <Download className="w-5 h-5 text-[var(--primary)]" />
                      ) : (
                        <Wifi className="w-5 h-5 text-[var(--muted-foreground)]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preloadAllImages}
                          onChange={() => onPreloadChange(!preloadAllImages)}
                          className="sr-only"
                        />
                        <div
                          className={`relative w-14 h-7 bg-[var(--muted)] rounded-full transition-colors ${
                            preloadAllImages ? "bg-[var(--primary)]" : ""
                          }`}
                        >
                          <div
                            className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${
                              preloadAllImages ? "transform translate-x-7" : ""
                            }`}
                          ></div>
                        </div>
                        <span className="ml-3 text-sm font-medium">Предзагружать всю главу</span>
                      </label>
                      <p className="text-xs text-[var(--muted-foreground)] mt-2 leading-relaxed">
                        Для нестабильного интернета. Загружает все страницы сразу.
                      </p>
                    </div>
                  </div>
                  
                  {/* Прогресс предзагрузки - мобильная версия */}
                  {preloadAllImages && preloadProgress > 0 && preloadProgress < 100 && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-[var(--muted-foreground)]">Загрузка...</span>
                        <span className="font-medium text-[var(--primary)]">{preloadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                          style={{ width: `${preloadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
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
          isMenuHidden ? 'bottom-16 right-2 xs:right-4 opacity-100' : 'bottom-16 left-0 right-0 opacity-100'
        }`}
      >
        {showPageCounter && (
          <div className={`flex transition-all duration-300 ease-in-out ${isMenuHidden ? 'justify-end' : 'justify-center'}`}>
            <p className={`text-[var(--primary)] text-xs xs:text-sm font-medium border border-[var(--border)] bg-[var(--card)]/95 rounded-lg xs:rounded-xl px-2 xs:px-3 py-1 xs:py-1.5 shadow-lg backdrop-blur-sm transition-all duration-300 ${isMenuHidden ? 'scale-90' : 'scale-100'}`}>
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
          className={`absolute right-3 xs:right-5 bottom-1 min-h-[40px] xs:min-h-[44px] min-w-[40px] xs:min-w-[44px] p-1.5 xs:p-2 bg-[var(--chart-1)]/90 border border-[var(--border)] text-[var(--primary)] rounded-full hover:bg-[var(--accent)] transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 shadow-lg flex items-center justify-center ${
            hideBottomMenuSetting && isMenuHidden
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-50 translate-y-4 pointer-events-none"
          }`}
          title="Показать меню"
        >
          <svg
            className="w-4 h-4 xs:w-5 xs:h-5 text-[var(--primary)]"
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
          className={`flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 p-1.5 xs:p-2 transition-all duration-500 ease-out ${
            hideBottomMenuSetting && isMenuHidden
              ? "opacity-0 scale-90 translate-y-8 pointer-events-none"
              : "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          }`}
        >
          <button
            onClick={toggleAutoScroll}
            className={`min-h-[40px] xs:min-h-[44px] min-w-[40px] xs:min-w-[44px] p-1.5 xs:p-2 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 ${
              isAutoScrolling ? "text-[var(--primary)] bg-[var(--background)]/90" : ""
            }`}
            title={isAutoScrolling ? "Остановить автопрокрутку" : "Начать автопрокрутку"}
          >
            {isAutoScrolling ? <Pause className="w-4 h-4 xs:w-5 xs:h-5" /> : <Play className="w-4 h-4 xs:w-5 xs:h-5" />}
          </button>

          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`min-h-[40px] xs:min-h-[44px] min-w-[40px] xs:min-w-[44px] p-1.5 xs:p-2 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 ${
              isSettingsOpen ? "text-[var(--primary)] bg-[var(--background)]/90" : ""
            }`}
            title="Настройки"
          >
            <Settings className="w-4 h-4 xs:w-5 xs:h-5" />
          </button>

          {/* Блок с кнопками глав */}
          <div className="flex items-center gap-1 xs:gap-2 bg-[var(--card)] border border-[var(--border)] rounded-full px-1 xs:px-2">
            <button
              onClick={onPrev}
              disabled={!canGoPrev}
              className="min-h-[40px] xs:min-h-[44px] min-w-[40px] xs:min-w-[44px] p-1.5 xs:p-2 flex items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              title="Предыдущая глава"
            >
              <ChevronLeft className="w-4 h-4 xs:w-5 xs:h-5 text-[var(--muted-foreground)]" />
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="min-h-[40px] xs:min-h-[44px] min-w-[40px] xs:min-w-[44px] flex flex-col items-center justify-center px-2 xs:px-3 hover:bg-[var(--muted)] rounded-lg transition-colors active:scale-95"
              title={`Глава ${currentChapter.number}`}
            >
              <span className="text-xs xs:text-sm font-medium text-[var(--foreground)]">
                {currentChapter.number}
              </span>
            </button>

            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="min-h-[40px] xs:min-h-[44px] min-w-[40px] xs:min-w-[44px] p-1.5 xs:p-2 flex items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              title="Следующая глава"
            >
              <ChevronRight className="w-4 h-4 xs:w-5 xs:h-5 text-[var(--muted-foreground)]" />
            </button>
          </div>

          {/* Кнопка комментариев */}
          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className={`min-h-[40px] xs:min-h-[44px] min-w-[40px] xs:min-w-[44px] p-1.5 xs:p-2 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 ${
              isCommentsOpen ? "text-[var(--primary)] bg-[var(--primary)]/10" : ""
            }`}
            title="Комментарии"
          >
            <MessageCircle className="w-4 h-4 xs:w-5 xs:h-5" />
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
              className={`relative min-h-[40px] xs:min-h-[44px] min-w-[40px] xs:min-w-[44px] p-1.5 xs:p-2 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 overflow-hidden ${isPressing ? 'scale-95' : ''}`}
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
              <RefreshCw className={`w-4 h-4 xs:w-5 xs:h-5 relative z-10 ${isPressing ? 'animate-spin' : ''}`} />
            </button>
            
            {showRefreshTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 xs:px-3 py-1.5 xs:py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg text-xs text-[var(--foreground)] whitespace-nowrap z-50 animate-fade-in">
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
          <div ref={chapterListRef} className="flex-1 overflow-y-auto p-2 space-y-1">
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
                  ref={chapter._id === currentChapter._id ? currentChapterRef : null}
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
          <div className="hidden sm:block fixed right-20 top-1/2 -translate-y-1/2 w-[420px] max-h-[85vh] bg-[var(--card)]/95 backdrop-blur-md border border-[var(--border)] rounded-3xl shadow-2xl z-[60] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--background)]/50">
              <h3 className="font-semibold text-lg text-[var(--foreground)] flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-[var(--primary)]" />
                Комментарии к главе
              </h3>
              <button
                onClick={() => setIsCommentsOpen(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Закрыть"
              >
                <X className="w-6 h-6 text-[var(--muted-foreground)]" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-5">
              <CommentsSection
                entityType={CommentEntityType.CHAPTER}
                entityId={currentChapter._id}
              />
            </div>
          </div>

          {/* Мобильная панель комментариев */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[60] bg-[var(--card)]/95 backdrop-blur-md border-t border-[var(--border)] shadow-2xl max-h-[85vh] flex flex-col rounded-t-3xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--background)]/50 backdrop-blur-sm">
              <h3 className="font-semibold text-lg text-[var(--foreground)] flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-[var(--primary)]" />
                Комментарии к главе
              </h3>
              <button
                onClick={() => setIsCommentsOpen(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Закрыть"
              >
                <X className="w-6 h-6 text-[var(--muted-foreground)]" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
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
