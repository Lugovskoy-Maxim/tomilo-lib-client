"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

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

  const shouldShowToggle = genres.length > maxVisibleGenres;
  const visibleGenres = isExpanded ? genres : genres.slice(0, maxVisibleGenres);
  const hiddenCount = genres.length - maxVisibleGenres;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {visibleGenres.map(genre => (
          <label
            key={genre}
            className={`inline-flex items-center cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedGenres.includes(genre)
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--background)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedGenres.includes(genre)}
              onChange={() => onGenreChange(genre)}
              className="sr-only"
            />
            {genre}
          </label>
        ))}
      </div>

      {shouldShowToggle && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline py-1.5"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Свернуть
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Ещё {hiddenCount}
            </>
          )}
        </button>
      )}
    </div>
  );
}
