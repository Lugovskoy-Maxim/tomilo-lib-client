import React, { useState, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Inbox,
} from "lucide-react";

// Simple cn utility function
function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string") {
      classes.push(input);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(" ");
}

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  hidden?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
  cellClassName?: string;
}

interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  searchable?: boolean;
  searchKeys?: string[];
  sortable?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
  actions?: (item: T) => React.ReactNode;
}

export function AdminTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  searchable = false,
  searchKeys = [],
  sortable = true,
  pagination,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onRowClick,
  emptyMessage = "Нет данных",
  className,
  actions,
}: AdminTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Фильтрация данных
  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm) return data;

    return data.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return searchKeys.some((key) => {
        const value = getNestedValue(item, key);
        return String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [data, searchTerm, searchable, searchKeys]);

  // Сортировка данных
  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      // Handle undefined/null values
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      // Compare as strings for consistent behavior
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, sortable]);

  // Пагинация
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const start = (pagination.page - 1) * pagination.limit;
    return sortedData.slice(start, start + pagination.limit);
  }, [sortedData, pagination]);

  const handleSort = (key: string) => {
    if (!sortable) return;

    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    const allIds = paginatedData.map(keyExtractor);
    const allSelected = allIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !allIds.includes(id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...allIds])]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelectionChange) return;

    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const getSortIcon = (column: Column<T>) => {
    if (!sortable || !column.sortable) return null;

    if (sortConfig?.key !== column.key) {
      return <ChevronsUpDown className="w-4 h-4 text-[var(--muted-foreground)]" />;
    }

    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4 text-[var(--primary)]" />
    ) : (
      <ChevronDown className="w-4 h-4 text-[var(--primary)]" />
    );
  };

  if (loading) {
    return (
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 flex-1 bg-[var(--muted)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and filters */}
      {searchable && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] text-sm"
              aria-label="Поиск по таблице"
            />
          </div>
          {selectedIds.length > 0 && (
            <span className="text-sm text-[var(--muted-foreground)]">
              Выбрано: {selectedIds.length}
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--secondary)]">
              <tr>
                {selectable && (
                  <th className="w-12 p-3">
                    <input
                      type="checkbox"
                      checked={
                        paginatedData.length > 0 &&
                        paginatedData.every((item) =>
                          selectedIds.includes(keyExtractor(item))
                        )
                      }
                      onChange={handleSelectAll}
                      className="rounded border-[var(--border)]"
                    />
                  </th>
                )}
                {columns
                  .filter((col) => !col.hidden)
                  .map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "text-left p-3 font-medium text-[var(--foreground)] text-sm",
                        column.sortable && "cursor-pointer hover:bg-[var(--accent)]",
                        column.width
                      )}
                      onClick={() => handleSort(column.key)}
                      style={{ width: column.width }}
                    >
                      <div className="flex items-center gap-1">
                        {column.header}
                        {getSortIcon(column)}
                      </div>
                    </th>
                  ))}
                {actions && <th className="w-20 p-3 text-right">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      columns.filter((c) => !c.hidden).length +
                      (selectable ? 1 : 0) +
                      (actions ? 1 : 0)
                    }
                    className="p-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-3 text-[var(--muted-foreground)]">
                      <div className="p-4 rounded-full bg-[var(--muted)]/50">
                        <Inbox className="w-10 h-10 text-[var(--muted-foreground)]/70" />
                      </div>
                      <p className="font-medium text-[var(--foreground)]">{emptyMessage}</p>
                      <p className="text-sm">Данные появятся здесь после добавления</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => {
                  const id = keyExtractor(item);
                  return (
                    <tr
                      key={id}
                      className={cn(
                        "border-t border-[var(--border)] transition-colors",
                        onRowClick && "cursor-pointer hover:bg-[var(--accent)]/30",
                        selectedIds.includes(id) && "bg-[var(--primary)]/5"
                      )}
                      onClick={() => onRowClick?.(item)}
                    >
                      {selectable && (
                        <td
                          className="p-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(id)}
                            onChange={() => handleSelectRow(id)}
                            className="rounded border-[var(--border)]"
                          />
                        </td>
                      )}
                      {columns
                        .filter((col) => !col.hidden)
                        .map((column) => (
                          <td
                            key={column.key}
                            className={cn(
                              "p-3 text-[var(--foreground)] text-sm",
                              column.cellClassName
                            )}
                          >
                            {column.render
                              ? column.render(item, index)
                              : String(getNestedValue(item, column.key) ?? "-")}
                          </td>
                        ))}
                      {actions && (
                        <td
                          className="p-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {actions(item)}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
            <span className="text-sm text-[var(--muted-foreground)]">
              Показано {paginatedData.length} из {sortedData.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg disabled:opacity-50 hover:bg-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                aria-label="Предыдущая страница"
              >
                Назад
              </button>
              <span className="text-sm text-[var(--foreground)]" aria-live="polite">
                {pagination.page} / {Math.ceil(pagination.total / pagination.limit) || 1}
              </span>
              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={
                  pagination.page >= Math.ceil(pagination.total / pagination.limit)
                }
                className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg disabled:opacity-50 hover:bg-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                aria-label="Следующая страница"
              >
                Вперед
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get nested object values
function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc: unknown, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

// Compact table for smaller spaces
interface CompactTableProps<T> {
  data: T[];
  columns: {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
  }[];
  keyExtractor: (item: T) => string;
  className?: string;
}

export function CompactTable<T>({
  data,
  columns,
  keyExtractor,
  className,
}: CompactTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className="border-b border-[var(--border)] last:border-b-0"
            >
              {columns.map((column, idx) => (
                <td
                  key={column.key}
                  className={cn(
                    "py-2 px-3 text-sm",
                    idx === 0
                      ? "font-medium text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] text-right"
                  )}
                >
                  {column.render
                    ? column.render(item)
                    : String(getNestedValue(item, column.key) ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
