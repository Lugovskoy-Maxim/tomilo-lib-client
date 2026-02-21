import { Title } from "./title";

export interface Collection {
  id: string;
  cover: string;
  name: string;
  description?: string;
  titles: string[];
  /** Количество тайтлов (может приходить с API списка без поля titles) */
  titlesCount?: number;
  comments: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionWithTitles {
  id: string;
  cover: string;
  name: string;
  description?: string;
  titles: Title[];
  comments: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
}

// Типы для DTO (Data Transfer Objects)
export type CreateCollectionDto = Omit<Collection, "id" | "views" | "createdAt" | "updatedAt">;
export type UpdateCollectionDto = Partial<CreateCollectionDto>;

// Типы для запросов с пагинацией и фильтрацией
export interface CollectionsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "views" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Типы для API ответов
export interface CollectionsResponse {
  collections: Collection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CollectionStats {
  totalCollections: number;
  totalViews: number;
  averageViews: number;
}

// Типы для UI состояний
export interface CollectionsState {
  collections: Collection[];
  search: string;
  selectedCollection: Collection | null;
  isLoading: boolean;
  error: string | null;
}

export interface CollectionViewState {
  collection: Collection | null;
  titles: Title[];
  isLoading: boolean;
  error: string | null;
  activeTab: "description" | "titles" | "comments";
}
