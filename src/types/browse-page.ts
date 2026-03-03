// Типы для фильтров
export type SortBy =
  | "createdAt"
  | "updatedAt"
  | "name"
  | "views"
  | "weekViews"
  | "dayViews"
  | "monthViews"
  | "averageRating"
  | "releaseYear"
  | "rating"
  | "year"
  | "chapters";
export type SortOrder = "asc" | "desc";

export interface Filters {
  search: string;
  genres: string[];
  types: string[];
  status: string[];
  ageLimits: number[];
  releaseYears: number[];
  /** Диапазон годов: от (включительно). Приоритет над releaseYears при запросе. */
  releaseYearFrom?: number;
  /** Диапазон годов: до (включительно). */
  releaseYearTo?: number;
  tags: string[];
  sortBy: SortBy;
  sortOrder: SortOrder;
}
