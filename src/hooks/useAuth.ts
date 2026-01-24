import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetProfileQuery,
  useAddBookmarkMutation,
  useRemoveBookmarkMutation,
  useGetReadingHistoryQuery,
  useGetReadingHistoryByTitleQuery,
  useAddToReadingHistoryMutation,
  useRemoveFromReadingHistoryMutation,
} from "@/store/api/authApi";
import { useUpdateChapterMutation } from "@/store/api/chaptersApi";
import { UpdateChapterDto } from "@/types/title";
import { login, logout, setLoading, updateUser } from "@/store/slices/authSlice";
import { RootState } from "@/store";
import { AuthResponse, StoredUser, ApiResponseDto } from "@/types/auth";
import { checkAndSetAgeVerification, clearAgeVerification } from "@/lib/age-verification";

const AUTH_TOKEN_KEY = "tomilo_lib_token";
const USER_DATA_KEY = "tomilo_lib_user";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

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
  const [updateChapter] = useUpdateChapterMutation();
  const [addToReadingHistory] = useAddToReadingHistoryMutation();
  const [removeFromReadingHistory] = useRemoveFromReadingHistoryMutation();

  const {
    data: readingHistoryData,
    isLoading: readingHistoryLoading,
    error: readingHistoryError,
  } = useGetReadingHistoryQuery(undefined, {
    skip: !getToken(),
  });

  const useGetReadingHistoryByTitle = (titleId: string) => {
    return useGetReadingHistoryByTitleQuery(titleId, {
      skip: !getToken() || !titleId,
    });
  };

  const continueReading = readingHistoryData?.data;

  useEffect(() => {
    dispatch(setLoading(profileLoading));
  }, [profileLoading, dispatch]);

  useEffect(() => {
    const currentToken = getToken();
    if (profileResponse && profileResponse.success && profileResponse.data && currentToken) {
      const user: StoredUser = profileResponse.data;
      const authResponse: AuthResponse = {
        access_token: currentToken,
        user: {
          _id: user._id,
          id: user.id || user._id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          role: user.role,
          level: user.level,
          experience: user.experience,
          balance: user.balance,
          bookmarks: user.bookmarks,
          readingHistory: user.readingHistory,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          birthDate: user.birthDate,
        },
      };
      dispatch(login(authResponse));

      // Check age and set verification if user is 18+
      if (user.birthDate) {
        checkAndSetAgeVerification(user.birthDate);
      }
    }
  }, [profileResponse, token, dispatch]);

  useEffect(() => {
    if (error && getToken()) {
      console.error("Auth check failed:", error);
      if ("status" in error && (error.status === 401 || error.status === 404)) {
        dispatch(logout());
      }
    }
  }, [error, token, dispatch]);

  const updateUserData = useCallback(
    (userData: Partial<StoredUser>) => {
      dispatch(updateUser(userData));
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
    },
    [dispatch],
  );

  // Обновление истории чтения в профиле пользователя
  useEffect(() => {
    if (readingHistoryData && readingHistoryData.success && readingHistoryData.data) {
      updateUserData({ readingHistory: readingHistoryData.data });
    }
  }, [readingHistoryData, updateUserData]);

  const updateAvatar = async (avatarFile: File): Promise<{ success: boolean; error?: string }> => {
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

      const result: ApiResponseDto<StoredUser> = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Ошибка при обновлении аватара");
      }

      updateUserData({
        avatar: result.data?.avatar,
        updatedAt: result.data?.updatedAt,
      });

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

      const result: ApiResponseDto<StoredUser> = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Ошибка при обновлении профиля");
      }

      updateUserData({
        username: result.data?.username,
        email: result.data?.email,
        updatedAt: result.data?.updatedAt,
      });

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

  const addBookmarkToUser = async (
    titleId: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await addBookmark(titleId).unwrap();

      if (!result.success) {
        throw new Error(result.message || "Ошибка при добавлении в закладки");
      }

      updateUserData({
        bookmarks: result.data?.bookmarks,
        updatedAt: result.data?.updatedAt,
      });

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

  const removeBookmarkFromUser = async (
    titleId: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await removeBookmark(titleId).unwrap();

      if (!result.success) {
        throw new Error(result.message || "Ошибка при удалении из закладок");
      }

      updateUserData({
        bookmarks: result.data?.bookmarks,
        updatedAt: result.data?.updatedAt,
      });

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

  const updateChapterViewsCount = useCallback(
    async (
      chapterId: string,
      currentViews: number,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await updateChapter({
          id: chapterId,
          data: { views: currentViews + 1 } as Partial<UpdateChapterDto>,
        }).unwrap();

        return { success: true };
      } catch (error) {
        console.error("Error updating chapter views:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Неизвестная ошибка",
        };
      }
    },
    [updateChapter],
  );

  const addToReadingHistoryFunc = useCallback(
    async (titleId: string, chapterId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await addToReadingHistory({
          titleId,
          chapterId,
        }).unwrap();

        if (!result.success) {
          const errorMessage = result.message || "Ошибка при добавлении в историю чтения";
          console.error("Error adding to reading history:", errorMessage);
          return { success: false, error: errorMessage };
        }

        refetchProfile();

        return { success: true };
      } catch (error) {
        console.error("Error adding to reading history:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Неизвестная ошибка",
        };
      }
    },
    [addToReadingHistory, refetchProfile],
  );

  const removeFromReadingHistoryFunc = async (
    titleId: string,
    chapterId: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await removeFromReadingHistory({
        titleId,
        chapterId,
      }).unwrap();

      if (!result.success) {
        throw new Error(result.message || "Ошибка при удалении из истории чтения");
      }

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

  const loginUser = (authResponse: ApiResponseDto<AuthResponse>) => {
    const token = authResponse.data?.access_token;
    const user = authResponse.data?.user;

    if (typeof window !== "undefined" && token && user) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

      // Check age and set verification if user is 18+
      if (user.birthDate) {
        checkAndSetAgeVerification(user.birthDate);
      }

      if (authResponse.data) {
        dispatch(login(authResponse.data));
      }
    }
  };

  const logoutUser = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      // Clear age verification on logout
      clearAgeVerification();
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
    continueReading,
    readingHistoryLoading,
    readingHistoryError,
    refetchProfile,
    isAuthenticated: auth.isAuthenticated,
    removeFromReadingHistory: removeFromReadingHistoryFunc,
    useGetReadingHistoryByTitle,
  };
};
