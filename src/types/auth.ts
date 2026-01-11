// ApiResponseDto - стандартный формат ответа API
export type { ApiResponseDto } from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
}

export interface StoredUser {
  updatedAt: string;
  createdAt: string;
  _id: string;
  id: string;
  email: string;
  emailVerified?: boolean;
  username: string;
  avatar?: string;
  role: string;
  level?: number;
  experience?: number;
  balance?: number;
  bookmarks?: string[];
  readingHistory?: import("@/types/store").ReadingHistoryEntry[];
  birthDate?: string;
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
export type User = StoredUser;
  