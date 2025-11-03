"use client";

import { SearchResult } from "@/api/searchApi";
import Link from "next/link";

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
            <div className="font-medium text-foreground">{result.title}</div>
            {result.description && (
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {result.description}
              </div>
            )}
          </Link>
        ))}
      </div>
    </Container>
  );
}
