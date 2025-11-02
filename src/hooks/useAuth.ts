import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetProfileQuery } from "@/store/api/authApi";
import {
  login,
  logout,
  setLoading,
  updateUser,
} from "@/store/slices/authSlice";
import { RootState } from "@/store";
import { AuthResponse, StoredUser } from "@/types/auth";

// Сохраняем ваши существующие ключи
const AUTH_TOKEN_KEY = "tomilo_lib_token";
const USER_DATA_KEY = "tomilo_lib_user";

// Базовый URL API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  const token =
    typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;


  const {
    data: user,
    isLoading: profileLoading,
    error,
    refetch: refetchProfile,
  } = useGetProfileQuery(undefined, {
    skip: !token,
  });

  // Синхронизируем состояние загрузки
  useEffect(() => {
    dispatch(setLoading(profileLoading));
  }, [profileLoading, dispatch]);

  // При успешной проверке авторизации обновляем состояние
  useEffect(() => {
    if (user && token) {
      const authResponse: AuthResponse = {
        access_token: token,
        user: {
          id: user.id || user._id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
      dispatch(login(authResponse));
    }
  }, [user, token, dispatch]);

  // При ошибке проверки авторизации разлогиниваемся
  useEffect(() => {
    if (error && token) {
      console.error("Auth check failed:", error);

      // Проверяем, что это именно ошибка авторизации (404 или 401), а не сетевые проблемы
      if ("status" in error && (error.status === 401 || error.status === 404)) {
        dispatch(logout());
      }
    }
  }, [error, token, dispatch]);

  // Функция для обновления данных пользователя
  const updateUserData = (userData: Partial<StoredUser>) => {
    dispatch(updateUser(userData));

    // Также обновляем данные в localStorage
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem(USER_DATA_KEY);
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          const updatedUser = { ...userObj, ...userData };
          localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
        }
      } catch (e) {
        console.error("Error updating user data in localStorage:", e);
      }
    }
  };

  // Функция для обновления аватара
  const updateAvatar = async (
    avatarFile: File
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await fetch(`${API_BASE_URL}/users/profile/avatar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка при обновлении аватара");
      }

      const updatedUser = await response.json();

      // Обновляем пользователя в состоянии
      updateUserData({
        avatar: updatedUser.avatar,
        updatedAt: updatedUser.updatedAt,
      });

      // Перезапрашиваем профиль для получения актуальных данных
      refetchProfile();

      return { success: true };
    } catch (error) {
      console.error("Error updating avatar:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  };

  // Функция для обновления профиля
  const updateProfile = async (profileData: {
    username?: string;
    email?: string;
    bio?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка при обновлении профиля");
      }

      const updatedUser = await response.json();

      // Обновляем пользователя в состоянии
      updateUserData({
        username: updatedUser.username,
        email: updatedUser.email,
        updatedAt: updatedUser.updatedAt,
      });

      // Перезапрашиваем профиль для получения актуальных данных
      refetchProfile();

      return { success: true };
    } catch (error) {
      console.error("Error updating profile:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  };

  // Ваши существующие функции (адаптированные для Redux)
  const loginUser = (authResponse: AuthResponse) => {
    // Сохраняем токен в localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, authResponse.access_token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(authResponse.user));
    }

    dispatch(login(authResponse));
  };

  const logoutUser = () => {
    // Очищаем localStorage при выходе
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
    }

    dispatch(logout());
  };

  return {
    user: auth.user,
    isLoading: auth.isLoading,
    login: loginUser,
    logout: logoutUser,
    updateUser: updateUserData,
    updateAvatar,
    updateProfile,
    refetchProfile,
    isAuthenticated: auth.isAuthenticated,
  };
};
