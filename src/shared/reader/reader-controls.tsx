"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Hash, MoreVertical, TableOfContents } from "lucide-react";
import ThemeToggle from "../theme-toggle/theme-toggle";
import { ReaderChapter } from "@/types/chapter";

interface ReaderControlsProps {
  currentChapter: ReaderChapter;
  chapters: ReaderChapter[];
  onChapterSelect: (chapterId: string) => void;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export default function ReaderControls({
  currentChapter,
  chapters,
  onChapterSelect,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  isMobileControlsVisible = true,
}: ReaderControlsProps & { isMobileControlsVisible?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");

  const filteredChapters = chapters.filter(chapter =>
    chapter.number.toString().includes(chapterSearch) ||
    chapter.title.toLowerCase().includes(chapterSearch.toLowerCase())
  );

  return (
    <>
      {/* Основное меню */}
      <div className="hidden sm:flex fixed right-1 top-1/2 -translate-y-1/2 z-40">
        <div className="flex flex-col items-center space-y-2 w-12">
          {/* Номер главы */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95"
            title={`Глава ${currentChapter.number}`}
          >
            <TableOfContents   className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
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

          {/* Смена темы */}
          <div className="p-1">
            <ThemeToggle />
          </div>

          {/* Комментарии (заглушка) */}
          <button
            disabled
            className="p-2 relative p-2 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full hover:bg-[var(--accent)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Комментарии (скоро)"
          >
            <MessageCircle className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        </div>
      </div>

      {/* Мобильное меню - стиль смартфонного меню */}
      <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
        isMobileControlsVisible ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="bg-[var(--card)]/95 backdrop-blur-sm border-t border-[var(--border)] shadow-lg">
          <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
            {/* Предыдущая глава */}
            <button
              onClick={onPrev}
              disabled={!canGoPrev}
              className="flex flex-col items-center p-2 hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[64px] active:scale-95"
              title="Предыдущая глава"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--muted-foreground)]" />
              <span className="text-[10px] text-[var(--muted-foreground)] mt-1 leading-tight">Пред.</span>
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
              <span className="text-[10px] text-[var(--muted-foreground)] mt-1 leading-tight">Глава</span>
            </button>

            {/* Следующая глава */}
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="flex flex-col items-center p-2 hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[64px] active:scale-95"
              title="Следующая глава"
            >
              <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
              <span className="text-[10px] text-[var(--muted-foreground)] mt-1 leading-tight">След.</span>
            </button>

            {/* Смена темы */}
            <div className="flex flex-col items-center p-2 min-w-[64px]">
              <ThemeToggle />
              <span className="text-[10px] text-[var(--muted-foreground)] mt-1 leading-tight">Тема</span>
            </div>

            {/* Комментарии (заглушка) */}
            <button
              disabled
              className="flex flex-col items-center p-2 opacity-50 cursor-not-allowed min-w-[64px]"
              title="Комментарии (скоро)"
            >
              <MessageCircle className="w-5 h-5 text-[var(--muted-foreground)]" />
              <span className="text-[10px] text-[var(--muted-foreground)] mt-1 leading-tight">Комм.</span>
            </button>
          </div>
        </div>
      </div>

      {/* Выпадающее меню выбора главы */}
      {isMenuOpen && (
        <div className="fixed sm:right-14 sm:top-1/2 sm:-translate-y-1/2 bottom-20 left-4 right-4 sm:left-auto sm:w-80 w-auto max-h-96 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl z-50 overflow-hidden">
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
                  chapter._id === currentChapter._id ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : ""
                }`}
              >
                <div className="font-medium">
                  Глава {chapter.number}
                </div>
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
          className="fixed inset-0 z-30"
          onClick={() => {
            setIsMenuOpen(false);
            setChapterSearch("");
          }}
        />
      )}
    </>
  );
}
