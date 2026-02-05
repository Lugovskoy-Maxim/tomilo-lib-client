"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  TableOfContents,
  X,
  AlertTriangle,
  Bookmark,
  Settings,
  Play,
  Pause,
} from "lucide-react";
import { ReaderChapter } from "@/types/chapter";
import { CommentsSection } from "@/shared/comments";
import { CommentEntityType } from "@/types/comment";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { ReportModal } from "@/shared/report/ReportModal";

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
  onNextPage?: () => void;
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
  isMobileControlsVisible = true,
  imageWidth,
  onImageWidthChange,
  onNextPage,
}: ReaderControlsProps & { isMobileControlsVisible?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [isWidthControlOpen, setIsWidthControlOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollInterval, setAutoScrollInterval] = useState<NodeJS.Timeout | null>(null);
  const toast = useToast();
  const { user, addBookmark, removeBookmark, isAuthenticated } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  // Update isBookmarked when user bookmarks change
  useEffect(() => {
    setIsBookmarked(user?.bookmarks?.includes(titleId) ?? false);
  }, [user?.bookmarks, titleId]);

  // Ref для панели настроек ширины
  const widthControlRef = useRef<HTMLDivElement>(null);

  // Обработчик закрытия панели настроек при клике вне её
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        isWidthControlOpen &&
        widthControlRef.current &&
        !widthControlRef.current.contains(event.target as Node)
      ) {
        // Проверяем, что клик не был по самой кнопке настроек
        const target = event.target as HTMLElement;
        if (!target.closest('button[title="Настройки ширины изображений"]')) {
          setIsWidthControlOpen(false);
        }
      }
    },
    [isWidthControlOpen],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const filteredChapters = chapters.filter(
    chapter =>
      chapter.number.toString().includes(chapterSearch) ||
      chapter.title.toLowerCase().includes(chapterSearch.toLowerCase()),
  );

  const startAutoScroll = useCallback(() => {
    if (isAutoScrolling) return;
    setIsAutoScrolling(true);
    const interval = setInterval(() => {
      if (onNextPage) {
        onNextPage();
      }
    }, 3000); // Scroll every 3 seconds
    setAutoScrollInterval(interval);
  }, [isAutoScrolling, onNextPage]);

  const stopAutoScroll = useCallback(() => {
    if (!isAutoScrolling) return;
    setIsAutoScrolling(false);
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }
  }, [isAutoScrolling, autoScrollInterval]);

  const toggleAutoScroll = useCallback(() => {
    if (isAutoScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  }, [isAutoScrolling, startAutoScroll, stopAutoScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
    };
  }, [autoScrollInterval]);

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      toast.warning("Пожалуйста, авторизуйтесь, чтобы добавить в закладки");
      return;
    }

    setIsBookmarkLoading(true);

    try {
      if (isBookmarked) {
        const result = await removeBookmark(titleId);
        if (result.success) {
          setIsBookmarked(false);
        } else {
          console.error("Ошибка при удалении из закладок:", result.error);
          toast.error(`Ошибка при удалении из закладок: ${result.error}`);
        }
      } else {
        const result = await addBookmark(titleId);
        if (result.success) {
          setIsBookmarked(true);
        } else {
          console.error("Ошибка при добавлении в закладки:", result.error);
          toast.error(`Ошибка при добавлении в закладки: ${result.error}`);
        }
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
      {/* Стили для ползунка и анимаций */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
          border: 3px solid var(--background);
          box-shadow:
            0 0 0 2px var(--primary),
            0 2px 8px rgba(0, 0, 0, 0.2);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow:
            0 0 0 2px var(--primary),
            0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
          border: 3px solid var(--background);
          box-shadow:
            0 0 0 2px var(--primary),
            0 2px 8px rgba(0, 0, 0, 0.2);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }
        .slider::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow:
            0 0 0 2px var(--primary),
            0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .slider:focus {
          outline: none;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-10px) translateY(-50%);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(-50%);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>

      {/* Основное меню */}
      <div className="hidden sm:flex fixed right-1 top-1/2 -translate-y-1/2 z-40 flex-col gap-5 ">
        {/* Счётчик страниц главы */}
        <div className="w-full flex justify-center items-center  mb-2">
          <p className="text-[var(--muted-foreground)] text-sm sm:text-xs border border-[var(--border) bg-[var(--background)]/90 rounded-xl p-1">
            {currentPage} {"/"} {chapterImageLength}
          </p>
        </div>

        {/* Кнопка настроек ширины изображений */}
        {onImageWidthChange && imageWidth !== undefined && (
          <div className="relative w-full flex justify-center mb-4">
            <button
              onClick={() => setIsWidthControlOpen(!isWidthControlOpen)}
              className={`group relative p-3 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 ${
                isWidthControlOpen
                  ? "text-[var(--primary)] bg-[var(--primary)]/20 border-[var(--primary)]"
                  : ""
              }`}
              title="Настройки ширины изображений"
            >
              <Settings className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
              {/* Активный индикатор */}
              {isWidthControlOpen && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--primary)] rounded-full animate-pulse" />
              )}
            </button>

            {/* Ползунок ширины (абсолютное позиционирование слева) */}
            {isWidthControlOpen && (
              <div
                ref={widthControlRef}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full mr-3 flex flex-col items-center space-y-3 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-[60] animate-fade-in"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-[var(--foreground)] font-medium">{imageWidth}px</span>
                </div>
                <input
                  type="range"
                  min="768"
                  max="1440"
                  step="64"
                  value={imageWidth}
                  onChange={e => onImageWidthChange(Number(e.target.value))}
                  className="w-40 h-3 bg-[var(--muted)] rounded-full appearance-none cursor-pointer slider"
                  style={{
                    background: "var(--muted)",
                    outline: "none",
                  }}
                  title="Изменить ширину изображений"
                />
                <div className="flex justify-between w-40 text-[var(--muted-foreground)] text-xs">
                  <span>768</span>
                  <span>1440</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col items-center space-y-2 w-12">
          {/* Номер главы */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95"
            title={`Глава ${currentChapter.number}`}
          >
            <TableOfContents className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
            <span className="absolute -top-1 -right-1 text-xs font-bold text-[var(--primary)] bg-[var(--background)] rounded-full px-1 min-w-[1.2rem] text-center">
              {currentChapter.number}
            </span>
          </button>

          {/* Предыдущая глава */}
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className="relative p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Предыдущая глава"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
          </button>

          {/* Следующая глава */}
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="relative p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Следующая глава"
          >
            <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
          </button>

          {/* Сообщение об ошибке */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95"
            title="Сообщить об ошибке"
          >
            <AlertTriangle className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
          </button>

          {/* Добавить в избранное */}
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

          {/* Комментарии */}
          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className="p-2 relative bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95"
            title="Комментарии"
          >
            <MessageCircle
              className={`w-4 h-4 ${
                isCommentsOpen ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
              }`}
            />
          </button>
        </div>
      </div>

            {/* Мобильное меню - стиль смартфонного меню */}
      {/* <div
        className={`sm:hidden h-max fixed bottom-18 left-0 right-0 z-[45] transition-transform duration-300 ease-out will-change-transform 
          ${
          isMobileControlsVisible ? "translate-y-0" : "translate-y-18"
        }
          `}
      ></div> */}


      <div
        className={`sm:hidden h-max fixed bottom-12 left-0 right-0 z-[45] transition-transform duration-300 ease-out will-change-transform`}
      >
        {/* Счётчик страниц главы */}
        <div className="w-full flex justify-center items-center  mb-1 ">
          <p className="text-[var(--primary)] text-xs border border-[var(--border)] bg-[var(--background)]/85 rounded-lg px-2 py-0.5">
            {currentPage}{"/"}{chapterImageLength}
          </p>
        </div>
      </div>


      {/* <div
        className={`sm:hidden h-max fixed bottom-2 left-0 right-0 z-[55] transition-transform duration-300 ease-out will-change-transform ${
          isMobileControlsVisible ? "translate-y-0" : "translate-y-20"
        }`}
      > */}

      <div
        className={`sm:hidden h-max fixed bottom-1 left-0 right-0 z-[55] transition-transform duration-300 ease-out will-change-transform`}
      >
        <div className="flex items-center justify-center gap-5 p-1">
          {/* Кнопка автоматической прокрутки */}
          <button
            onClick={toggleAutoScroll}
            className={`p-2 bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 hover:scale-110 active:scale-95 ${
              isAutoScrolling ? "text-[var(--primary)] bg-[var(--background)]/90" : ""
            }`}
            title={isAutoScrolling ? "Остановить автопрокрутку" : "Начать автопрокрутку"}
          >
            {isAutoScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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
