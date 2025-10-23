import { useState, useEffect } from "react";
import { AuthResponse, StoredUser } from "@/types/auth";

// Ключи для localStorage
const AUTH_TOKEN_KEY = "tomilo_lib_token";
const USER_DATA_KEY = "tomilo_lib_user";

export const useAuth = () => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Функции для работы с localStorage
  const authStorage = {
    saveUser: (authResponse: AuthResponse): void => {
      const userData: StoredUser = {
        id: authResponse.user.id,
        email: authResponse.user.email,
        username: authResponse.user.username,
        token: authResponse.access_token,
      };

      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      localStorage.setItem(AUTH_TOKEN_KEY, authResponse.access_token);
    },

    getUser: (): StoredUser | null => {
      try {
        const userData = localStorage.getItem(USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        return null;
      }
    },

    getToken: (): string | null => {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    },

    clear: (): void => {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
    },
  };

  // Загрузка пользователя при монтировании
  useEffect(() => {
    const savedUser = authStorage.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = (authResponse: AuthResponse) => {
    authStorage.saveUser(authResponse);
    const userData = authStorage.getUser();
    setUser(userData);
  };

  const logout = () => {
    authStorage.clear();
    setUser(null);
  };

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };
};
