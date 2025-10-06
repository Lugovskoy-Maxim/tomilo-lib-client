'use client'

import { useState, useCallback, useRef } from 'react';
import { searchApi, SearchResult } from '../api/searchApi';

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchApi(term);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при поиске');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    
    // для избежания частых запросов
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      performSearch(term);
    }, 300);
  }, [performSearch]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
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