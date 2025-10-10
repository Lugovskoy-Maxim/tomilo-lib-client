"use client";

import { useSearch } from "../../hooks/useSearch";
import { SearchIcon, XIcon } from "lucide-react";
import SearchResults from "./searchResult";

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

  // Правильный обработчик для onChange
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearchChange(e.target.value);
  };

  // Обработчик нажатия клавиш
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
        break;
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <SearchIcon className="w-5 h-5 text-[var(--muted-foreground)]" />
        </div>

        <input
          type="text"
          id="search-input"
          name="search"
          placeholder="Что ищем..."
          className="w-full pl-10 pr-10 py-2 rounded-full bg-secondary text-foreground 
                   border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-ring 
                   focus:border-transparent transition-all duration-200"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {/* Индикатор загрузки */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Кнопка очистки */}
        {!isLoading && searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground transition-colors hover:text-[var(--secondary-foreground)]"
            aria-label="Очистить поиск"
          >
            <XIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Результаты поиска */}
      <SearchResults
        results={searchResults}
        isLoading={isLoading}
        error={error}
        searchTerm={searchTerm}
      />
    </div>
  );
}
