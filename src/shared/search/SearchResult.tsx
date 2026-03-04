"use client";

import { SearchResult as SearchResultType } from "@/types/search";
import Link from "next/link";
import { getTitlePath } from "@/lib/title-paths";
import { translateTitleType } from "@/lib/title-type-translations";
import { Star, SearchX, AlertCircle, BookOpen, History, X } from "lucide-react";
import { getCoverUrls } from "@/lib/asset-url";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";

interface SearchResultsProps {
  results: SearchResultType[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  recentSearches?: string[];
  onRecentSelect?: (query: string) => void;
  onRecentRemove?: (query: string) => void;
  onResultClick?: () => void;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const lower = query.trim().toLowerCase();
  const idx = text.toLowerCase().indexOf(lower);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[var(--primary)]/20 text-[var(--foreground)] rounded px-0.5 font-medium">
        {text.slice(idx, idx + query.trim().length)}
      </mark>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 mx-2 rounded-xl animate-pulse bg-[var(--muted)]/30">
      <div className="w-12 h-16 rounded-lg bg-[var(--muted)]/60 shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-3/4 rounded bg-[var(--muted)]/60" />
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-[var(--muted)]/50" />
          <div className="h-5 w-12 rounded bg-[var(--muted)]/50" />
        </div>
        <div className="h-3 w-full rounded bg-[var(--muted)]/40" />
        <div className="h-3 w-2/3 rounded bg-[var(--muted)]/40" />
      </div>
    </div>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full" role="region" aria-label="Результаты поиска">
      {children}
    </div>
  );
}

export default function SearchResults({
  results,
  isLoading,
  error,
  searchTerm,
  recentSearches = [],
  onRecentSelect,
  onRecentRemove,
  onResultClick,
}: SearchResultsProps) {
  const normalizedSearchTerm = searchTerm.trim();

  if (!normalizedSearchTerm) {
    if (recentSearches.length > 0 && onRecentSelect) {
      return (
        <Container>
          <div className="search-results-section-title">
            <History className="w-4 h-4 shrink-0" />
            <span>Недавние запросы</span>
          </div>
          <div className="px-2 py-2 pb-4 flex flex-wrap gap-2">
            {recentSearches.map((query) => (
              <span
                key={query}
                className="inline-flex items-center gap-1.5 pl-3 pr-1 py-2 rounded-full bg-[var(--secondary)] border border-[var(--border)] text-sm font-medium text-[var(--foreground)]"
              >
                <button
                  type="button"
                  onClick={() => onRecentSelect?.(query)}
                  className="truncate max-w-[180px] text-left hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:rounded-full"
                >
                  {query}
                </button>
                {onRecentRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRecentRemove(query);
                    }}
                    className="shrink-0 p-1 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    aria-label={`Удалить «${query}» из истории`}
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                )}
              </span>
            ))}
          </div>
        </Container>
      );
    }
    return (
      <Container>
        <div className="py-12 px-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Введите название или автора
          </p>
        </div>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <div className="search-results-section-title">
          <span>Поиск...</span>
        </div>
        <div className="p-2 pb-4 flex flex-col gap-1">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div
          className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center"
          role="alert"
        >
          <div className="p-4 rounded-2xl bg-[var(--destructive)]/10 text-[var(--destructive)]">
            <AlertCircle className="w-8 h-8" strokeWidth={2} />
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">{error}</p>
          <p className="text-xs text-[var(--muted-foreground)] max-w-[260px]">
            Проверьте соединение и попробуйте снова
          </p>
        </div>
      </Container>
    );
  }

  if (!Array.isArray(results) || (results.length === 0 && normalizedSearchTerm)) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
          <div className="p-4 rounded-2xl bg-[var(--muted)] text-[var(--muted-foreground)]">
            <SearchX className="w-8 h-8" strokeWidth={2} />
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            По запросу «{normalizedSearchTerm}» ничего не найдено
          </p>
          <p className="text-xs text-[var(--muted-foreground)] max-w-[260px]">
            Попробуйте другое название или ключевые слова
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="search-results-section-title">
        <BookOpen className="w-4 h-4 shrink-0" />
        <span>Найдено: {results.length}</span>
      </div>
      <div className="py-1 pb-4" data-testid="search-results">
        {results.map((result) => (
          <Link
            key={result.id}
            href={getTitlePath(result)}
            onClick={onResultClick}
            className="search-result-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--popover)]"
            role="option"
          >
            {result.cover ? (
              <div className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-[var(--muted)] shadow-sm ring-1 ring-[var(--border)]/50">
                <OptimizedImage
                  src={getCoverUrls(result.cover).primary}
                  fallbackSrc={getCoverUrls(result.cover).fallback}
                  alt=""
                  width={48}
                  height={64}
                  className="object-cover w-full h-full"
                  hidePlaceholder
                />
              </div>
            ) : (
              <div className="w-12 h-16 shrink-0 rounded-lg bg-[var(--muted)]/80 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[var(--muted-foreground)]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[var(--foreground)] text-sm leading-tight line-clamp-2">
                <HighlightMatch text={result.title} query={normalizedSearchTerm} />
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {result.type && (
                  <span className="text-[10px] font-medium uppercase tracking-wide bg-[var(--secondary)] text-[var(--secondary-foreground)] px-2 py-0.5 rounded-md border border-[var(--border)]/50">
                    {translateTitleType(result.type)}
                  </span>
                )}
                {result.releaseYear != null && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {result.releaseYear}
                  </span>
                )}
                {result.rating != null && result.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-[var(--chart-1)] font-medium">
                    <Star className="w-3.5 h-3.5 fill-[var(--chart-1)]" />
                    {result.rating.toFixed(1)}
                  </span>
                )}
                {result.totalChapters != null && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {result.totalChapters} гл.
                  </span>
                )}
              </div>
              {result.description && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2 leading-relaxed">
                  {result.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
