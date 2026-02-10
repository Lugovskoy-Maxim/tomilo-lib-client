"use client";

import { useState, useEffect, useCallback } from "react";
import { X, BookOpen, Clock, ChevronRight, RotateCcw } from "lucide-react";

interface ReadingPositionRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
  onReset: () => void;
  page: number;
  timestamp: number;
  totalPages: number;
}

export default function ReadingPositionRestoreModal({
  isOpen,
  onClose,
  onRestore,
  onReset,
  page,
  timestamp,
  totalPages,
}: ReadingPositionRestoreModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [isAlwaysStartFromBeginning, setIsAlwaysStartFromBeginning] = useState(false);

  // Загрузка настройки "всегда начинать с начала"
  useEffect(() => {
    const saved = localStorage.getItem("reader-always-start-from-beginning");
    if (saved === "true") {
      setIsAlwaysStartFromBeginning(true);
    }
  }, []);

  // Сохранение настройки
  const handleAlwaysStartChange = useCallback((value: boolean) => {
    setIsAlwaysStartFromBeginning(value);
    localStorage.setItem("reader-always-start-from-beginning", value.toString());
  }, []);

  // Таймер обратного отсчета
  useEffect(() => {
    if (!isOpen) return;

    // Если включена настройка "всегда с начала", сразу сбрасываем
    if (isAlwaysStartFromBeginning) {
      onReset();
      onClose();
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onRestore();
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isAlwaysStartFromBeginning, onRestore, onReset, onClose]);

  // Форматирование времени последнего чтения
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

  // Прогресс чтения
  const progressPercent = Math.round((page / totalPages) * 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop с размытием */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => {
          onReset();
          onClose();
        }}
      />

      {/* Модальное окно */}
      <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Декоративный градиент */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]" />

        {/* Шапка */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[var(--foreground)]">
                  Продолжить чтение?
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Найдена сохраненная позиция
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onReset();
                onClose();
              }}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
          </div>
        </div>

        {/* Информация о позиции */}
        <div className="px-6 py-4 bg-[var(--background)]/50 border-y border-[var(--border)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Clock className="w-4 h-4" />
              <span>Последний раз: {formatLastReadTime(timestamp)}</span>
            </div>
            <span className="text-xs px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-medium">
              {progressPercent}% прочитано
            </span>
          </div>

          {/* Прогресс-бар */}
          <div className="w-full h-2 bg-[var(--muted)] rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">
              Страница <span className="font-semibold text-[var(--foreground)]">{page}</span> из {totalPages}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              Осталось {totalPages - page} стр.
            </span>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="p-6 space-y-3">
          {/* Кнопка продолжить */}
          <button
            onClick={() => {
              onRestore();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] rounded-xl font-medium transition-all active:scale-[0.98] group"
          >
            <span>Продолжить чтение</span>
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            <span className="ml-1 text-sm opacity-80">({countdown})</span>
          </button>

          {/* Кнопка начать сначала */}
          <button
            onClick={() => {
              onReset();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[var(--secondary)] hover:bg-[var(--accent)] text-[var(--foreground)] rounded-xl font-medium transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Начать сначала</span>
          </button>

          {/* Чекбокс "всегда с начала" */}
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--muted)]/50 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={isAlwaysStartFromBeginning}
              onChange={(e) => handleAlwaysStartChange(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm text-[var(--muted-foreground)]">
              Всегда начинать главы сначала
            </span>
          </label>
        </div>

        {/* Индикатор авто-восстановления */}
        <div className="px-6 pb-4">
          <div className="w-full h-1 bg-[var(--muted)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 5) * 100}%` }}
            />
          </div>
          <p className="text-xs text-center text-[var(--muted-foreground)] mt-2">
            Автоматическое восстановление через {countdown} сек.
          </p>
        </div>
      </div>

      {/* CSS анимации */}
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
