"use client";
import { useState } from "react";
import { Clock, BookOpen, ChevronRight } from "lucide-react";
import { UserProfile } from "@/types/user";

interface ReadingHistoryProps {
  history: UserProfile["readingHistory"];
}

export default function ReadingHistory({ history }: ReadingHistoryProps) {
  const [visibleCount, setVisibleCount] = useState(5);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Вчера";
    if (diffDays < 7) return `${diffDays} дня назад`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} недели назад`;
    return date.toLocaleDateString("ru-RU");
  };

  const showMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  if (history.length === 0) {
    return (
      <div className="bg-[var(--secondary)] rounded-xl p-8 text-center border border-[var(--border)]">
        <BookOpen className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          История чтения пуста
        </h3>
        <p className="text-[var(--muted-foreground)]">
          Начните читать мангу, чтобы она появилась здесь
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--secondary)] rounded-xl p-6 border border-[var(--border)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)] flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>История чтения</span>
        </h2>
        <span className="text-sm text-[var(--muted-foreground)]">
          {history.length} записей
        </span>
      </div>

      <div className="space-y-3">
        {history.slice(0, visibleCount).map((item, index) => (
          <div
            key={index}
            className="flex items-center space-x-4 p-3 rounded-lg hover:bg-[var(--background)] transition-colors cursor-pointer group"
          >
            <div className="w-12 h-16 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-[var(--primary)]" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-[var(--foreground)] truncate">
                {item.title}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {item.chapter}
              </p>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-xs text-[var(--muted-foreground)] flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(item.date)}</span>
                </span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {visibleCount < history.length && (
        <div className="text-center mt-6">
          <button
            onClick={showMore}
            className="px-6 py-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
          >
            Показать еще
          </button>
        </div>
      )}
    </div>
  );
}
