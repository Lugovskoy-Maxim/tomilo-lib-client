export enum TitleStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  PAUSE = 'pause',
  CANCELLED = 'cancelled',
}

export interface TitlesState {
  titles: Title[];
  search: string;
  selectedGenre: string | null;
  selectedStatus: string | null;
  selectedTitle: Title | null;
  isLoading: boolean;
  error: string | null;
}

export interface Title {
  _id: string;
  name: string;
  altNames?: string[];
  description: string;
  genres: string[];
  tags: string[];
  artist?: string;
  coverImage?: string;
  status: TitleStatus;
  author?: string;
  views: number;
  totalChapters: number;
  rating: number;
  releaseYear: number;
  ageLimit: number;
  chapters?: string[];
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateTitleDto = Omit<Title, '_id' | 'views' | 'rating' | 'totalChapters' | 'createdAt' | 'updatedAt'>;
export type UpdateTitleDto = Partial<CreateTitleDto>;
