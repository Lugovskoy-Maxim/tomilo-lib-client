"use client";

import { useState, useMemo } from "react";
import { Link2, Plus, X, Search } from "lucide-react";
import type { RelatedTitleEntry, RelatedTitleRelationType, TitleBasic } from "@/types/title";
import { useSearchTitlesQuery } from "@/store/api/titlesApi";
import { getRelatedTitleLabel } from "@/lib/related-title-labels";

const RELATION_TYPES: RelatedTitleRelationType[] = [
  "sequel",
  "prequel",
  "spin_off",
  "adaptation",
  "side_story",
  "alternative_story",
  "other",
];

interface RelatedTitlesManagerProps {
  value: RelatedTitleEntry[];
  onChange: (value: RelatedTitleEntry[]) => void;
  currentTitleId: string;
}

export function RelatedTitlesManager({
  value,
  onChange,
  currentTitleId,
}: RelatedTitlesManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTrigger, setSearchTrigger] = useState("");
  const [addingRelationType, setAddingRelationType] = useState<RelatedTitleRelationType>("sequel");

  const { data: searchData } = useSearchTitlesQuery(
    {
      search: searchTrigger || undefined,
      limit: 15,
      includeAdult: true,
    },
    { skip: searchTrigger.length < 2 },
  );

  const searchResults = useMemo(() => {
    const list = searchData?.data?.data ?? [];
    const existingIds = new Set(
      value.map(e => (typeof e.titleId === "string" ? e.titleId : e.titleId._id)),
    );
    return list.filter(
      (t: { _id?: string }) => t._id && t._id !== currentTitleId && !existingIds.has(t._id),
    );
  }, [searchData?.data?.data, value, currentTitleId]);

  const handleAdd = (title: { _id: string; name?: string; slug?: string }) => {
    onChange([
      ...value,
      { relationType: addingRelationType, titleId: title._id },
    ]);
    setSearchQuery("");
    setSearchTrigger("");
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const displayName = (entry: RelatedTitleEntry) => {
    if (typeof entry.titleId === "object" && entry.titleId !== null) {
      return (entry.titleId as TitleBasic).name ?? (entry.titleId as TitleBasic)._id;
    }
    return entry.titleId;
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/50 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="w-5 h-5 text-[var(--primary)]" />
        <span className="font-medium text-[var(--foreground)]">Связанные тайтлы</span>
      </div>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((entry, index) => (
            <li
              key={`${entry.relationType}-${typeof entry.titleId === "string" ? entry.titleId : (entry.titleId as TitleBasic)._id}-${index}`}
              className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-[var(--secondary)]/70 border border-[var(--border)]/50"
            >
              <span className="text-sm text-[var(--foreground)]">
                <span className="text-[var(--muted-foreground)] font-medium mr-2">
                  {getRelatedTitleLabel(entry.relationType)}:
                </span>
                {displayName(entry)}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
                aria-label="Удалить"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), setSearchTrigger(searchQuery.trim()))}
            placeholder="Поиск тайтла по названию..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
          />
        </div>
        <select
          value={addingRelationType}
          onChange={e => setAddingRelationType(e.target.value as RelatedTitleRelationType)}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 min-w-[160px]"
        >
          {RELATION_TYPES.map(type => (
            <option key={type} value={type}>
              {getRelatedTitleLabel(type)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setSearchTrigger(searchQuery.trim())}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Найти
        </button>
      </div>

      {searchTrigger.length >= 2 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] max-h-48 overflow-y-auto">
          {searchResults.length === 0 ? (
            <p className="p-3 text-sm text-[var(--muted-foreground)]">Ничего не найдено</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {searchResults.slice(0, 10).map((t: { _id: string; name?: string; slug?: string }) => (
                <li key={t._id}>
                  <button
                    type="button"
                    onClick={() => handleAdd(t)}
                    className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]/70 transition-colors"
                  >
                    {t.name ?? t._id}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
