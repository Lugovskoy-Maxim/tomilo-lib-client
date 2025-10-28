export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

// export interface AuthResponse {
//   access_token: string;
//   user: {
//     id: string;
//     email: string;
//     username: string;
//   };
// }

export interface StoredUser {
  id: string;
  email: string;
  username: string;
}

export interface StoredUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
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
    readingHistory: {
    title: string;
    chapter: string;
    date: Date;
  }[];
}

export interface AuthState {
  user: StoredUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}