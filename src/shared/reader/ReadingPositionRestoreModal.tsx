"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { X, BookOpen, Clock, ChevronRight, RotateCcw, Bookmark, History, Zap } from "lucide-react";

type RestoreMode = "continue" | "beginning" | "custom";

interface ReadingPositionRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
  onReset: () => void;
  onJumpToPage?: (page: number) => void;
  page: number;
  timestamp: number;
  totalPages: number;
  chapterTitle?: string;
}

export default function ReadingPositionRestoreModal({
  isOpen,
  onClose,
  onRestore,
  onReset,
  onJumpToPage,
  page,
  timestamp,
  totalPages,
  chapterTitle,
}: ReadingPositionRestoreModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [isPaused, setIsPaused] = useState(false);
  const [customPage, setCustomPage] = useState(page);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isAlwaysStartFromBeginning, setIsAlwaysStartFromBeginning] = useState(false);
  const [autoRestoreEnabled, setAutoRestoreEnabled] = useState(true);
  const [instantContinue, setInstantContinue] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  useEffect(() => {
    const savedAlways = localStorage.getItem("reader-always-start-from-beginning");
    const savedAutoRestore = localStorage.getItem("reader-auto-restore");
    const savedInstant = localStorage.getItem("reader-instant-continue");
    
    if (savedAlways === "true") {
      setIsAlwaysStartFromBeginning(true);
    }
    if (savedAutoRestore === "false") {
      setAutoRestoreEnabled(false);
    }
    if (savedInstant === "true") {
      setInstantContinue(true);
    }
    setIsSettingsLoaded(true);
  }, []);

  const handleAlwaysStartChange = useCallback((value: boolean) => {
    setIsAlwaysStartFromBeginning(value);
    localStorage.setItem("reader-always-start-from-beginning", value.toString());
  }, []);

  const handleAutoRestoreChange = useCallback((value: boolean) => {
    setAutoRestoreEnabled(value);
    localStorage.setItem("reader-auto-restore", value.toString());
  }, []);

  const handleInstantContinueChange = useCallback((value: boolean) => {
    setInstantContinue(value);
    localStorage.setItem("reader-instant-continue", value.toString());
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setIsPaused(false);
      setShowCustomInput(false);
      return;
    }

    if (!isSettingsLoaded) return;

    if (isAlwaysStartFromBeginning) {
      setTimeout(() => {
        onReset();
        onClose();
      }, 0);
      return;
    }

    if (instantContinue) {
      setTimeout(() => {
        onRestore();
        onClose();
      }, 0);
      return;
    }

    if (!autoRestoreEnabled || isPaused) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            onRestore();
            onClose();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isSettingsLoaded, isAlwaysStartFromBeginning, instantContinue, autoRestoreEnabled, isPaused, onRestore, onReset, onClose]);

  const formatLastReadTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "только что";
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    if (days < 7) return `${days} дн. назад`;
    return new Date(timestamp).toLocaleDateString("ru-RU");
  };

  const progressPercent = Math.round((page / totalPages) * 100);
  
  const estimatedRemainingTime = useMemo(() => {
    const remainingPages = totalPages - page;
    const secondsPerPage = 30;
    const totalSeconds = remainingPages * secondsPerPage;
    const minutes = Math.ceil(totalSeconds / 60);
    return minutes;
  }, [totalPages, page]);

  const quickJumpOptions = useMemo(() => {
    const options: { label: string; page: number }[] = [];
    
    if (page > 1) {
      options.push({ label: "Сохранённая", page });
    }
    
    options.push({ label: "Начало", page: 1 });
    
    const quarter = Math.floor(totalPages * 0.25);
    const half = Math.floor(totalPages * 0.5);
    const threeQuarter = Math.floor(totalPages * 0.75);
    
    if (quarter > 1 && quarter !== page) {
      options.push({ label: "25%", page: quarter });
    }
    if (half > 1 && half !== page) {
      options.push({ label: "50%", page: half });
    }
    if (threeQuarter > 1 && threeQuarter !== page && threeQuarter < totalPages) {
      options.push({ label: "75%", page: threeQuarter });
    }
    
    return options.slice(0, 4);
  }, [page, totalPages]);

  const handleQuickJump = useCallback((targetPage: number) => {
    if (onJumpToPage) {
      onJumpToPage(targetPage);
    } else if (targetPage === page) {
      onRestore();
    } else if (targetPage === 1) {
      onReset();
    }
    onClose();
  }, [onJumpToPage, onRestore, onReset, onClose, page]);

  const handleCustomJump = useCallback(() => {
    const targetPage = Math.max(1, Math.min(totalPages, customPage));
    if (onJumpToPage) {
      onJumpToPage(targetPage);
    }
    onClose();
  }, [customPage, totalPages, onJumpToPage, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
        onClick={() => {
          onReset();
          onClose();
        }}
      />

      <div 
        className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-2xl animate-scale-in overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--muted)]">
          <div 
            className="h-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-[var(--primary)]" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-lg">
                  <Bookmark className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-xl text-[var(--foreground)]">
                  Продолжить чтение?
                </h3>
                {chapterTitle && (
                  <p className="text-sm text-[var(--muted-foreground)] mt-0.5 line-clamp-1">
                    {chapterTitle}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                onReset();
                onClose();
              }}
              className="p-2.5 hover:bg-[var(--muted)] rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 bg-gradient-to-b from-[var(--background)]/80 to-[var(--background)]/40 border-y border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center">
                <History className="w-4 h-4 text-[var(--muted-foreground)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {formatLastReadTime(timestamp)}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Последний сеанс
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[var(--primary)]">
                {progressPercent}%
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                прочитано
              </p>
            </div>
          </div>

          <div className="relative h-3 bg-[var(--muted)] rounded-full overflow-hidden mb-4">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-[var(--primary)] transition-all duration-500"
              style={{ left: `calc(${progressPercent}% - 8px)` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--muted-foreground)]">Страница</span>
              <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-md font-bold">
                {page}
              </span>
              <span className="text-[var(--muted-foreground)]">из {totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
              <Clock className="w-3.5 h-3.5" />
              <span>~{estimatedRemainingTime} мин. осталось</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <button
            onClick={() => {
              onRestore();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] hover:opacity-90 text-white rounded-2xl font-semibold transition-all active:scale-[0.98] shadow-lg shadow-[var(--primary)]/25 group"
          >
            <Zap className="w-5 h-5" />
            <span>Продолжить со страницы {page}</span>
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onReset();
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--secondary)] hover:bg-[var(--accent)] text-[var(--foreground)] rounded-xl font-medium transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Сначала</span>
            </button>
            
            {onJumpToPage && (
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all active:scale-[0.98] ${
                  showCustomInput 
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] ring-2 ring-[var(--primary)]" 
                    : "bg-[var(--secondary)] hover:bg-[var(--accent)] text-[var(--foreground)]"
                }`}
              >
                <span>Другая страница</span>
              </button>
            )}
          </div>

          {showCustomInput && onJumpToPage && (
            <div className="p-4 bg-[var(--secondary)]/50 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={customPage}
                  onChange={(e) => setCustomPage(Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1)))}
                  className="flex-1 px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-center font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <button
                  onClick={handleCustomJump}
                  className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl font-medium hover:bg-[var(--primary)]/90 transition-colors"
                >
                  Перейти
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {quickJumpOptions.map((option) => (
                  <button
                    key={option.page}
                    onClick={() => handleQuickJump(option.page)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      option.page === page
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--background)] hover:bg-[var(--accent)] text-[var(--foreground)]"
                    }`}
                  >
                    {option.label} ({option.page})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--muted)]/50 transition-colors cursor-pointer">
              <div>
                <span className="text-sm text-[var(--foreground)]">
                  Мгновенное продолжение
                </span>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Без показа этого окна
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={instantContinue}
                  onChange={(e) => handleInstantContinueChange(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${instantContinue ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${instantContinue ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </div>
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--muted)]/50 transition-colors cursor-pointer">
              <span className="text-sm text-[var(--foreground)]">
                Всегда начинать сначала
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isAlwaysStartFromBeginning}
                  onChange={(e) => handleAlwaysStartChange(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${isAlwaysStartFromBeginning ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAlwaysStartFromBeginning ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </div>
            </label>

            {!instantContinue && !isAlwaysStartFromBeginning && (
              <label className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--muted)]/50 transition-colors cursor-pointer">
                <span className="text-sm text-[var(--foreground)]">
                  Автопродолжение через 5 сек
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={autoRestoreEnabled}
                    onChange={(e) => handleAutoRestoreChange(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${autoRestoreEnabled ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoRestoreEnabled ? "translate-x-6" : "translate-x-1"}`} />
                  </div>
                </div>
              </label>
            )}
          </div>
        </div>

        {autoRestoreEnabled && !isPaused && !isAlwaysStartFromBeginning && !instantContinue && (
          <div className="px-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--primary)] rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 5) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-[var(--muted-foreground)] min-w-[24px]">
                {countdown}с
              </span>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { 
            opacity: 0; 
            transform: scale(0.95) translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
