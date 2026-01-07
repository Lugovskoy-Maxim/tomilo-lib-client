"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  TableOfContents,
  X,
  AlertTriangle,
  Bookmark,
  Settings,
} from "lucide-react";
import { ReaderChapter } from "@/types/chapter";
import { CommentsSection } from "@/shared/comments";
import { CommentEntityType } from "@/types/comment";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { ReportModal } from "@/shared/report/report-modal";

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
  isMobileControlsVisible = true,
  imageWidth,
  onImageWidthChange,
}: ReaderControlsProps & { isMobileControlsVisible?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [isWidthControlOpen, setIsWidthControlOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const toast = useToast();
  const { user, addBookmark, removeBookmark, isAuthenticated } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(
    user?.bookmarks?.includes(titleId) ?? false
  );
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  const filteredChapters = chapters.filter(
    (chapter) =>
      chapter.number.toString().includes(chapterSearch) ||
      chapter.title.toLowerCase().includes(chapterSearch.toLowerCase())
  );

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
      {/* Стили для ползунка */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
          border: 2px solid var(--background);
          box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
          border: 2px solid var(--background);
          box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
        }
      `}</style>

      {/* Основное меню */}
      <div className="hidden sm:flex fixed right-1 top-1/2 -translate-y-1/2 z-40 flex-col gap-5 ">
        {/* Счётчик страниц главы */}
        <div className="w-full flex justify-center items-center  mb-2">
          <p className="text-[var(--muted-foreground)] text-xs border border-[var(--border) bg-[var(--background)]/90 rounded-xl p-1">
            {currentPage} {"/"} {chapterImageLength}
          </p>
        </div>

        {/* Кнопка настроек ширины изображений */}
        {onImageWidthChange && imageWidth !== undefined && (
          <div className="relative w-full flex justify-center mb-4">
            <button
              onClick={() => setIsWidthControlOpen(!isWidthControlOpen)}
              className={`p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95 ${
                isWidthControlOpen ? 'text-[var(--primary)] bg-[var(--accent)]' : ''
              }`}
              title="Настройки ширины изображений"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Ползунок ширины (абсолютное позиционирование слева) */}
            {isWidthControlOpen && (
              <div className="absolute left-0 top-0 -translate-x-full mr-2 flex flex-col items-center space-y-2 p-3 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-[60]">
                <div className="text-[var(--muted-foreground)] text-xs font-medium">
                  Ширина: {imageWidth}px
                </div>
                <input
                  type="range"
                  min="768"
                  max="1440"
                  step="64"
                  value={imageWidth}
                  onChange={(e) => onImageWidthChange(Number(e.target.value))}
                  className="w-32 h-2 bg-[var(--muted)] rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: 'var(--muted)',
                    outline: 'none',
                  }}
                  title="Изменить ширину изображений"
                />
                <div className="flex justify-between w-32 text-[var(--muted-foreground)] text-xs">
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
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
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
              <Bookmark
                className="w-4 h-4"
                fill={isBookmarked ? "currentColor" : "none"}
              />
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
                isCommentsOpen
                  ? "text-[var(--primary)]"
                  : "text-[var(--muted-foreground)]"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Мобильное меню - стиль смартфонного меню */}
      <div
        className={`sm:hidden h-max fixed bottom-20 left-0 right-0 z-[55] transition-transform duration-300 ease-out will-change-transform ${
          isMobileControlsVisible ? "translate-y-0" : "translate-y-20"
        }`}
      >
        {/* Счётчик страниц главы */}
        <div className="w-full flex justify-center items-center  mb-2 ">
          <p className="text-[var(--muted-foreground)] text-xs border border-[var(--border) bg-[var(--background)]/90 rounded-xl p-2">
            {currentPage} {"/"} {chapterImageLength}
          </p>
        </div>
      </div>

      <div
        className={`sm:hidden h-max fixed bottom-2 left-0 right-0 z-[55] transition-transform duration-300 ease-out will-change-transform ${
          isMobileControlsVisible ? "translate-y-0" : "translate-y-20"
        }`}
      >
        <div
          className="bg-[var(--card)]/95 backdrop-blur-sm border-t border-[var(--border)] shadow-lg rounded-xl mx-1 h-14"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-around px-1 py-">
            {/* Предыдущая глава */}
            <button
              onClick={onPrev}
              disabled={!canGoPrev}
              className="flex flex-col items-center p-2 hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[64px] active:scale-95"
              title="Предыдущая глава"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--muted-foreground)]" />
              <span className="text-[10px] text-[var(--muted-foreground)] mt-1 leading-tight">
                Пред.
              </span>
            </button>

            {/* Выбор главы */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex flex-col items-center p-2 hover:bg-[var(--muted)] rounded-lg transition-colors min-w-[64px] active:scale-95"
              title={`Глава ${currentChapter.number}`}
            >
              <div className="relative">
                <TableOfContents className="w-5 h-5 text-[var(--muted-foreground)]" />
                <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-[var(--primary-foreground)] text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                  {currentChapter.number}
                </span>
              </div>
              <span className="text-[10px] text-[var(--muted-foreground)] mt-1 leading-tight">
                Глава
              </span>
            </button>

            {/* Следующая глава */}
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="flex flex-col items-center p-2 hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[64px] active:scale-95"
              title="Следующая глава"
            >
              <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
              <span className="text-[10px] text-[var(--muted-foreground)] mt-1 leading-tight">
                След.
              </span>
            </button>

            {/* Сообщение об ошибке */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex flex-col items-center p-2 hover:bg-[var(--muted)] rounded-lg transition-colors min-w-[64px] active:scale-95"
              title="Сообщить об ошибке"
            >
              <AlertTriangle className="w-5 h-5 text-[var(--muted-foreground)]" />
              <span className="text-[10px] text-[var(--muted-foreground)] mt-1 leading-tight">
                Ошибка
              </span>
            </button>

            {/* Добавить в избранное */}
            <button
              onClick={handleBookmarkToggle}
              disabled={isBookmarkLoading}
              className="flex flex-col items-center p-2 hover:bg-[var(--muted)] rounded-lg transition-colors min-w-[64px] active:scale-95"
              title={
                isBookmarked ? "Удалить из закладок" : "Добавить в закладки"
              }
            >
              {isBookmarkLoading ? (
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
                <Bookmark
                  className={`w-5 h-5 ${
                    isBookmarked
                      ? "text-[var(--primary)]"
                      : "text-[var(--muted-foreground)]"
                  }`}
                  fill={isBookmarked ? "currentColor" : "none"}
                />
              )}
              <span
                className={`text-[10px] mt-1 leading-tight ${
                  isBookmarked
                    ? "text-[var(--primary)]"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                Избр.
              </span>
            </button>

            {/* Комментарии */}
            <button
              onClick={() => setIsCommentsOpen(!isCommentsOpen)}
              className={`flex flex-col items-center p-2 hover:bg-[var(--muted)] rounded-lg transition-colors min-w-[64px] active:scale-95 ${
                isCommentsOpen ? "bg-[var(--accent)]" : ""
              }`}
              title="Комментарии"
            >
              <MessageCircle
                className={`w-5 h-5 ${
                  isCommentsOpen
                    ? "text-[var(--primary)]"
                    : "text-[var(--muted-foreground)]"
                }`}
              />
              <span
                className={`text-[10px] mt-1 leading-tight ${
                  isCommentsOpen
                    ? "text-[var(--primary)]"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                Комм.
              </span>
            </button>
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
              onChange={(e) => setChapterSearch(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {filteredChapters.map((chapter) => (
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
        entityTitle={`Глава ${currentChapter.number}${currentChapter.title ? ` - ${currentChapter.title}` : ''}`}
      />
    </>
  );
}
