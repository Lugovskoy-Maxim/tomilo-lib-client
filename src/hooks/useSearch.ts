"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { searchApi } from "../api/searchApi";
import { SearchResult } from "@/types/search";

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // отменяем предыдущий запрос, если он ещё не завершился
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      const results = await searchApi(term, controller.signal);
      setSearchResults(results);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // игнорируем отменённые запросы
      } else {
        setError(err instanceof Error ? err.message : "Произошла ошибка при поиске");
      }
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (term: string) => {
      setSearchTerm(term);

      // для избежания частых запросов
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        performSearch(term);
      }, 300);
    },
    [performSearch],
  );

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setSearchResults([]);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return {
    searchTerm,
    searchResults,
    isLoading,
    error,
    handleSearchChange,
    performSearch,
    clearSearch,
  };
}
