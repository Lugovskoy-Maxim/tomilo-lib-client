"use client";

import { SearchResult as SearchResultType } from "@/types/search";
import Link from "next/link";
import { getTitlePath } from "@/lib/title-paths";
import { translateTitleType } from "@/lib/title-type-translations";
import { Star, SearchX, AlertCircle, BookOpen, History, X, Sparkles } from "lucide-react";
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
      <mark className="search-highlight">{text.slice(idx, idx + query.trim().length)}</mark>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

function SkeletonCard() {
  return (
    <div className="search-skeleton-card">
      <div className="search-skeleton-cover" />
      <div className="search-skeleton-content">
        <div className="search-skeleton-line search-skeleton-title" />
        <div className="search-skeleton-meta">
          <span className="search-skeleton-chip" />
          <span className="search-skeleton-chip search-skeleton-chip-sm" />
        </div>
        <div className="search-skeleton-line search-skeleton-desc" />
        <div className="search-skeleton-line search-skeleton-desc short" />
      </div>
    </div>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="search-results-root" role="region" aria-label="Результаты поиска">
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
          <div className="search-section-head">
            <History className="search-section-icon" strokeWidth={2} aria-hidden />
            <span>Недавние запросы</span>
          </div>
          <div className="search-recent-list">
            {recentSearches.map(query => (
              <div key={query} className="search-recent-chip">
                <button
                  type="button"
                  onClick={() => onRecentSelect?.(query)}
                  className="search-recent-chip-text"
                >
                  {query}
                </button>
                {onRecentRemove && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onRecentRemove(query);
                    }}
                    className="search-recent-chip-remove"
                    aria-label={`Удалить «${query}» из истории`}
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Container>
      );
    }
    return (
      <Container>
        <div className="search-empty-state">
          <span className="search-empty-icon" aria-hidden>
            <Sparkles className="w-10 h-10" strokeWidth={1.5} />
          </span>
          <p className="search-empty-title">Поиск по каталогу</p>
          <p className="search-empty-desc">
            Введите название, автора или ключевые слова — результаты появятся автоматически
          </p>
        </div>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <div className="search-section-head search-section-head-loading">
          <span className="search-loading-dot" aria-hidden />
          <span>Ищем по каталогу...</span>
        </div>
        <div className="search-skeleton-list">
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="search-error-state" role="alert">
          <span className="search-error-icon">
            <AlertCircle className="w-9 h-9" strokeWidth={2} />
          </span>
          <p className="search-error-title">Ошибка загрузки</p>
          <p className="search-error-desc">{error}</p>
          <p className="search-error-hint">Проверьте интернет и попробуйте ещё раз</p>
        </div>
      </Container>
    );
  }

  if (!Array.isArray(results) || (results.length === 0 && normalizedSearchTerm)) {
    return (
      <Container>
        <div className="search-empty-query-state">
          <span className="search-empty-query-icon">
            <SearchX className="w-10 h-10" strokeWidth={1.5} />
          </span>
          <p className="search-empty-query-title">Ничего не найдено</p>
          <p className="search-empty-query-desc">
            По запросу «<strong>{normalizedSearchTerm}</strong>» в каталоге нет совпадений
          </p>
          <p className="search-empty-query-hint">
            Попробуйте другое написание, часть названия или автора
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="search-section-head">
        <BookOpen className="search-section-icon" strokeWidth={2} aria-hidden />
        <span>Найдено: {results.length}</span>
      </div>
      <ul className="search-results-list" data-testid="search-results" role="list">
        {results.map(result => (
          <li key={result.id}>
            <Link
              href={getTitlePath(result)}
              onClick={onResultClick}
              className="search-result-card"
              role="option"
            >
              {result.cover ? (
                <span className="search-result-cover">
                  <OptimizedImage
                    src={getCoverUrls(result.cover).primary}
                    fallbackSrc={getCoverUrls(result.cover).fallback}
                    alt=""
                    width={56}
                    height={80}
                    className="object-cover w-full h-full"
                    hidePlaceholder
                  />
                </span>
              ) : (
                <span className="search-result-cover search-result-cover-placeholder">
                  <BookOpen className="w-7 h-7 text-[var(--muted-foreground)]" strokeWidth={1.5} />
                </span>
              )}
              <span className="search-result-info">
                <span className="search-result-title">
                  <HighlightMatch text={result.title} query={normalizedSearchTerm} />
                </span>
                <span className="search-result-meta">
                  {result.type && (
                    <span className="search-result-badge">{translateTitleType(result.type)}</span>
                  )}
                  {result.releaseYear != null && (
                    <span className="search-result-meta-item">{result.releaseYear}</span>
                  )}
                  {result.rating != null && result.rating > 0 && (
                    <span className="search-result-rating">
                      <Star className="w-3.5 h-3.5 fill-[var(--chart-1)]" aria-hidden />
                      {result.rating.toFixed(1)}
                    </span>
                  )}
                  {result.totalChapters != null && (
                    <span className="search-result-meta-item">{result.totalChapters} гл.</span>
                  )}
                </span>
                {result.description && <p className="search-result-desc">{result.description}</p>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
