import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetProfileQuery, useAddBookmarkMutation, useRemoveBookmarkMutation, useGetContinueReadingQuery, useAddToReadingHistoryMutation, useRemoveFromReadingHistoryMutation } from "@/store/api/authApi";
import { useUpdateChapterMutation } from "@/store/api/chaptersApi"; // Импортируем useUpdateChapterMutation
import {
  login,
  logout,
  setLoading,
  updateUser,
} from "@/store/slices/authSlice";
import { RootState } from "@/store";
import { AuthResponse, StoredUser, ApiResponseDto, User } from "@/types/auth";

// Сохраняем ваши существующие ключи
const AUTH_TOKEN_KEY = "tomilo_lib_token";
const USER_DATA_KEY = "tomilo_lib_user";

// Базовый URL API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  // Получаем токен напрямую из localStorage при каждом рендере
  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  const token = getToken();


  const {
    data: profileResponse,
    isLoading: profileLoading,
    error,
    refetch: refetchProfile,
  } = useGetProfileQuery(undefined, {
    skip: !getToken(),
  });

  const [addBookmark] = useAddBookmarkMutation();
  const [removeBookmark] = useRemoveBookmarkMutation();
  const [updateChapter] = useUpdateChapterMutation(); // Добавляем useUpdateChapterMutation
  const [addToReadingHistory] = useAddToReadingHistoryMutation(); // Добавляем useAddToReadingHistoryMutation
  const [removeFromReadingHistory] = useRemoveFromReadingHistoryMutation(); // Добавляем useRemoveFromReadingHistoryMutation
  const { data: continueReadingData, isLoading: continueReadingLoading, error: continueReadingError } = useGetContinueReadingQuery(undefined, {
    skip: !getToken(),
  });

  // Синхронизируем состояние загрузки
  useEffect(() => {
    dispatch(setLoading(profileLoading));
  }, [profileLoading, dispatch]);

  // При успешной проверке авторизации обновляем состояние
  useEffect(() => {
    const currentToken = getToken();
    if (profileResponse && profileResponse.success && profileResponse.data && currentToken) {
      const user: User = profileResponse.data;
      const authResponse: AuthResponse = {
        access_token: currentToken,
        user: {
          _id: user._id,
          id: user.id || user._id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          role: user.role,
          bookmarks: user.bookmarks,
          readingHistory: user.readingHistory,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
      dispatch(login(authResponse));
    }
  }, [profileResponse, token, dispatch]);

  // При ошибке проверки авторизации разлогиниваемся
  useEffect(() => {
    if (error && getToken()) {
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
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка при обновлении аватара");
      }

      const result: ApiResponseDto<User> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Ошибка при обновлении аватара");
      }

      // Обновляем пользователя в состоянии
      updateUserData({
        avatar: result.data?.avatar,
        updatedAt: result.data?.updatedAt,
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
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка при обновлении профиля");
      }

      const result: ApiResponseDto<User> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Ошибка при обновлении профиля");
      }

      // Обновляем пользователя в состоянии
      updateUserData({
        username: result.data?.username,
        email: result.data?.email,
        updatedAt: result.data?.updatedAt,
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

  // Функция для добавления закладки
  const addBookmarkToUser = async (titleId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await addBookmark(titleId).unwrap();
      
      if (!result.success) {
        throw new Error(result.message || "Ошибка при добавлении в закладки");
      }

      // Обновляем пользователя в состоянии
      updateUserData({
        bookmarks: result.data?.bookmarks,
        updatedAt: result.data?.updatedAt,
      });

      // Перезапрашиваем профиль для получения актуальных данных
      refetchProfile();

      return { success: true };
    } catch (error) {
      console.error("Error adding bookmark:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  };

  // Функция для удаления закладки
  const removeBookmarkFromUser = async (titleId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await removeBookmark(titleId).unwrap();
      
      if (!result.success) {
        throw new Error(result.message || "Ошибка при удалении из закладок");
      }

      // Обновляем пользователя в состоянии
      updateUserData({
        bookmarks: result.data?.bookmarks,
        updatedAt: result.data?.updatedAt,
      });

      // Перезапрашиваем профиль для получения актуальных данных
      refetchProfile();

      return { success: true };
    } catch (error) {
      console.error("Error removing bookmark:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  };

  // Функция для обновления счетчиков просмотров
  const updateChapterViewsCount = async (chapterId: string, currentViews: number): Promise<{ success: boolean; error?: string }> => {
    try {
      // Используем updateChapter для обновления просмотров
      const result = await updateChapter({
        id: chapterId,
        data: { views: currentViews + 1 } as Partial<any> // eslint-disable-line @typescript-eslint/no-explicit-any
      }).unwrap();
      
      return { success: true };
    } catch (error) {
      console.error("Error updating chapter views:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  };

  // Функция для добавления записи в историю чтения
  const addToReadingHistoryFunc = async (titleId: string, chapterId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await addToReadingHistory({ titleId, chapterId }).unwrap();

      if (!result.success) {
        throw new Error(result.message || "Ошибка при добавлении в историю чтения");
      }

      // Перезапрашиваем профиль для получения актуальных данных
      refetchProfile();

      return { success: true };
    } catch (error) {
      console.error("Error adding to reading history:", error);
      throw error; // Перебрасываем ошибку, чтобы она была обработана в компоненте
    }
  };

  // Функция для удаления записи из истории чтения
  const removeFromReadingHistoryFunc = async (titleId: string, chapterId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await removeFromReadingHistory({ titleId, chapterId }).unwrap();
      
      if (!result.success) {
        throw new Error(result.message || "Ошибка при удалении из истории чтения");
      }

      // Перезапрашиваем профиль для получения актуальных данных
      refetchProfile();

      return { success: true };
    } catch (error) {
      console.error("Error removing from reading history:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  };

  // Ваши существующие функции (адаптированные для Redux)
  const loginUser = (authResponse: ApiResponseDto<AuthResponse>) => {
    // Извлекаем токен из правильного поля
    const token = authResponse.data?.access_token;
    const user = authResponse.data?.user;
    
    if (typeof window !== "undefined" && token && user) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      
      // Вызываем dispatch с правильной структурой
      dispatch(login({
        access_token: token,
        user: user
      }));
    }
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
    addBookmark: addBookmarkToUser,
    removeBookmark: removeBookmarkFromUser,
    updateChapterViews: updateChapterViewsCount,
    addToReadingHistory: addToReadingHistoryFunc,
    continueReading: continueReadingData?.data,
    continueReadingLoading,
    continueReadingError,
    refetchProfile,
    isAuthenticated: auth.isAuthenticated,
    removeFromReadingHistory: removeFromReadingHistoryFunc,
  };
};
