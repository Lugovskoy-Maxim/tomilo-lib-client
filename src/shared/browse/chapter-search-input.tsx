// components/chapter-search-input/chapter-search-input.tsx
"use client";
import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ChapterSearchInputProps {
  value: string;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function ChapterSearchInput({ 
  value,
  onSearch, 
  placeholder = "Поиск по номеру или названию главы..."
}: ChapterSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Сохраняем позицию курсора при каждом рендере
  useEffect(() => {
    if (inputRef.current) {
      const cursorPosition = inputRef.current.selectionStart;
      inputRef.current.focus();
      if (cursorPosition !== null) {
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }
  });

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
      />
    </div>
  );
}