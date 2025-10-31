export enum TitleStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  PAUSE = 'pause',
  CANCELLED = 'cancelled',
}

export enum ChapterStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  HIDDEN = 'hidden',
  DELETED = 'deleted'
}

export enum TitleType {
  MANGA = 'manga',
  MANHWA = 'manhwa',
  MANHUA = 'manhua',
  NOVEL = 'novel',
  LIGHT_NOVEL = 'light_novel',
  COMIC = 'comic',
  OTHER = 'other'
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
  chapters?: string[]; // Array of chapter IDs
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Дополнительные поля для расширения
  type?: TitleType;
  publisher?: string;
  serialization?: string;
  relatedTitles?: string[];
}

export interface Chapter {
  _id: string;
  titleId: string;
  chapterNumber: number;
  volumeNumber?: number;
  title?: string;
  content?: string;
  images?: string[];
  pages?: number;
  releaseDate?: string;
  views: number;
  likes?: number;
  dislikes?: number;
  commentsCount?: number;
  isPublished: boolean;
  isFree: boolean;
  price?: number;
  translator?: string;
  proofreader?: string;
  qualityCheck?: string;
  status: ChapterStatus;
  createdAt: string;
  updatedAt: string;
  // Для сортировки и навигации
  sortOrder?: number;
  // Связь с тайтлом (может быть заполнена при join-запросах)
  titleInfo?: Pick<Title, 'name' | 'coverImage' | 'status'>;
}

// Типы для API ответов
export interface ChaptersResponse {
  chapters: Chapter[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ChapterStats {
  totalChapters: number;
  publishedChapters: number;
  draftChapters: number;
  totalViews: number;
  averageRating?: number;
  lastChapter?: Chapter;
  nextChapterNumber: number;
}

export interface ChapterNavigation {
  previousChapter?: {
    _id: string;
    chapterNumber: number;
    title?: string;
  };
  nextChapter?: {
    _id: string;
    chapterNumber: number;
    title?: string;
  };
  currentChapter: {
    _id: string;
    chapterNumber: number;
    title?: string;
  };
}

// Типы для DTO (Data Transfer Objects)
export type CreateTitleDto = Omit<Title, '_id' | 'views' | 'rating' | 'totalChapters' | 'createdAt' | 'updatedAt'>;
export type UpdateTitleDto = Partial<CreateTitleDto>;

export type CreateChapterDto = Omit<Chapter, '_id' | 'views' | 'createdAt' | 'updatedAt' | 'titleInfo'>;
export type UpdateChapterDto = Partial<CreateChapterDto>;

// Типы для запросов с пагинацией и фильтрацией
export interface ChaptersQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'chapterNumber' | 'releaseDate' | 'views' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  volume?: number;
  isPublished?: boolean;
  status?: ChapterStatus;
}

export interface TitlesQuery {
  page?: number;
  limit?: number;
  search?: string;
  genres?: string[];
  tags?: string[];
  status?: TitleStatus;
  type?: TitleType;
  sortBy?: 'name' | 'releaseYear' | 'views' | 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Типы для читалки
export interface ReadingProgress {
  chapterId: string;
  titleId: string;
  page: number;
  totalPages: number;
  progress: number;
  lastRead: string;
  readTime: number;
}

export interface ReaderSettings {
  readingMode: 'vertical' | 'horizontal' | 'webtoon';
  imageQuality: 'auto' | 'low' | 'medium' | 'high' | 'original';
  preloadImages: boolean;
  showPageNumbers: boolean;
  backgroundColor: string;
  brightness: number;
  contrast: number;
}

export interface ReadingHistory {
  _id: string;
  userId: string;
  titleId: string;
  chapterId: string;
  title: Title;
  chapter: Chapter;
  lastPage: number;
  totalPages: number;
  progress: number;
  lastRead: string;
  readCount: number;
  totalReadTime: number;
}

// Типы для UI состояний
export interface TitleViewState {
  title: Title | null;
  chapters: Chapter[];
  isLoading: boolean;
  error: string | null;
  activeTab: 'description' | 'chapters' | 'comments';
  chaptersQuery: ChaptersQuery;
  hasMoreChapters: boolean;
}

export interface ChapterListState {
  chapters: Chapter[];
  isLoading: boolean;
  error: string | null;
  query: ChaptersQuery;
  hasMore: boolean;
  selectedChapter: Chapter | null;
}