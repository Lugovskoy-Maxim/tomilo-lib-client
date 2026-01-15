import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, StoredUser } from "@/types/auth";

const AUTH_TOKEN_KEY = "tomilo_lib_token";
const USER_DATA_KEY = "tomilo_lib_user";

// Функция для получения начального состояния из localStorage
const getInitialState = (): AuthState => {
  if (typeof window === "undefined") {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  }

  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userData = localStorage.getItem(USER_DATA_KEY);

    if (token && userData) {
      const user: StoredUser = JSON.parse(userData);
      return {
        user,
        isAuthenticated: true,
        isLoading: false,
      };
    }
  } catch (error) {
    console.error("Error reading auth data from localStorage:", error);
  }

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
  };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    login: (state, action: PayloadAction<{ access_token: string; user: StoredUser }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    logout: state => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      // Очищаем localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
      }
    },
    updateUser: (state, action: PayloadAction<Partial<StoredUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };

        // Обновляем в localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(state.user));
        }
      }
    },
  },
});

export const { setLoading, login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
