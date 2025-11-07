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
  bookmarks?: string[];
  readingHistory?: {
    titleId: string;
    chapters: {
      chapterId: string;
      chapterNumber: number;
      chapterTitle: string | null;
      readAt: string;
    }[];
    readAt: string;
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
  bookmarks?: string[];
  readingHistory: {
    titleId: string;
    chapters: {
      chapterId: string;
      chapterNumber: number;
      chapterTitle: string | null;
      readAt: string;
    }[];
    readAt: string;
  }[];
}
  