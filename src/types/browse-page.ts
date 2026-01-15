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
  tags: string[];
  sortBy: SortBy;
  sortOrder: SortOrder;
}
