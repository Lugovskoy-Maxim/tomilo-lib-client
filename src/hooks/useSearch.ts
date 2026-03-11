"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  useGetAutocompleteQuery,
  useLazyGetFullSearchQuery,
} from "@/store/api/searchApi";
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
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());
  const [fullSearchResults, setFullSearchResults] = useState<SearchResult[] | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // RTK Query: автодополнение (показываем подсказки при вводе)
  const {
    data: autocompleteData,
    isLoading: autocompleteLoading,
    isFetching: autocompleteFetching,
  } = useGetAutocompleteQuery(
    { q: debouncedTerm, limit: 24 },
    {
      skip: !debouncedTerm.trim() || debouncedTerm.length < 2,
    },
  );

  const [triggerFullSearch, { isLoading: fullSearchLoading, isFetching: fullSearchFetching }] =
    useLazyGetFullSearchQuery();

  // Результаты: после Enter — полный поиск, иначе — из автодополнения
  const searchResultsFromAutocomplete: SearchResult[] = useMemo(() => {
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
    })).reverse();
  }, [autocompleteData]);

  const searchResults: SearchResult[] = fullSearchResults ?? searchResultsFromAutocomplete;
  const isLoading = fullSearchLoading || fullSearchFetching || autocompleteLoading || autocompleteFetching;

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    setError(null);
    setFullSearchResults(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedTerm(term);
    }, 300);
  }, []);

  // Полный поиск по Enter (RTK Query)
  const performSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setError(null);
        setFullSearchResults(null);
        return;
      }

      setError(null);
      saveRecentSearch(term);
      setRecentSearches(getRecentSearches());

      try {
        const result = await triggerFullSearch(term.trim()).unwrap();
        const list = Array.isArray(result) ? result : Array.isArray((result as { data?: unknown })?.data) ? (result as { data: SearchResult[] }).data : [];
        setFullSearchResults(list);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // игнорируем отменённые запросы
        } else {
          setError(err instanceof Error ? err.message : "Произошла ошибка при поиске");
        }
        setFullSearchResults([]);
      }
    },
    [triggerFullSearch],
  );

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
    setFullSearchResults(null);
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
    isLoading,
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
