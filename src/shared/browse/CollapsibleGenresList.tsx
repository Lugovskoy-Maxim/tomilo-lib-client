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
  maxVisibleGenres = 12
}: CollapsibleGenresListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Если жанров меньше или равно максимальному количеству для показа, не показываем кнопку
  const shouldShowToggle = genres.length > maxVisibleGenres;
  
  const visibleGenres = isExpanded 
    ? genres 
    : genres.slice(0, maxVisibleGenres);
  
  const hiddenCount = genres.length - maxVisibleGenres;

  return (
    <div className="space-y-2">
      {/* Список жанров */}
      <div className="space-y-2">
        {visibleGenres.map((genre) => (
          <label
            key={genre}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={selectedGenres.includes(genre)}
                onChange={() => onGenreChange(genre)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${
                  selectedGenres.includes(genre)
                    ? "bg-[var(--primary)] border-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50"
                }`}
              >
                {selectedGenres.includes(genre) && (
                  <Check className="w-3 h-3 text-[var(--muted-foreground)]" />
                )}
              </div>
            </div>
            <span className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              {genre}
            </span>
          </label>
        ))}
      </div>

      {/* Кнопка разворачивания/сворачивания */}
      {shouldShowToggle && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors cursor-pointer py-1 px-2 rounded hover:bg-[var(--primary)]/10"
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
