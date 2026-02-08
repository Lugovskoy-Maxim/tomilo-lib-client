"use client";
import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleGenresListProps {
  genres: string[];
  selectedGenres: string[];
  onGenreChange: (genre: string) => void;
  maxVisibleGenres?: number;
}

export default function CollapsibleGenresList({
  genres,
  selectedGenres,
  onGenreChange,
  maxVisibleGenres = 12,
}: CollapsibleGenresListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Если жанров меньше или равно максимальному количеству для показа, не показываем кнопку
  const shouldShowToggle = genres.length > maxVisibleGenres;

  const visibleGenres = isExpanded ? genres : genres.slice(0, maxVisibleGenres);

  const hiddenCount = genres.length - maxVisibleGenres;

  return (
    <div className="space-y-2">
      {/* Список жанров */}
      <div className="space-y-1">
        {visibleGenres.map(genre => (
          <label 
            key={genre} 
            className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-all duration-200 ${
              selectedGenres.includes(genre) 
                ? "bg-[var(--primary)]/10" 
                : "hover:bg-[var(--accent)]"
            }`}
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={selectedGenres.includes(genre)}
                onChange={() => onGenreChange(genre)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 border rounded flex items-center justify-center transition-all duration-200 ${
                  selectedGenres.includes(genre)
                    ? "bg-[var(--primary)] border-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--background)]"
                }`}
              >
                {selectedGenres.includes(genre) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
            <span className={`text-sm font-medium transition-colors ${
              selectedGenres.includes(genre) 
                ? "text-[var(--primary)]" 
                : "text-[var(--muted-foreground)]"
            }`}>
              {genre}
            </span>
          </label>
        ))}
      </div>

      {/* Кнопка разворачивания/сворачивания */}
      {shouldShowToggle && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:text-[var(--chart-1)] transition-colors cursor-pointer py-2 px-3 rounded-lg hover:bg-[var(--primary)]/10 w-full justify-center mt-2 border border-[var(--primary)]/20 hover:border-[var(--primary)]/40"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Свернуть
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Показать ещё ({hiddenCount})
            </>
          )}
        </button>
      )}
    </div>
  );
}
