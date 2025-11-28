import { Title } from "./title";

// ApiResponseDto - стандартный формат ответа API
export interface ApiResponseDto<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
  path: string;
  method?: string;
}

export interface Collection {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  link?: string;
  titles?: string[];
  views: number;
  comments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CollectionWithTitles {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  link?: string;
  titles: {
    _id: string;
    name: string;
    coverImage?: string;
  }[];
  views: number;
  comments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Типы для DTO (Data Transfer Objects)
export type CreateCollectionDto = Omit<Collection, '_id' | 'views' | 'createdAt' | 'updatedAt'>;
export type UpdateCollectionDto = Partial<CreateCollectionDto>;

// Типы для запросов с пагинацией и фильтрацией
export interface CollectionsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'views' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
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
  activeTab: 'description' | 'titles' | 'comments';
}
