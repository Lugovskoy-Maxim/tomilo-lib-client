"use client";

import { useSearch } from "../../hooks/useSearch";
import { SearchIcon, XIcon } from "lucide-react";
import SearchResults from "./SearchResult";

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
    <div className="relative w-full max-w-lg transition-all duration-300 ease-out focus-within:max-w-xl">
      <div className="relative flex items-center">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <SearchIcon className="w-5 h-5 text-[var(--muted-foreground)] transition-colors duration-300" />
        </div>

        <input
          type="text"
          id="search-input"
          name="search"
          placeholder="Что ищем..."
          className="w-full pl-12 pr-12 py-3 text-foreground 
                   search-input-modern focus:outline-none transition-all duration-300"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {/* Индикатор загрузки */}
        {isLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Кнопка очистки */}
        {!isLoading && searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-[var(--muted-foreground)] transition-all duration-200 hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
            aria-label="Очистить поиск"
          >
            <XIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Результаты поиска */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-screen max-w-2xl mt-2 z-50 px-4">
        <SearchResults
          results={searchResults}
          isLoading={isLoading}
          error={error}
          searchTerm={searchTerm}
        />
      </div>
    </div>
  );
}
