"use client";

import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react";
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
  Sun,
  Contrast,
  Eye,
  RotateCcw,
  Grid3X3,
  Timer,
  Percent,
  BookOpen,
  LayoutList,
} from "lucide-react";
import { ReaderChapter } from "@/types/chapter";
import { CommentsSection } from "@/shared/comments";
import { CommentEntityType } from "@/types/comment";
import { ReportModal } from "@/shared/report/ReportModal";
import ThemeToggleGroup from "@/shared/theme-toggle/ThemeToggleGroup";
import { useAutoScroll, useBookmark, useReaderSettingsContext, useRefreshButton } from "./hooks";
import PageThumbnails from "./PageThumbnails";
import { useGetCommentsQuery } from "@/store/api/commentsApi";
import type { ImageQualityMode } from "./hooks";

interface ImageQualitySelectorProps {
  imageQuality: ImageQualityMode;
  setImageQuality: (quality: ImageQualityMode) => void;
}

function ImageQualitySelector({ imageQuality, setImageQuality }: ImageQualitySelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Качество изображений</span>
        <span className="text-sm font-medium text-[var(--foreground)]">
          {imageQuality === "low" ? "НИЗКОЕ" : imageQuality === "medium" ? "СРЕДНЕЕ" : imageQuality === "high" ? "ВЫСОКОЕ" : "АВТО"}
        </span>
      </div>
      <div className="flex bg-[var(--secondary)] rounded-xl p-1">
        <button
          onClick={() => setImageQuality("low")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
            imageQuality === "low"
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          60%
        </button>
        <button
          onClick={() => setImageQuality("medium")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
            imageQuality === "medium"
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          75%
        </button>
        <button
          onClick={() => setImageQuality("high")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
            imageQuality === "high"
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          90%
        </button>
        <button
          onClick={() => setImageQuality("auto")}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
            imageQuality === "auto"
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          Авто
        </button>
      </div>
      <p className="text-[10px] text-[var(--muted-foreground)]">
        Низкое качество быстрее загружается на медленном интернете
      </p>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SettingsRow({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 px-3 rounded-xl bg-[var(--secondary)]/50 hover:bg-[var(--secondary)]/70 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <Icon className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />}
        <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ToggleSwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`w-11 h-6 rounded-full transition-colors relative ${on ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${on ? "translate-x-6 left-0.5" : "translate-x-0 left-0.5"}`}
      />
    </button>
  );
}

function SegmentOption<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex bg-[var(--secondary)] rounded-xl p-1">
      {options.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            value === v ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"
          }`}
        >
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </button>
      ))}
    </div>
  );
}

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
  onJumpToPage?: (page: number) => void;
  chapterImages?: string[];
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
  onJumpToPage,
  chapterImages = [],
}: ReaderControlsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isJumpPopoverOpen, setIsJumpPopoverOpen] = useState(false);
  const [isPageGridOpen, setIsPageGridOpen] = useState(false);
  const [readingTime, setReadingTime] = useState(0);

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
    readingMode,
    setReadingMode,
    pageGap,
    setPageGap,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    eyeComfortMode,
    setEyeComfortMode,
    fitMode,
    setFitMode,
    infiniteScroll,
    setInfiniteScroll,
    showTimer,
    setShowTimer,
    showHints,
    setShowHints,
    showProgress,
    setShowProgress,
    imageQuality,
    setImageQuality,
    resetToDefaults,
  } = useReaderSettingsContext();

  const {
    isPressing,
    pressProgress,
    showRefreshTooltip,
    startPressing,
    stopPressing,
    handleSimpleClick,
  } = useRefreshButton();

  // Получаем количество комментариев
  const { data: commentsData } = useGetCommentsQuery({
    entityType: CommentEntityType.CHAPTER,
    entityId: currentChapter._id,
    page: 1,
    limit: 1,
  });
  const commentsCount = commentsData?.data?.total || 0;

  // Настройка продолжения чтения
  const [instantContinue, setInstantContinueState] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("reader-instant-continue") === "true";
  });

  const toggleInstantContinue = useCallback(() => {
    setInstantContinueState(prev => {
      const newValue = !prev;
      localStorage.setItem("reader-instant-continue", newValue.toString());
      return newValue;
    });
  }, []);

  // Таймер чтения
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    // Сбрасываем таймер при смене главы
    setReadingTime(0);
    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      setReadingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentChapter._id]);

  const formatReadingTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const desktopJumpPopoverRef = useRef<HTMLDivElement>(null);
  const mobileJumpPopoverRef = useRef<HTMLDivElement>(null);

  // Swipe-to-dismiss for mobile panels
  const mobileSettingsPanelRef = useRef<HTMLDivElement>(null);
  const mobileCommentsPanelRef = useRef<HTMLDivElement>(null);
  const [settingsDragY, setSettingsDragY] = useState(0);
  const [commentsDragY, setCommentsDragY] = useState(0);
  const settingsDragStartY = useRef<number | null>(null);
  const commentsDragStartY = useRef<number | null>(null);

  const handleSettingsTouchStart = useCallback((e: React.TouchEvent) => {
    settingsDragStartY.current = e.touches[0].clientY;
  }, []);

  const handleSettingsTouchMove = useCallback((e: React.TouchEvent) => {
    if (settingsDragStartY.current === null) return;
    const delta = e.touches[0].clientY - settingsDragStartY.current;
    if (delta > 0) {
      setSettingsDragY(delta);
    }
  }, []);

  const handleSettingsTouchEnd = useCallback(() => {
    if (settingsDragY > 100) {
      setIsSettingsOpen(false);
    }
    setSettingsDragY(0);
    settingsDragStartY.current = null;
  }, [settingsDragY]);

  const handleCommentsTouchStart = useCallback((e: React.TouchEvent) => {
    commentsDragStartY.current = e.touches[0].clientY;
  }, []);

  const handleCommentsTouchMove = useCallback((e: React.TouchEvent) => {
    if (commentsDragStartY.current === null) return;
    const delta = e.touches[0].clientY - commentsDragStartY.current;
    if (delta > 0) {
      setCommentsDragY(delta);
    }
  }, []);

  const handleCommentsTouchEnd = useCallback(() => {
    if (commentsDragY > 100) {
      setIsCommentsOpen(false);
    }
    setCommentsDragY(0);
    commentsDragStartY.current = null;
  }, [commentsDragY]);

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

  const chapterProgressPercent = Math.max(
    0,
    Math.min(100, Math.round((currentPage / Math.max(chapterImageLength, 1)) * 100)),
  );

  const jumpPageItems = useMemo(() => {
    const total = Math.max(chapterImageLength, 1);
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [chapterImageLength]);

  const handleJumpToPage = useCallback((targetPage: number) => {
    if (!onJumpToPage) return;
    const target = Math.min(Math.max(Math.floor(targetPage), 1), chapterImageLength);
    onJumpToPage(target);
    setIsJumpPopoverOpen(false);
  }, [chapterImageLength, onJumpToPage]);

  const handleCounterClick = useCallback(() => {
    if (!onJumpToPage) return;
    setIsJumpPopoverOpen(prev => !prev);
  }, [onJumpToPage]);

  useEffect(() => {
    if (!isJumpPopoverOpen) return;
    const handleClickOutside = (event: PointerEvent) => {
      const isInDesktopPopover =
        desktopJumpPopoverRef.current?.contains(event.target as Node) ?? false;
      const isInMobilePopover =
        mobileJumpPopoverRef.current?.contains(event.target as Node) ?? false;

      if (!isInDesktopPopover && !isInMobilePopover) {
        setIsJumpPopoverOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [isJumpPopoverOpen]);

  // Остановка автопрокрутки при открытии меню или скролле
  useEffect(() => {
    if (forceStopAutoScroll && isAutoScrolling) {
      stopAutoScroll();
    }
  }, [forceStopAutoScroll, isAutoScrolling, stopAutoScroll]);

  return (
    <>
      {/* Панель настроек — новый дизайн */}
      {isSettingsOpen && (
        <div ref={settingsPanelRef} className="fixed inset-0 z-[70]">
          {/* Оверлей */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsSettingsOpen(false)}
          />
          
          {/* Десктопная панель */}
          <div className="absolute inset-y-0 right-0 w-[400px] lg:w-[420px] bg-[var(--card)] border-l border-[var(--border)] shadow-2xl sm:flex hidden flex-col animate-in slide-in-from-right duration-300">
            {/* Заголовок */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <span className="font-semibold text-base">Настройки читалки</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetToDefaults}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Сбросить
                </button>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
                </button>
              </div>
            </div>

            {/* Контент */}
            <div className="flex-1 overflow-y-auto px-5 py-4 pb-12 space-y-8">
              <SettingsSection title="Чтение">
                <div className="space-y-3">
                  <span className="text-[11px] text-[var(--muted-foreground)]">Режим отображения</span>
                  <div className="flex bg-[var(--secondary)] rounded-xl p-1">
                    <button
                      onClick={() => setReadingMode("feed")}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        readingMode === "feed" ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      Лента
                    </button>
                    <button
                      onClick={() => setReadingMode("paged")}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        readingMode === "paged" ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      По страницам
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[11px] text-[var(--muted-foreground)]">Переход по главам</span>
                  <SegmentOption
                    options={[
                      { value: "one" as const, label: "По одной главе", icon: BookOpen },
                      { value: "feed" as const, label: "Лентой", icon: LayoutList },
                    ]}
                    value={infiniteScroll ? "feed" : "one"}
                    onChange={v => setInfiniteScroll(v === "feed")}
                  />
                </div>
              </SettingsSection>

              <SettingsSection title="Экран">
                <div className="space-y-2">
                  <span className="text-[11px] text-[var(--muted-foreground)]">Тема</span>
                  <ThemeToggleGroup />
                </div>
                <div className="space-y-2">
                  <span className="text-[11px] text-[var(--muted-foreground)]">Вмещать изображения</span>
                  <SegmentOption
                    options={[
                      { value: "width" as const, label: "По ширине" },
                      { value: "height" as const, label: "По высоте" },
                    ]}
                    value={fitMode}
                    onChange={v => setFitMode(v)}
                  />
                </div>
                {onHideBottomMenuChange && (
                  <div className="space-y-2">
                    <span className="text-[11px] text-[var(--muted-foreground)]">Показ нижнего меню</span>
                    <SegmentOption
                      options={[
                        { value: "scroll" as const, label: "Скроллом" },
                        { value: "click" as const, label: "Только кликом" },
                      ]}
                      value={hideBottomMenuSetting ? "click" : "scroll"}
                      onChange={v => onHideBottomMenuChange(v === "click")}
                    />
                  </div>
                )}
              </SettingsSection>

              <SettingsSection title="Отображение">
                <SettingsRow label="Нумерация страниц" icon={List}>
                  <ToggleSwitch on={showPageCounter} onClick={() => setShowPageCounter(!showPageCounter)} />
                </SettingsRow>
                <SettingsRow label="Прогресс главы" icon={Percent}>
                  <ToggleSwitch on={showProgress} onClick={() => setShowProgress(!showProgress)} />
                </SettingsRow>
                <SettingsRow label="Время чтения" icon={Timer}>
                  <ToggleSwitch on={showTimer} onClick={() => setShowTimer(!showTimer)} />
                </SettingsRow>
                {onHideBottomMenuChange && (
                  <SettingsRow label="Скрывать нижнее меню" icon={Eye}>
                    <ToggleSwitch on={hideBottomMenuSetting} onClick={() => onHideBottomMenuChange(!hideBottomMenuSetting)} />
                  </SettingsRow>
                )}
              </SettingsSection>

              <SettingsSection title="Изображения">
                {onImageWidthChange && (
                  <div className="space-y-2 py-2 px-3 rounded-xl bg-[var(--secondary)]/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--foreground)]">Ширина контейнера</span>
                      <span className="font-medium text-[var(--primary)]">{imageWidth} px</span>
                    </div>
                    <input
                      type="range"
                      min="320"
                      max="1440"
                      step="20"
                      value={imageWidth}
                      onChange={e => onImageWidthChange(Number(e.target.value))}
                      className="w-full h-2 bg-[var(--muted)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:shadow-md"
                    />
                  </div>
                )}
                <div className="space-y-2 py-2 px-3 rounded-xl bg-[var(--secondary)]/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground)]">Яркость</span>
                    <span className="font-medium text-[var(--primary)]">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={brightness}
                    onChange={e => setBrightness(Number(e.target.value))}
                    className="w-full h-2 bg-[var(--muted)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:shadow-md"
                  />
                </div>
                <ImageQualitySelector imageQuality={imageQuality} setImageQuality={setImageQuality} />
              </SettingsSection>

              <SettingsSection title="Автопрокрутка">
                <div className="space-y-2 py-2 px-3 rounded-xl bg-[var(--secondary)]/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground)]">Скорость</span>
                    <span className="font-medium text-[var(--primary)]">
                      {autoScrollSpeed === "slow" ? "Медленно" : autoScrollSpeed === "medium" ? "Средне" : "Быстро"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="1"
                    value={autoScrollSpeed === "slow" ? 0 : autoScrollSpeed === "medium" ? 1 : 2}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setAutoScrollSpeed(val === 0 ? "slow" : val === 1 ? "medium" : "fast");
                    }}
                    className="w-full h-2 bg-[var(--muted)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:shadow-md"
                  />
                </div>
              </SettingsSection>

              {onPreloadChange && (
                <SettingsSection title="Дополнительно">
                  <SettingsRow
                    label={preloadAllImages && preloadProgress > 0 && preloadProgress < 100 ? `Предзагрузка главы (${preloadProgress}%)` : "Предзагрузка главы"}
                    icon={Download}
                  >
                    <ToggleSwitch on={preloadAllImages} onClick={() => onPreloadChange(!preloadAllImages)} />
                  </SettingsRow>
                </SettingsSection>
              )}
            </div>
          </div>

          {/* Мобильная панель */}
          <div 
            ref={mobileSettingsPanelRef}
            className="sm:hidden fixed inset-x-0 bottom-0 max-h-[90vh] bg-[var(--card)] border-t border-[var(--border)] shadow-2xl z-[70] overflow-hidden rounded-t-3xl animate-in slide-in-from-bottom duration-300 flex flex-col"
            style={{ transform: `translateY(${settingsDragY}px)`, opacity: 1 - settingsDragY / 300 }}
            onTouchStart={handleSettingsTouchStart}
            onTouchMove={handleSettingsTouchMove}
            onTouchEnd={handleSettingsTouchEnd}
          >
            {/* Ручка для свайпа */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-[var(--muted-foreground)]/30 rounded-full" />
            </div>

            {/* Заголовок */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
              <span className="font-semibold text-base">Настройки читалки</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetToDefaults}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Сбросить
                </button>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--muted-foreground)]" />
                </button>
              </div>
            </div>

            {/* Контент — та же структура, что и на десктопе */}
            <div className="flex-1 overflow-y-auto px-5 py-4 pb-12 space-y-8">
              <SettingsSection title="Чтение">
                <div className="space-y-3">
                  <span className="text-[11px] text-[var(--muted-foreground)]">Режим отображения</span>
                  <div className="flex bg-[var(--secondary)] rounded-xl p-1">
                    <button
                      onClick={() => setReadingMode("feed")}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        readingMode === "feed" ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      Лента
                    </button>
                    <button
                      onClick={() => setReadingMode("paged")}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        readingMode === "paged" ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      По страницам
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[11px] text-[var(--muted-foreground)]">Переход по главам</span>
                  <SegmentOption
                    options={[
                      { value: "one" as const, label: "По одной главе", icon: BookOpen },
                      { value: "feed" as const, label: "Лентой", icon: LayoutList },
                    ]}
                    value={infiniteScroll ? "feed" : "one"}
                    onChange={v => setInfiniteScroll(v === "feed")}
                  />
                </div>
              </SettingsSection>

              <SettingsSection title="Экран">
                <div className="space-y-2">
                  <span className="text-[11px] text-[var(--muted-foreground)]">Тема</span>
                  <ThemeToggleGroup />
                </div>
                <div className="space-y-2">
                  <span className="text-[11px] text-[var(--muted-foreground)]">Вмещать изображения</span>
                  <SegmentOption
                    options={[
                      { value: "width" as const, label: "По ширине" },
                      { value: "height" as const, label: "По высоте" },
                    ]}
                    value={fitMode}
                    onChange={v => setFitMode(v)}
                  />
                </div>
                {onHideBottomMenuChange && (
                  <div className="space-y-2">
                    <span className="text-[11px] text-[var(--muted-foreground)]">Показ нижнего меню</span>
                    <SegmentOption
                      options={[
                        { value: "scroll" as const, label: "Скроллом" },
                        { value: "click" as const, label: "Только кликом" },
                      ]}
                      value={hideBottomMenuSetting ? "click" : "scroll"}
                      onChange={v => onHideBottomMenuChange(v === "click")}
                    />
                  </div>
                )}
              </SettingsSection>

              <SettingsSection title="Отображение">
                <SettingsRow label="Нумерация страниц" icon={List}>
                  <ToggleSwitch on={showPageCounter} onClick={() => setShowPageCounter(!showPageCounter)} />
                </SettingsRow>
                <SettingsRow label="Прогресс главы" icon={Percent}>
                  <ToggleSwitch on={showProgress} onClick={() => setShowProgress(!showProgress)} />
                </SettingsRow>
                <SettingsRow label="Время чтения" icon={Timer}>
                  <ToggleSwitch on={showTimer} onClick={() => setShowTimer(!showTimer)} />
                </SettingsRow>
                {onHideBottomMenuChange && (
                  <SettingsRow label="Скрывать нижнее меню" icon={Eye}>
                    <ToggleSwitch on={hideBottomMenuSetting} onClick={() => onHideBottomMenuChange(!hideBottomMenuSetting)} />
                  </SettingsRow>
                )}
              </SettingsSection>

              <SettingsSection title="Изображения">
                {onImageWidthChange && (
                  <div className="space-y-2 py-2 px-3 rounded-xl bg-[var(--secondary)]/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--foreground)]">Ширина контейнера</span>
                      <span className="font-medium text-[var(--primary)]">{imageWidth} px</span>
                    </div>
                    <input
                      type="range"
                      min="320"
                      max="1440"
                      step="20"
                      value={imageWidth}
                      onChange={e => onImageWidthChange(Number(e.target.value))}
                      className="w-full h-2 bg-[var(--muted)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:shadow-md"
                    />
                  </div>
                )}
                <div className="space-y-2 py-2 px-3 rounded-xl bg-[var(--secondary)]/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground)]">Яркость</span>
                    <span className="font-medium text-[var(--primary)]">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={brightness}
                    onChange={e => setBrightness(Number(e.target.value))}
                    className="w-full h-2 bg-[var(--muted)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:shadow-md"
                  />
                </div>
                <ImageQualitySelector imageQuality={imageQuality} setImageQuality={setImageQuality} />
              </SettingsSection>

              <SettingsSection title="Автопрокрутка">
                <div className="space-y-2 py-2 px-3 rounded-xl bg-[var(--secondary)]/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground)]">Скорость</span>
                    <span className="font-medium text-[var(--primary)]">
                      {autoScrollSpeed === "slow" ? "Медленно" : autoScrollSpeed === "medium" ? "Средне" : "Быстро"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="1"
                    value={autoScrollSpeed === "slow" ? 0 : autoScrollSpeed === "medium" ? 1 : 2}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setAutoScrollSpeed(val === 0 ? "slow" : val === 1 ? "medium" : "fast");
                    }}
                    className="w-full h-2 bg-[var(--muted)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:shadow-md"
                  />
                </div>
              </SettingsSection>

              {onPreloadChange && (
                <SettingsSection title="Дополнительно">
                  <SettingsRow
                    label={preloadAllImages && preloadProgress > 0 && preloadProgress < 100 ? `Предзагрузка главы (${preloadProgress}%)` : "Предзагрузка главы"}
                    icon={Download}
                  >
                    <ToggleSwitch on={preloadAllImages} onClick={() => onPreloadChange(!preloadAllImages)} />
                  </SettingsRow>
                </SettingsSection>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Боковое меню (десктоп) */}
      <div className="hidden sm:flex fixed right-4 top-1/2 -translate-y-1/2 z-40 flex-col gap-3">
        {/* Счётчик страниц с улучшенным визуальным feedback */}
        <div className="w-full flex justify-center">
          <div className="relative" ref={desktopJumpPopoverRef}>
            <button
              type="button"
              onClick={handleCounterClick}
              className="group relative overflow-hidden text-sm border border-[var(--border)] bg-[var(--card)]/95 rounded-2xl shadow-lg px-4 py-2 font-medium backdrop-blur-sm hover:bg-[var(--accent)] transition-all duration-300 hover:scale-105 hover:shadow-xl"
              title={onJumpToPage ? "Нажмите для перехода к странице" : "Счётчик страниц"}
            >
              {/* Progress background */}
              {showProgress && (
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent)]/20 transition-all duration-500"
                  style={{ width: `${chapterProgressPercent}%` }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span className="text-[var(--primary)] font-bold">{currentPage}</span>
                <span className="text-[var(--muted-foreground)]">/</span>
                <span className="text-[var(--foreground)]">{chapterImageLength}</span>
                {showProgress && (
                  <span className="text-xs text-[var(--muted-foreground)] ml-1 px-1.5 py-0.5 bg-[var(--secondary)] rounded-full">
                    {chapterProgressPercent}%
                  </span>
                )}
              </span>
            </button>
            {isJumpPopoverOpen && onJumpToPage && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-[80] w-[240px] p-2 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl">
                <div className="text-[11px] text-[var(--muted-foreground)] mb-2 px-1">
                  Выберите страницу
                </div>
                <div className="max-h-48 overflow-y-auto pr-1">
                  <div className="grid grid-cols-5 gap-1">
                    {jumpPageItems.map(item => (
                      <button
                        key={`page-desktop-${item}`}
                        onClick={() => handleJumpToPage(item)}
                        className={`h-8 text-xs font-medium rounded-md border transition-colors ${
                          item === currentPage
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                            : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--accent)]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Таймер чтения */}
        {showTimer && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--card)]/90 border border-[var(--border)] rounded-full shadow-md backdrop-blur-sm">
            <Timer className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
            <span className="text-xs font-medium tabular-nums text-[var(--foreground)]">
              {formatReadingTime(readingTime)}
            </span>
          </div>
        )}

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
            {commentsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-[var(--primary)] text-white text-[10px] font-bold rounded-full shadow-sm">
                {commentsCount > 99 ? "99+" : commentsCount}
              </span>
            )}
          </button>

          {/* Кнопка сетки страниц */}
          {chapterImages.length > 0 && onJumpToPage && (
            <button
              onClick={() => setIsPageGridOpen(true)}
              className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center relative bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-110 active:scale-95"
              title="Сетка страниц"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
          )}

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

      {/* Мобильный счётчик с улучшенным дизайном */}
      <div
        className={`sm:hidden fixed z-[45] transition-all duration-300 ease-in-out ${
          isMenuHidden ? 'bottom-16 right-2 xs:right-4 opacity-100' : 'bottom-16 left-0 right-0 opacity-100'
        }`}
      >
        {showPageCounter && (
          <div className={`flex transition-all duration-300 ease-in-out ${isMenuHidden ? 'justify-end' : 'justify-center'}`}>
            <div className="relative" ref={mobileJumpPopoverRef}>
              <button
                type="button"
                onClick={handleCounterClick}
                className={`group relative overflow-hidden text-xs xs:text-sm font-medium border border-[var(--border)] bg-[var(--card)]/95 rounded-xl xs:rounded-2xl px-3 xs:px-4 py-1.5 xs:py-2 shadow-lg backdrop-blur-sm transition-all duration-300 active:scale-95 ${isMenuHidden ? 'scale-90' : 'scale-100'}`}
                title={onJumpToPage ? "Нажмите для перехода к странице" : "Счётчик страниц"}
              >
                {/* Mini progress bar */}
                {showProgress && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--muted)]">
                    <div 
                      className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-300"
                      style={{ width: `${chapterProgressPercent}%` }}
                    />
                  </div>
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span className="text-[var(--primary)] font-bold">{currentPage}</span>
                  <span className="text-[var(--muted-foreground)] text-xs">/</span>
                  <span className="text-[var(--foreground)]">{chapterImageLength}</span>
                  {showProgress && (
                    <span className="text-[10px] xs:text-xs text-[var(--muted-foreground)] ml-0.5">
                      ({chapterProgressPercent}%)
                    </span>
                  )}
                </span>
              </button>
              {isJumpPopoverOpen && onJumpToPage && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-[80] w-[220px] p-2 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl">
                  <div className="text-[11px] text-[var(--muted-foreground)] mb-2 px-1">
                    Выберите страницу
                  </div>
                  <div className="max-h-44 overflow-y-auto pr-1">
                    <div className="grid grid-cols-5 gap-1">
                      {jumpPageItems.map(item => (
                        <button
                          key={`page-mobile-${item}`}
                          onClick={() => handleJumpToPage(item)}
                          className={`h-8 text-xs font-medium rounded-md border transition-colors ${
                            item === currentPage
                              ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                              : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--accent)]"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Мобильное нижнее меню */}
      <div className="sm:hidden fixed bottom-2 z-[55] left-0 right-0 overflow-visible">
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

        {/* Развернутое меню: overflow-y-visible чтобы hover:scale не обрезался */}
        <div
          className={`px-2 py-2 overflow-x-auto overflow-y-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-all duration-500 ease-out ${
            hideBottomMenuSetting && isMenuHidden
              ? "opacity-0 scale-90 translate-y-8 pointer-events-none"
              : "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          }`}
        >
          <div className="w-max mx-auto flex items-center gap-1.5 py-0.5">
          <button
            onClick={toggleAutoScroll}
            className={`shrink-0 min-h-[38px] xs:min-h-[44px] min-w-[38px] xs:min-w-[44px] p-1.5 xs:p-2 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 ${
              isAutoScrolling ? "text-[var(--primary)] bg-[var(--background)]/90" : ""
            }`}
            title={isAutoScrolling ? "Остановить автопрокрутку" : "Начать автопрокрутку"}
          >
            {isAutoScrolling ? <Pause className="w-4 h-4 xs:w-5 xs:h-5" /> : <Play className="w-4 h-4 xs:w-5 xs:h-5" />}
          </button>

          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`shrink-0 min-h-[38px] xs:min-h-[44px] min-w-[38px] xs:min-w-[44px] p-1.5 xs:p-2 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 ${
              isSettingsOpen ? "text-[var(--primary)] bg-[var(--background)]/90" : ""
            }`}
            title="Настройки"
          >
            <Settings className="w-4 h-4 xs:w-5 xs:h-5" />
          </button>

          {/* Блок с кнопками глав */}
          <div className="shrink-0 flex items-center gap-1 xs:gap-2 bg-[var(--card)] border border-[var(--border)] rounded-full px-1 xs:px-2">
            <button
              onClick={onPrev}
              disabled={!canGoPrev}
              className="min-h-[38px] xs:min-h-[44px] min-w-[38px] xs:min-w-[44px] p-1.5 xs:p-2 flex items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              title="Предыдущая глава"
            >
              <ChevronLeft className="w-4 h-4 xs:w-5 xs:h-5 text-[var(--muted-foreground)]" />
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="min-h-[38px] xs:min-h-[44px] min-w-[38px] xs:min-w-[44px] flex flex-col items-center justify-center px-2 xs:px-3 hover:bg-[var(--muted)] rounded-lg transition-colors active:scale-95"
              title={`Глава ${currentChapter.number}`}
            >
              <span className="text-xs xs:text-sm font-medium text-[var(--foreground)]">
                {currentChapter.number}
              </span>
            </button>

            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="min-h-[38px] xs:min-h-[44px] min-w-[38px] xs:min-w-[44px] p-1.5 xs:p-2 flex items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              title="Следующая глава"
            >
              <ChevronRight className="w-4 h-4 xs:w-5 xs:h-5 text-[var(--muted-foreground)]" />
            </button>
          </div>

          {/* Кнопка комментариев */}
          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className={`relative shrink-0 min-h-[38px] xs:min-h-[44px] min-w-[38px] xs:min-w-[44px] p-1.5 xs:p-2 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 ${
              isCommentsOpen ? "text-[var(--primary)] bg-[var(--primary)]/10" : ""
            }`}
            title="Комментарии"
          >
            <MessageCircle className="w-4 h-4 xs:w-5 xs:h-5" />
            {commentsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center px-1 bg-[var(--primary)] text-white text-[9px] font-bold rounded-full shadow-sm">
                {commentsCount > 99 ? "99+" : commentsCount}
              </span>
            )}
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
              className={`relative shrink-0 min-h-[38px] xs:min-h-[44px] min-w-[38px] xs:min-w-[44px] p-1.5 xs:p-2 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 overflow-hidden ${isPressing ? 'scale-95' : ''}`}
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
                        {chapter.title && 
                         chapter.title !== String(chapter.number) && 
                         !chapter.title.toLowerCase().match(/^глава\s*\d+$/)
                          ? chapter.title 
                          : `Глава ${chapter.number}`}
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
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCommentsOpen(false)}
          />

          {/* Боковая панель комментариев (десктоп) */}
          <div className="hidden sm:block fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] max-h-[85vh] bg-[var(--card)] backdrop-blur-xl border border-[var(--border)]/50 rounded-3xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header с градиентом */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/10 via-transparent to-[var(--primary)]/5" />
              <div className="relative flex items-center justify-between p-5 border-b border-[var(--border)]/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-[var(--foreground)]">
                      Комментарии
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Глава {currentChapter.number}
                      {commentsCount > 0 && ` • ${commentsCount} ${commentsCount === 1 ? 'комментарий' : commentsCount < 5 ? 'комментария' : 'комментариев'}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCommentsOpen(false)}
                  className="p-2.5 hover:bg-[var(--secondary)] rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                  title="Закрыть"
                >
                  <X className="w-5 h-5 text-[var(--muted-foreground)]" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(85vh-90px)] p-5">
              <CommentsSection
                entityType={CommentEntityType.CHAPTER}
                entityId={currentChapter._id}
              />
            </div>
          </div>

          {/* Мобильная панель комментариев */}
          <div 
            ref={mobileCommentsPanelRef}
            className="sm:hidden fixed bottom-0 left-0 right-0 z-[60] bg-[var(--card)] backdrop-blur-xl border-t border-[var(--border)]/50 shadow-2xl max-h-[85vh] flex flex-col rounded-t-3xl animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{ transform: `translateY(${commentsDragY}px)`, opacity: 1 - commentsDragY / 300 }}
            onTouchStart={handleCommentsTouchStart}
            onTouchMove={handleCommentsTouchMove}
            onTouchEnd={handleCommentsTouchEnd}
          >
            {/* Drag indicator для свайпа */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-[var(--muted-foreground)]/30" />
            </div>
            
            {/* Header с градиентом */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/10 via-transparent to-[var(--primary)]/5" />
              <div className="relative flex items-center justify-between px-5 py-4 border-b border-[var(--border)]/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-[var(--foreground)]">
                      Комментарии
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Глава {currentChapter.number}
                      {commentsCount > 0 && ` • ${commentsCount}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCommentsOpen(false)}
                  className="p-2.5 hover:bg-[var(--secondary)] rounded-xl transition-all duration-200 active:scale-95"
                  title="Закрыть"
                >
                  <X className="w-5 h-5 text-[var(--muted-foreground)]" />
                </button>
              </div>
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
      />

      {/* Сетка страниц */}
      {chapterImages.length > 0 && onJumpToPage && (
        <PageThumbnails
          images={chapterImages}
          currentPage={currentPage}
          onPageSelect={onJumpToPage}
          chapterNumber={currentChapter.number}
          isOpen={isPageGridOpen}
          onClose={() => setIsPageGridOpen(false)}
        />
      )}
    </>
  );
}
