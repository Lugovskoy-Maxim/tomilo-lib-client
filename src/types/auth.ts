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

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export interface StoredUser {
  updatedAt: string;
  createdAt: string;
  _id: string;
  id: string;
  email: string;
  username: string;
  avatar?: string;
  role: string;
  level?: number;
  experience?: number;
  balance?: number;
  bookmarks?: string[];
  readingHistory?: {
    titleId: {
      _id: string;
      name: string;
      altNames?: string[];
      description?: string;
      genres?: string[];
      tags?: string[];
      coverImage?: string;
      status: string;
      views: number;
      totalChapters: number;
      rating: number;
      ageLimit: number;
      chapters: string[]; // массив chapterId
      isPublished: boolean;
      type?: string;
      createdAt: string;
      updatedAt: string;
      dayViews?: number;
      lastDayReset?: string;
      lastMonthReset?: string;
      lastWeekReset?: string;
      monthViews?: number;
      weekViews?: number;
    };
    chapters: {
      chapterId: {
        _id: string;
        titleId: string;
        chapterNumber: number;
        name: string;
        pages: string[];
        views: number;
        isPublished: boolean;
        releaseDate: string;
        createdAt: string;
        updatedAt: string;
      };
      chapterNumber: number;
      chapterTitle: string;
      readAt: string;
      _id: string;
    }[];
    readAt: string;
    _id: string;
  }[];
}

export interface AuthResponse {
  access_token: string;
  user: StoredUser;
}

export interface AuthState {
  user: StoredUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// RTK Query
export interface User {
  updatedAt: string;
  createdAt: string;
  _id: string;
  id: string;
  email: string;
  username: string;
  avatar?: string;
  role: string;
  level?: number;
  bookmarks?: string[];
  readingHistory: {
    titleId: {
      _id: string;
      name: string;
      altNames?: string[];
      description?: string;
      genres?: string[];
      tags?: string[];
      coverImage?: string;
      status: string;
      views: number;
      totalChapters: number;
      rating: number;
      ageLimit: number;
      chapters: string[]; // массив chapterId
      isPublished: boolean;
      type?: string;
      createdAt: string;
      updatedAt: string;
      dayViews?: number;
      lastDayReset?: string;
      lastMonthReset?: string;
      lastWeekReset?: string;
      monthViews?: number;
      weekViews?: number;
    };
    chapters: {
      chapterId: {
        _id: string;
        titleId: string;
        chapterNumber: number;
        name: string;
        pages: string[];
        views: number;
        isPublished: boolean;
        releaseDate: string;
        createdAt: string;
        updatedAt: string;
      };
      chapterNumber: number;
      chapterTitle: string;
      readAt: string;
      _id: string;
    }[];
    readAt: string;
    _id: string;
  }[];
}
  