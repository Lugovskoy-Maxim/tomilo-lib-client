"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { searchApi as legacySearchApi } from "../api/searchApi";
import { useGetAutocompleteQuery } from "@/store/api/searchApi";
import { SearchResult } from "@/types/search";

const RECENT_SEARCHES_KEY = "tomilo_search_recent";
const RECENT_SEARCHES_MAX = 6;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const prev = getRecentSearches();
  const next = [trimmed, ...prev.filter(q => q !== trimmed)].slice(0, RECENT_SEARCHES_MAX);
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function removeRecentSearchItem(query: string): string[] {
  const prev = getRecentSearches();
  const next = prev.filter(q => q !== query);
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // RTK Query для автодополнения (показываем больше тайтлов)
  const {
    data: autocompleteData,
    isLoading,
    isFetching,
  } = useGetAutocompleteQuery(
    { q: debouncedTerm, limit: 24 },
    {
      skip: !debouncedTerm.trim() || debouncedTerm.length < 2,
    },
  );

  // Преобразуем ответ autocomplete в формат SearchResult; наиболее релевантные — сверху (API отдаёт в обратном порядке)
  const searchResults: SearchResult[] = useMemo(() => {
    if (!autocompleteData?.data) return [];
    const mapped = autocompleteData.data.map(item => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      cover: item.cover,
      type: item.type,
      releaseYear: item.releaseYear,
      rating: item.averageRating,
      totalChapters: item.totalChapters,
    }));
    return mapped.reverse();
  }, [autocompleteData]);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    setError(null);

    // Debounce для автодополнения
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedTerm(term);
    }, 300);
  }, []);

  // Для полного поиска (используется при нажатии Enter)
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setError(null);
      return;
    }

    setError(null);
    saveRecentSearch(term);
    setRecentSearches(getRecentSearches());

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

  const applyRecentSearch = useCallback((query: string) => {
    setSearchTerm(query);
    setDebouncedTerm(query);
  }, []);

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches(removeRecentSearchItem(query));
  }, []);

  const saveCurrentQuery = useCallback(() => {
    const q = searchTerm.trim();
    if (q) {
      saveRecentSearch(q);
      setRecentSearches(getRecentSearches());
    }
  }, [searchTerm]);

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
    recentSearches,
    handleSearchChange,
    performSearch,
    clearSearch,
    applyRecentSearch,
    removeRecentSearch,
    saveCurrentQuery,
  };
}
