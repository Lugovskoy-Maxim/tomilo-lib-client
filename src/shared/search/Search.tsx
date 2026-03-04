"use client";

import { useSearch } from "../../hooks/useSearch";
import { SearchIcon, XIcon } from "lucide-react";
import SearchResults from "./SearchResult";
import { useRef, useEffect, useState } from "react";

interface SearchProps {
  /** Только панель (без триггера): для мобильного хедера — открытие по кнопке снаружи */
  trigger?: "default" | "none";
  /** Управление открытием извне (обязательно при trigger="none") */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Показать кнопку «Закрыть» в шапке панели (удобно на мобильном) */
  showCloseInPanel?: boolean;
}

export default function Search({
  trigger = "default",
  open: controlledOpen = false,
  onOpenChange,
  showCloseInPanel = false,
}: SearchProps) {
  const {
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
  } = useSearch();

  const containerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPanelOnly = trigger === "none";
  const isOpen = isPanelOnly ? controlledOpen : internalOpen;
  const setOpen = isPanelOnly && onOpenChange ? onOpenChange : setInternalOpen;

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
        if (isPanelOnly && onOpenChange) {
          onOpenChange(false);
        } else {
          clearSearch();
          inputRef.current?.blur();
          setInternalOpen(false);
        }
        break;
    }
  };

  // Фокус в поле при открытии в режиме «только панель»
  useEffect(() => {
    if (isPanelOnly && isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [isPanelOnly, isOpen]);

  // Закрытие по клику снаружи
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const listbox = document.getElementById("search-results-listbox");
      const insideTrigger = !isPanelOnly && containerRef.current?.contains(target);
      const insidePanel = listbox?.contains(target);
      if (insideTrigger || insidePanel) return;
      if (isPanelOnly && onOpenChange) {
        onOpenChange(false);
      } else {
        inputRef.current?.blur();
        setInternalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPanelOnly, onOpenChange]);

  const showPanel = isOpen || (!isPanelOnly && (isFocused || searchTerm.trim().length > 0));

  const openSearch = () => {
    setInternalOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closePanel = () => {
    if (isPanelOnly && onOpenChange) onOpenChange(false);
    else setInternalOpen(false);
  };

  return (
    <>
      {trigger !== "none" && (
        <button
          ref={containerRef as React.RefObject<HTMLButtonElement>}
          type="button"
          onClick={openSearch}
          className="search-container w-full min-w-0 flex items-center gap-2 px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-left text-[var(--muted-foreground)] hover:border-[var(--border)]/80 hover:bg-[var(--card)]/90 transition-colors"
          role="combobox"
          aria-expanded={showPanel}
          aria-haspopup="listbox"
          aria-controls="search-results-listbox"
        >
          <SearchIcon className="w-5 h-5 shrink-0" strokeWidth={2} />
          <span className="truncate">Название, автор...</span>
        </button>
      )}
      {showPanel && (
        <>
          <div
            className="search-overlay-backdrop"
            aria-hidden
            onClick={() => closePanel()}
          />
          <div
            id="search-results-listbox"
            role="listbox"
            className="search-overlay-panel"
          >
            <div className="search-overlay-header">
              <div className="search-overlay-input-wrap">
                <SearchIcon className="w-5 h-5 search-overlay-icon" strokeWidth={2} aria-hidden />
                <input
                  ref={inputRef}
                  type="text"
                  id="search-input"
                  name="search"
                  placeholder="Название, автор..."
                  className="search-overlay-input"
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => !isPanelOnly && setTimeout(() => setIsFocused(false), 150)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-label="Поиск по каталогу"
                  aria-autocomplete="list"
                  aria-activedescendant={undefined}
                />
                <span className="search-overlay-actions">
                  {isLoading && (
                    <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" aria-hidden />
                  )}
                  {!isLoading && searchTerm && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
                      aria-label="Очистить поиск"
                    >
                      <XIcon className="w-5 h-5" strokeWidth={2} />
                    </button>
                  )}
                </span>
              </div>
              {showCloseInPanel && (
                <button
                  type="button"
                  onClick={closePanel}
                  className="search-overlay-close"
                  aria-label="Закрыть поиск"
                >
                  <XIcon className="w-5 h-5" strokeWidth={2} />
                </button>
              )}
            </div>
            <div className="search-overlay-body custom-scrollbar">
              <SearchResults
                results={searchResults}
                isLoading={isLoading}
                error={error}
                searchTerm={searchTerm}
                recentSearches={recentSearches}
                onRecentSelect={applyRecentSearch}
                onRecentRemove={removeRecentSearch}
                onResultClick={() => {
                  saveCurrentQuery();
                  if (isPanelOnly && onOpenChange) onOpenChange(false);
                }}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
