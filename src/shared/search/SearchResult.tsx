"use client";

import { SearchResult as SearchResultType } from "@/types/search";
import Link from "next/link";
import Image from "next/image";
import { getTitlePath } from "@/lib/title-paths";
import { translateTitleType } from "@/lib/title-type-translations";
import { Star, SearchX, AlertCircle, BookOpen } from "lucide-react";
import { getCoverUrl } from "@/lib/asset-url";

interface SearchResultsProps {
  results: SearchResultType[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
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
    <div className="flex items-start gap-3 px-3 py-3 rounded-xl animate-pulse">
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
    <div
      className="search-results-panel w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--popover)]"
      role="region"
      aria-label="Результаты поиска"
    >
      {children}
    </div>
  );
}

export default function SearchResults({
  results,
  isLoading,
  error,
  searchTerm,
}: SearchResultsProps) {
  const normalizedSearchTerm = searchTerm.trim();

  if (!normalizedSearchTerm) return null;

  if (isLoading) {
    return (
      <Container>
        <div className="p-3 border-b border-[var(--border)]/50">
          <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            Поиск...
          </p>
        </div>
        <div className="p-2 max-h-80 overflow-hidden flex flex-col gap-0.5">
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
          className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center"
          role="alert"
        >
          <div className="p-3 rounded-full bg-[var(--destructive)]/10 text-[var(--destructive)]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">{error}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Проверьте соединение и попробуйте снова
          </p>
        </div>
      </Container>
    );
  }

  if (!Array.isArray(results) || (results.length === 0 && normalizedSearchTerm)) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center">
          <div className="p-3 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
            <SearchX className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            По запросу «{normalizedSearchTerm}» ничего не найдено
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Попробуйте другое название или ключевые слова
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="px-3 py-2.5 border-b border-[var(--border)]/50 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
        <span className="text-xs font-medium text-[var(--muted-foreground)]">
          Найдено: {results.length}
        </span>
      </div>
      <div
        className="max-h-80 overflow-y-auto overscroll-contain p-2 flex flex-col gap-0.5 custom-scrollbar"
        data-testid="search-results"
      >
        {results.map((result) => (
          <Link
            key={result.id}
            href={getTitlePath(result)}
            className="search-result-card flex items-start gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--popover)]"
            role="option"
          >
            {result.cover ? (
              <div className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-[var(--muted)] shadow-sm ring-1 ring-[var(--border)]/50">
                <Image
                  loader={() => getCoverUrl(result.cover)}
                  src={getCoverUrl(result.cover)}
                  alt=""
                  width={48}
                  height={64}
                  className="object-cover w-full h-full"
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
                {result.rating != null && (
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
