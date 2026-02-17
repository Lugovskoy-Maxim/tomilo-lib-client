"use client";

import { useSearch } from "../../hooks/useSearch";
import { SearchIcon, XIcon } from "lucide-react";
import SearchResults from "./SearchResult";
import { useRef, useEffect } from "react";

export default function Search() {
  const {
    searchTerm,
    searchResults,
    isLoading,
    error,
    handleSearchChange,
    performSearch,
    clearSearch,
  } = useSearch();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearchChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.defaultPrevented) return;
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        performSearch(searchTerm);
        break;
      case "Escape":
        e.preventDefault();
        clearSearch();
        inputRef.current?.blur();
        break;
    }
  };

  // Закрытие выпадающего списка по клику снаружи
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showPanel = searchTerm.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className="search-container relative w-full max-w-lg transition-all duration-300 ease-out focus-within:max-w-xl"
      role="combobox"
      aria-expanded={showPanel}
      aria-haspopup="listbox"
      aria-controls="search-results-listbox"
    >
      <div className="relative flex items-center">
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-[var(--muted-foreground)] transition-colors duration-200 group-focus-within:text-[var(--primary)]"
          aria-hidden
        >
          <SearchIcon className="w-5 h-5" strokeWidth={2} />
        </div>

        <input
          ref={inputRef}
          type="text"
          id="search-input"
          name="search"
          placeholder="Название, автор..."
          className="search-input w-full pl-12 pr-12 py-3.5 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/80 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm transition-all duration-200 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:shadow-md hover:border-[var(--border)]/80"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Поиск по каталогу"
          aria-autocomplete="list"
          aria-activedescendant={undefined}
        />

        {isLoading && (
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-[var(--primary)]"
            aria-hidden
          >
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && searchTerm && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[var(--muted-foreground)] transition-colors duration-200 hover:text-[var(--foreground)] hover:bg-[var(--secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]"
            aria-label="Очистить поиск"
          >
            <XIcon className="w-5 h-5" strokeWidth={2} />
          </button>
        )}
      </div>

      <div
        id="search-results-listbox"
        role="listbox"
        className="absolute top-full left-1/2 -translate-x-1/2 w-[min(100vw-2rem,28rem)] mt-2 z-50"
      >
        {showPanel && (
          <div className="animate-slide-down">
            <SearchResults
              results={searchResults}
              isLoading={isLoading}
              error={error}
              searchTerm={searchTerm}
            />
          </div>
        )}
      </div>
    </div>
  );
}
