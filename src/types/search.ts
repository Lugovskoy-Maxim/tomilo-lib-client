// Types for search functionality


export interface SearchResult {
  id: string;
  slug?: string;
  title: string;
  cover?: string;
  description?: string;
  type?: string;
  releaseYear?: number;
  rating?: number;
  totalChapters?: number;
}

export interface PopularSearchesResult {
  id: string;
  term: string;
  count: number;
}
