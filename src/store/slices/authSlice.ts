import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, StoredUser, AuthResponse } from '@/types/auth';

// Ваши существующие ключи
const AUTH_TOKEN_KEY = "tomilo_lib_token";
const USER_DATA_KEY = "tomilo_lib_user";

// Функция для загрузки состояния из localStorage (сохраняем вашу логику)
const loadAuthState = (): Partial<AuthState> => {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }

  try {
    const userData = localStorage.getItem(USER_DATA_KEY);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (userData && token) {
      const user = JSON.parse(userData);
      return {
        user,
        isAuthenticated: true,
      };
    }
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
  }
  
  return { user: null, isAuthenticated: false };
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Начинаем с загрузки
  ...loadAuthState(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<AuthResponse>) => {
      const { user, access_token } = action.payload;
      
      const storedUser: StoredUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        token: access_token,
      };

      state.user = storedUser;
      state.isAuthenticated = true;

      // Сохраняем в localStorage (ваша существующая логика)
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(storedUser));
        localStorage.setItem(AUTH_TOKEN_KEY, access_token);
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;

      // Очищаем localStorage (ваша существующая логика)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { login, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;