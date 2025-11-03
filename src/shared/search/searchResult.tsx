"use client";

import { SearchResult } from "@/api/searchApi";
import Link from "next/link";
import Image from "next/image";

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
}

const Container = ({ children }: { children: React.ReactNode }) => (
  <div
    className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border 
                    rounded-lg shadow-lg z-50 p-4"
    role="region"
    aria-label="Результаты поиска"
  >
    {children}
  </div>
);

const baseUrl =
  process.env.NEXT_PUBLIC_URL || "http://localhost:3001";

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
        <div
          className="flex justify-center items-center py-4"
          aria-live="polite"
        >
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-muted-foreground">Поиск...</span>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="text-sm text-destructive" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  if (results.length === 0 && normalizedSearchTerm) {
    return (
      <Container>
        <div className="text-sm text-muted-foreground text-center">
          {`Ничего не найдено по запросу "${normalizedSearchTerm}"`}
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-h-60 overflow-y-auto" data-testid="search-results">
        {results.map((result) => (
          <Link
            key={result.id}
            href={`/browse/${result.id}`}
            className="block px-4 py-3 hover:bg-accent hover:text-accent-foreground 
                        transition-colors border-b border-border last:border-b-0"
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
                    className="object-cover rounded"
                    
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">
                  {result.title}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {result.type && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                      {result.type}
                    </span>
                  )}
                  {result.releaseYear && (
                    <span className="text-xs text-muted-foreground">
                      {result.releaseYear} г.
                    </span>
                  )}
                  {result.rating !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      ⭐ {result.rating.toFixed(1)}
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
