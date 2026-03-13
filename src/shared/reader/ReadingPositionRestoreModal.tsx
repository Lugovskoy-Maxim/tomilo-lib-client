"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { X, BookOpen, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

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
  totalPages,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- timestamp, chapterTitle в пропсах для типа
  ..._rest
}: ReadingPositionRestoreModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [isPaused, setIsPaused] = useState(false);
  const [customPage, setCustomPage] = useState(page);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isAlwaysStartFromBeginning, setIsAlwaysStartFromBeginning] = useState(false);
  const [autoRestoreEnabled, setAutoRestoreEnabled] = useState(true);
  const [instantContinue, setInstantContinue] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);

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
  }, [
    isOpen,
    isSettingsLoaded,
    isAlwaysStartFromBeginning,
    instantContinue,
    autoRestoreEnabled,
    isPaused,
    onRestore,
    onReset,
    onClose,
  ]);

  const progressPercent = Math.round((page / totalPages) * 100);

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

  const handleQuickJump = useCallback(
    (targetPage: number) => {
      if (onJumpToPage) {
        onJumpToPage(targetPage);
      } else if (targetPage === page) {
        onRestore();
      } else if (targetPage === 1) {
        onReset();
      }
      onClose();
    },
    [onJumpToPage, onRestore, onReset, onClose, page],
  );

  const handleCustomJump = useCallback(() => {
    const targetPage = Math.max(1, Math.min(totalPages, customPage));
    if (onJumpToPage) {
      onJumpToPage(targetPage);
    }
    onClose();
  }, [customPage, totalPages, onJumpToPage, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusFirstElement = () => {
      primaryActionRef.current?.focus({ preventScroll: true });
    };

    const timeoutId = setTimeout(focusFirstElement, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter(element => !element.hasAttribute("disabled"));

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={dialogRef}
        className="relative w-full max-w-[280px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl animate-scale-in overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reading-position-restore-title"
      >
        {/* Компактный заголовок */}
        <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[var(--primary)]" aria-hidden />
            </div>
            <div className="min-w-0">
              <p
                id="reading-position-restore-title"
                className="text-sm font-medium text-[var(--foreground)] truncate"
              >
                Продолжить?
              </p>
              <p className="text-xs text-[var(--muted-foreground)] tabular-nums">
                стр. {page} из {totalPages} · {progressPercent}%
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
            aria-label="Закрыть окно восстановления позиции"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Прогресс */}
        <div className="px-3 pb-2">
          <div className="h-1 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Кнопки */}
        <div className="px-3 pb-3 flex gap-2">
          <button
            ref={primaryActionRef}
            type="button"
            onClick={() => {
              onRestore();
              onClose();
            }}
            className="flex-1 py-2 px-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-sm font-medium rounded-lg transition-colors active:scale-[0.98]"
          >
            Продолжить
          </button>
          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="flex-shrink-0 p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            title="С начала"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Другая страница — раскрывается по клику */}
        {onJumpToPage && (
          <>
            <button
              type="button"
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="w-full px-3 pb-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center justify-center gap-1"
            >
              {showCustomInput ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              Другая страница
            </button>
            {showCustomInput && (
              <div className="px-3 pb-3 pt-0 space-y-2 border-t border-[var(--border)]/50">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={customPage}
                    onChange={e =>
                      setCustomPage(
                        Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1)),
                      )
                    }
                    className="w-16 px-2 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md text-center focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={handleCustomJump}
                    className="flex-1 py-1.5 text-xs font-medium bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary)]/90"
                  >
                    Перейти
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {quickJumpOptions.map(opt => (
                    <button
                      key={opt.page}
                      type="button"
                      onClick={() => handleQuickJump(opt.page)}
                      className={`px-2 py-1 rounded text-[10px] font-medium ${opt.page === page ? "bg-[var(--primary)] text-white" : "bg-[var(--secondary)] text-[var(--foreground)]"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Настройки — компактный блок */}
        <div className="px-3 pb-2 pt-1 border-t border-[var(--border)]/50 space-y-1">
          <label className="flex items-center justify-between gap-2 py-1.5 cursor-pointer">
            <span className="text-[11px] text-[var(--muted-foreground)]">Мгновенно</span>
            <input
              type="checkbox"
              checked={instantContinue}
              onChange={e => handleInstantContinueChange(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
          </label>
          <label className="flex items-center justify-between gap-2 py-1.5 cursor-pointer">
            <span className="text-[11px] text-[var(--muted-foreground)]">Всегда с начала</span>
            <input
              type="checkbox"
              checked={isAlwaysStartFromBeginning}
              onChange={e => handleAlwaysStartChange(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
          </label>
          {!instantContinue && !isAlwaysStartFromBeginning && (
            <label className="flex items-center justify-between gap-2 py-1.5 cursor-pointer">
              <span className="text-[11px] text-[var(--muted-foreground)]">Таймер 5 с</span>
              <input
                type="checkbox"
                checked={autoRestoreEnabled}
                onChange={e => handleAutoRestoreChange(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
              />
            </label>
          )}
        </div>

        {/* Таймер */}
        {autoRestoreEnabled && !isPaused && !isAlwaysStartFromBeginning && !instantContinue && (
          <div className="px-3 pb-2 flex items-center gap-2">
            <div className="flex-1 h-0.5 bg-[var(--muted)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--primary)] rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)] tabular-nums w-5">
              {countdown} с
            </span>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
