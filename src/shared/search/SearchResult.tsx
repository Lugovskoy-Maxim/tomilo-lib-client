"use client";

import { SearchResult } from "@/types/search";
import Link from "next/link";
import Image from "next/image";
import { getTitlePath } from "@/lib/title-paths";
import { translateTitleType } from "@/lib/title-type-translations";
import { Star } from "lucide-react";

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
}

const Container = ({ children }: { children: React.ReactNode }) => (
  <div
    className="search-results-modern w-full min-w-[450px] max-w-2xl p-3 left-1/2 -translate-x-1/2 relative"
    role="region"
    aria-label="Результаты поиска"
  >
    {children}
  </div>
);

const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3001";

export default function SearchResults({
  results,
  isLoading,
  error,
  searchTerm,
}: SearchResultsProps) {
  // Фильтрация пустых/некорректных запросов
  const normalizedSearchTerm = searchTerm.trim();

  if (!normalizedSearchTerm) return null;

  // Упрощённая логика через раннее возврат
  if (isLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center py-4" aria-live="polite">
          <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-sm text-[var(--muted-foreground)]">Поиск...</span>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="text-sm text-[var(--destructive)] py-3 px-2" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  if (!Array.isArray(results) || (results.length === 0 && normalizedSearchTerm)) {
    return (
      <Container>
        <div className="text-sm text-[var(--muted-foreground)] text-center py-4">
          {`Ничего не найдено по запросу "${normalizedSearchTerm}"`}
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-h-80 overflow-y-auto flex flex-col gap-1 " data-testid="search-results">
        {results.map(result => (
          <Link
            key={result.id}
            href={getTitlePath(result)}
            className="flex px-3 py-3 dropdown-item-modern rounded-xl border-b border-[var(--border)]/30 last:border-b-0"
            onClick={() => {
              // Опционально: логика закрытия попапа после выбора
            }}
          >
            <div className="flex items-start gap-3">
              {result.cover && (
                <div className="flex-shrink-0">
                  <Image
                    loader={() => `${baseUrl}${result.cover}`}
                    src={`${baseUrl}${result.cover}`}
                    alt={result.title}
                    width={48}
                    height={64}
                    className="object-cover rounded-lg shadow-md"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{result.title}</div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {result.type && (
                    <span className="text-xs bg-[var(--secondary)]/80 text-[var(--secondary-foreground)] px-2.5 py-1 rounded-full border border-[var(--border)]/50">
                      {translateTitleType(result.type)}
                    </span>
                  )}
                  {result.releaseYear && (
                    <span className="text-xs text-muted-foreground">{result.releaseYear} г.</span>
                  )}
                  {result.rating !== undefined && (
                    <span className="flex items-center gap-1 text-xs text-[var(--chart-1)] font-medium">
                      <Star className="w-3.5 h-3.5 fill-[var(--chart-1)]" />
                      {result.rating.toFixed(1)}
                    </span>
                  )}
                  {result.totalChapters !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      Глав: {result.totalChapters}
                    </span>
                  )}
                </div>
                {result.description && (
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {result.description}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
