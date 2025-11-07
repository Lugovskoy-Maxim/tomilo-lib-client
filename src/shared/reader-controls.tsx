"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Hash } from "lucide-react";
import ThemeToggle from "./theme-toggle/theme-toggle";
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
  const [isChapterMenuOpen, setIsChapterMenuOpen] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");

  const filteredChapters = chapters.filter(chapter =>
    chapter.number.toString().includes(chapterSearch) ||
    chapter.title.toLowerCase().includes(chapterSearch.toLowerCase())
  );

  return (
    <>
      {/* Основное меню */}
      <div className="hidden sm:flex fixed right-2 top-1/2 -translate-y-1/2 bg-[var(--card)]/90 backdrop-blur-sm border border-[var(--border)] rounded-l-lg shadow-lg z-40">
        <div className="flex flex-col items-center space-y-2 p-2 w-10">
          {/* Номер главы */}
          <button
            onClick={() => setIsChapterMenuOpen(!isChapterMenuOpen)}
            className="relative p-2 hover:bg-[var(--muted)] rounded transition-colors group"
            title={`Глава ${currentChapter.number}`}
          >
            <Hash className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
            <span className="absolute -top-1 -right-1 text-xs font-bold text-[var(--primary)] bg-[var(--background)] rounded-full px-1 min-w-[1.2rem] text-center">
              {currentChapter.number}
            </span>
          </button>

          {/* Предыдущая глава */}
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className="p-2 hover:bg-[var(--muted)] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Предыдущая глава"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
          </button>

          {/* Следующая глава */}
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="p-2 hover:bg-[var(--muted)] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="p-2 opacity-50 cursor-not-allowed"
            title="Комментарии (скоро)"
          >
            <MessageCircle className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      <div className={`sm:hidden fixed bottom-0 left-0 right-0 bg-[var(--card)]/90 backdrop-blur-sm border-t border-[var(--border)] shadow-lg z-40 transition-transform duration-300 ${
        isMobileControlsVisible ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex items-center justify-around p-2">
          {/* Предыдущая глава */}
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className="flex flex-col items-center p-3 hover:bg-[var(--muted)] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Предыдущая глава"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
            <span className="text-xs mt-1">Пред.</span>
          </button>

          {/* Номер главы */}
          <button
            onClick={() => setIsChapterMenuOpen(!isChapterMenuOpen)}
            className="relative flex flex-col items-center p-3 hover:bg-[var(--muted)] rounded transition-colors group"
            title={`Глава ${currentChapter.number}`}
          >
            <Hash className="w-5 h-5 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
            <span className="absolute -top-1 text-xs font-bold text-[var(--primary)] bg-[var(--background)] rounded-full px-1 min-w-[1.2rem] text-center">
              {currentChapter.number}
            </span>
            <span className="text-xs mt-1">Глава</span>
          </button>

          {/* Следующая глава */}
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="flex flex-col items-center p-3 hover:bg-[var(--muted)] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Следующая глава"
          >
            <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
            <span className="text-xs mt-1">След.</span>
          </button>

          {/* Смена темы */}
          <div className="flex flex-col items-center p-3">
            <ThemeToggle />
            <span className="text-xs mt-1">Тема</span>
          </div>

          {/* Комментарии (заглушка) */}
          <button
            disabled
            className="flex flex-col items-center p-3 opacity-50 cursor-not-allowed"
            title="Комментарии (скоро)"
          >
            <MessageCircle className="w-5 h-5 text-[var(--muted-foreground)]" />
            <span className="text-xs mt-1">Комм.</span>
          </button>
        </div>
      </div>

      {/* Выпадающее меню выбора главы */}
      {isChapterMenuOpen && (
        <div className="fixed sm:right-14 sm:top-1/2 sm:-translate-y-1/2 bottom-16 left-4 right-4 sm:left-auto sm:w-80 w-auto max-h-96 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl z-50 overflow-hidden">
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
                  setIsChapterMenuOpen(false);
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
      {isChapterMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setIsChapterMenuOpen(false);
            setChapterSearch("");
          }}
        />
      )}
    </>
  );
}
