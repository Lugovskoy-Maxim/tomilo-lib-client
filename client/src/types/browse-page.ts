// Типы для фильтров
export type SortBy = "rating" | "year" | "views" | "chapters";
export type SortOrder = "asc" | "desc";

export interface Filters {
  search: string;
  genres: string[];
  types: string[];
  status: string[];
  sortBy: SortBy;
  sortOrder: SortOrder;
}