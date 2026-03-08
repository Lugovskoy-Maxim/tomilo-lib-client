"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

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
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredGenres = useMemo(() => {
    if (!query.trim()) return [...genres].sort((a, b) => a.localeCompare(b));
    const q = query.trim().toLowerCase();
    return genres.filter(g => g.toLowerCase().includes(q)).sort((a, b) => a.localeCompare(b));
  }, [genres, query]);

  const shouldShowToggle = filteredGenres.length > maxVisibleGenres;
  const visibleGenres = isExpanded ? filteredGenres : filteredGenres.slice(0, maxVisibleGenres);
  const hiddenCount = filteredGenres.length - maxVisibleGenres;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск жанра..."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          aria-label="Поиск по жанрам"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleGenres.map(genre => (
          <label
            key={genre}
            className={`inline-flex cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors select-none ${
              selectedGenres.includes(genre)
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "bg-[var(--muted)]/40 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
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

      {filteredGenres.length === 0 && (
        <p className="py-2 text-center text-sm text-[var(--muted-foreground)]">Ничего не найдено</p>
      )}

      {shouldShowToggle && filteredGenres.length > 0 && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline py-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Свернуть
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Показать ещё {hiddenCount}
            </>
          )}
        </button>
      )}
    </div>
  );
}
