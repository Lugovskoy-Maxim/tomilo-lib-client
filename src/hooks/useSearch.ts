"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { searchApi as legacySearchApi } from "../api/searchApi";
import { useGetAutocompleteQuery } from "@/store/api/searchApi";
import { SearchResult } from "@/types/search";

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // RTK Query для автодополнения
  const { data: autocompleteData, isLoading, isFetching } = useGetAutocompleteQuery(
    { q: debouncedTerm, limit: 10 },
    { 
      skip: !debouncedTerm.trim() || debouncedTerm.length < 2,
    }
  );

  // Преобразуем ответ autocomplete в формат SearchResult
  const searchResults: SearchResult[] = useMemo(() => {
    if (!autocompleteData?.data) return [];
    return autocompleteData.data.map(item => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      cover: item.cover,
      type: item.type,
      releaseYear: item.releaseYear,
      rating: item.averageRating,
      totalChapters: item.totalChapters,
    }));
  }, [autocompleteData]);

  const handleSearchChange = useCallback(
    (term: string) => {
      setSearchTerm(term);
      setError(null);

      // Debounce для автодополнения
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setDebouncedTerm(term);
      }, 300);
    },
    [],
  );

  // Для полного поиска (используется при нажатии Enter)
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setError(null);
      return;
    }

    setError(null);

    try {
      // Используем старый API для полного поиска (с описанием и т.д.)
      const results = await legacySearchApi(term);
      return results;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // игнорируем отменённые запросы
      } else {
        setError(err instanceof Error ? err.message : "Произошла ошибка при поиске");
      }
      return [];
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setDebouncedTerm("");
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    searchTerm,
    searchResults,
    isLoading: isLoading || isFetching,
    error,
    handleSearchChange,
    performSearch,
    clearSearch,
  };
}
