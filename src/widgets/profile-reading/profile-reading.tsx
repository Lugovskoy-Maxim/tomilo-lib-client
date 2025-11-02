"use client";

import { BookOpen } from "lucide-react";

interface ReadingHistoryItem {
  title: string;
  chapter: string;
  date: string;
}

interface ReadingHistorySectionProps {
  readingHistory: ReadingHistoryItem[];
}
function ReadingHistorySection({
  readingHistory,
}: ReadingHistorySectionProps) {
  return (
    <div className="bg-[var(--secondary)] rounded-xl p-6 border border-[var(--border)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[var(--muted-foreground)] flex items-center space-x-2">
          <BookOpen className="h-5 w-5"/>
          <span>История чтения</span>
        </h2>
        <span className="text-xs text-[var(--muted-foreground)] bg-[var(--background)] px-2 py-1 rounded">
          {readingHistory.length} записей
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {readingHistory.slice(0, 4).map((item, index) => (
          <div
            key={index}
            className="bg-[var(--background)] rounded-lg p-4 border border-[var(--border)] hover:border-[var(--primary)] transition-colors cursor-pointer group"
          >
            <div className="flex items-start space-x-3">
              <div className="w-12 h-16 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--chart-1)]/20 rounded flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-[var(--muted-foreground)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[var(--muted-foreground)] text-sm mb-1 truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mb-2">
                  {item.chapter}
                </p>
                <div className="flex items-center space-x-2 text-xs text-[var(--muted-foreground)]">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{new Date(item.date).toLocaleDateString("ru-RU")}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {readingHistory.length > 4 && (
        <div className="text-center mt-4">
          <button className="text-xs text-[var(--muted-foreground)] hover:text-[var(--muted-foreground)]/80 transition-colors">
            Показать все {readingHistory.length} записей
          </button>
        </div>
      )}
    </div>
  );
}

export default ReadingHistorySection;