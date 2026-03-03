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
    <div className="flex flex-wrap gap-1.5">
      {filters.genres.map(genre => (
        <button
          key={genre}
          type="button"
          onClick={() => onRemoveGenre(genre)}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-md text-xs font-medium hover:bg-[var(--primary)]/20 transition-colors"
        >
          {genre}
          <X className="w-3 h-3" />
        </button>
      ))}
      {filters.types.map(type => (
        <button
          key={type}
          type="button"
          onClick={() => onRemoveType(type)}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-md text-xs font-medium hover:bg-[var(--primary)]/20 transition-colors"
        >
          {translateTitleType(type)}
          <X className="w-3 h-3" />
        </button>
      ))}
      {filters.status.map(status => (
        <button
          key={status}
          type="button"
          onClick={() => onRemoveStatus(status)}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-md text-xs font-medium hover:bg-[var(--primary)]/20 transition-colors"
        >
          {translateTitleStatus(status)}
          <X className="w-3 h-3" />
        </button>
      ))}
      {filters.ageLimits.map(ageLimit => (
        <button
          key={ageLimit}
          type="button"
          onClick={() => onRemoveAgeLimit(ageLimit)}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-md text-xs font-medium hover:bg-[var(--primary)]/20 transition-colors"
        >
          {ageLimit === 0 ? "Для всех" : `${ageLimit}+`}
          <X className="w-3 h-3" />
        </button>
      ))}
      {filters.releaseYears.map(year => (
        <button
          key={year}
          type="button"
          onClick={() => onRemoveReleaseYear(year)}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-md text-xs font-medium hover:bg-[var(--primary)]/20 transition-colors"
        >
          {year}
          <X className="w-3 h-3" />
        </button>
      ))}
      {filters.tags.map(tag => (
        <button
          key={tag}
          type="button"
          onClick={() => onRemoveTag(tag)}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-md text-xs font-medium hover:bg-[var(--primary)]/20 transition-colors"
        >
          {tag}
          <X className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
}
