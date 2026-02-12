"use client";

import { Filters } from "@/types/browse-page";
import { X } from "lucide-react";
import { translateTitleType, translateTitleStatus } from "@/lib/title-type-translations";

interface ActiveFilterChipsProps {
  filters: Filters;
  onRemoveGenre: (genre: string) => void;
  onRemoveType: (type: string) => void;
  onRemoveStatus: (status: string) => void;
  onRemoveAgeLimit: (ageLimit: number) => void;
  onRemoveReleaseYear: (year: number) => void;
  onRemoveTag: (tag: string) => void;
  filterLabels?: {
    genres?: Record<string, string>;
    types?: Record<string, string>;
  };
}

export default function ActiveFilterChips({
  filters,
  onRemoveGenre,
  onRemoveType,
  onRemoveStatus,
  onRemoveAgeLimit,
  onRemoveReleaseYear,
  onRemoveTag,
}: ActiveFilterChipsProps) {
  const hasActiveFilters =
    filters.genres.length > 0 ||
    filters.types.length > 0 ||
    filters.status.length > 0 ||
    filters.ageLimits.length > 0 ||
    filters.releaseYears.length > 0 ||
    filters.tags.length > 0;

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {filters.genres.map(genre => (
        <button
          key={genre}
          onClick={() => onRemoveGenre(genre)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/15 text-[var(--primary)] rounded-lg text-sm font-medium hover:bg-[var(--primary)]/25 transition-colors border border-[var(--primary)]/30"
        >
          {genre}
          <X className="w-3.5 h-3.5" />
        </button>
      ))}
      {filters.types.map(type => (
        <button
          key={type}
          onClick={() => onRemoveType(type)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/15 text-[var(--primary)] rounded-lg text-sm font-medium hover:bg-[var(--primary)]/25 transition-colors border border-[var(--primary)]/30"
        >
          {translateTitleType(type)}
          <X className="w-3.5 h-3.5" />
        </button>
      ))}
      {filters.status.map(status => (
        <button
          key={status}
          onClick={() => onRemoveStatus(status)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/15 text-[var(--primary)] rounded-lg text-sm font-medium hover:bg-[var(--primary)]/25 transition-colors border border-[var(--primary)]/30"
        >
          {translateTitleStatus(status)}
          <X className="w-3.5 h-3.5" />
        </button>
      ))}
      {filters.ageLimits.map(ageLimit => (
        <button
          key={ageLimit}
          onClick={() => onRemoveAgeLimit(ageLimit)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/15 text-[var(--primary)] rounded-lg text-sm font-medium hover:bg-[var(--primary)]/25 transition-colors border border-[var(--primary)]/30"
        >
          {ageLimit === 0 ? "Для всех" : `${ageLimit}+`}
          <X className="w-3.5 h-3.5" />
        </button>
      ))}
      {filters.releaseYears.map(year => (
        <button
          key={year}
          onClick={() => onRemoveReleaseYear(year)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/15 text-[var(--primary)] rounded-lg text-sm font-medium hover:bg-[var(--primary)]/25 transition-colors border border-[var(--primary)]/30"
        >
          {year}
          <X className="w-3.5 h-3.5" />
        </button>
      ))}
      {filters.tags.map(tag => (
        <button
          key={tag}
          onClick={() => onRemoveTag(tag)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/15 text-[var(--primary)] rounded-lg text-sm font-medium hover:bg-[var(--primary)]/25 transition-colors border border-[var(--primary)]/30"
        >
          {tag}
          <X className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}
