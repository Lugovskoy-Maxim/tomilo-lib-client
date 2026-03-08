import { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetProfileQuery,
  useAddBookmarkMutation,
  useUpdateBookmarkCategoryMutation,
  useRemoveBookmarkMutation,
  useGetReadingHistoryQuery,
  useGetReadingHistoryByTitleQuery,
  useAddToReadingHistoryMutation,
  useRemoveFromReadingHistoryMutation,
} from "@/store/api/authApi";
import { useIncrementChapterViewsMutation } from "@/store/api/chaptersApi";
import { login, logout, setLoading, updateUser } from "@/store/slices/authSlice";
import { RootState } from "@/store";
import { AuthResponse, StoredUser, ApiResponseDto } from "@/types/auth";
import { checkAndSetAgeVerification, clearAgeVerification } from "@/lib/age-verification";
import { ReadingProgressResponse } from "@/types/progress";

import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/store/api/authApi";

const USER_DATA_KEY = "tomilo_lib_user";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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

  const [addBookmarkMutation] = useAddBookmarkMutation();
  const [updateBookmarkCategoryMutation] = useUpdateBookmarkCategoryMutation();
  const [removeBookmarkMutation] = useRemoveBookmarkMutation();
  const [incrementChapterViews] = useIncrementChapterViewsMutation();
  const [addToReadingHistory] = useAddToReadingHistoryMutation();
  const [removeFromReadingHistory] = useRemoveFromReadingHistoryMutation();

  const {
    data: readingHistoryData,
    isLoading: readingHistoryLoading,
    error: readingHistoryError,
  } = useGetReadingHistoryQuery(
    { limit: 200, light: false },
    {
      skip: !getToken(),
    },
  );

  const useGetReadingHistoryByTitle = (titleId: string) => {
    return useGetReadingHistoryByTitleQuery(titleId, {
      skip: !getToken() || !titleId,
    });
  };

  const continueReading = readingHistoryData?.data;

  // Синхронизируем loading только при изменении — иначе множество карточек (каждая с useAuth)
  // вызывают dispatch при каждом рендере и приводят к "Maximum update depth exceeded"
  useEffect(() => {
    if (auth.isLoading !== profileLoading) {
      dispatch(setLoading(profileLoading));
    }
  }, [profileLoading, dispatch, auth.isLoading]);

  const lastAppliedProfileRef = useRef<typeof profileResponse | null>(null);
  useEffect(() => {
    const currentToken = getToken();
    if (!profileResponse?.success || !profileResponse?.data || !currentToken) return;

    const user = profileResponse.data as StoredUser & {
      equipped_decorations?: StoredUser["equippedDecorations"];
    };
    const userId = user?.id ?? user?._id;
    if (lastAppliedProfileRef.current === profileResponse) return;
    lastAppliedProfileRef.current = profileResponse;

    const profileUser = {
      _id: user._id,
      id: user.id || user._id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      level: user.level,
      experience: user.experience,
      balance: user.balance,
      subscriptionExpiresAt:
        (user as { subscriptionExpiresAt?: string | null; subscription_expires_at?: string | null })
          .subscriptionExpiresAt ??
        (user as { subscription_expires_at?: string | null }).subscription_expires_at ??
        null,
      bookmarks: user.bookmarks,
      readingHistory: user.readingHistory,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      birthDate: user.birthDate,
      displaySettings: user.displaySettings,
      privacy: user.privacy,
      equippedDecorations: user.equippedDecorations ?? user.equipped_decorations,
    };

    // Если в сторе уже этот пользователь — только обновляем поля из профиля (level, balance и т.д.),
    // чтобы не вызывать login() многократно (Maximum update depth exceeded).
    if (userId && auth.user && (auth.user.id === userId || auth.user._id === userId)) {
      dispatch(updateUser(profileUser));
      if (user.birthDate) checkAndSetAgeVerification(user.birthDate);
      return;
    }

    dispatch(login({ access_token: currentToken, user: profileUser }));

    if (user.birthDate) {
      checkAndSetAgeVerification(user.birthDate);
    }
    // auth.user синхронизируется из profileResponse, явно не добавляем чтобы избежать лишних синхронизаций
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileResponse, token, dispatch]);

  useEffect(() => {
    if (error && getToken()) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? (error as { status?: number }).status
          : undefined;
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        (error as { message?: string })?.message ??
        String(error);
      if (status === 401 || status === 404) {
        dispatch(logout());
      } else if (message && message !== "[object Object]") {
        console.error("Auth check failed:", message);
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

  // Обновление истории чтения в профиле пользователя (только при реальном изменении, чтобы избежать цикла #185)
  const prevReadingHistoryRef = useRef<StoredUser["readingHistory"] | undefined>(undefined);
  useEffect(() => {
    if (!readingHistoryData?.success || !readingHistoryData?.data) return;
    const next = readingHistoryData.data;
    if (prevReadingHistoryRef.current === next) return;
    // Не диспатчить, если в сторе уже те же данные — иначе несколько useAuth вызывают updateUserData и цикл
    if (auth.user?.readingHistory === next) return;
    prevReadingHistoryRef.current = next;
    updateUserData({ readingHistory: next });
  }, [readingHistoryData, updateUserData, auth.user?.readingHistory]);

  const updateAvatar = async (avatarFile: File): Promise<{ success: boolean; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await fetch(`${API_BASE_URL}/users/profile/avatar`, {
        method: "PUT",
        credentials: "include",
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

      if (token) {
        refetchProfile();
      }

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
        credentials: "include",
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

      if (token) {
        refetchProfile();
      }

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
    category: import("@/types/user").BookmarkCategory = "reading",
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await addBookmarkMutation({ titleId, category }).unwrap();

      if (!result.success) {
        const msg =
          (result as { errors?: string[] }).errors?.[0] ||
          (result as { message?: string }).message ||
          "Ошибка при добавлении в закладки";
        throw new Error(msg);
      }

      updateUserData({
        bookmarks: result.data?.bookmarks,
        updatedAt: result.data?.updatedAt,
      });

      // Do not refetch profile: GET /users/profile may return empty bookmarks
      // while POST bookmark returns full user; we already have correct data above.

      return { success: true };
    } catch (error: unknown) {
      console.error("Error adding bookmark:", error);
      const message =
        (error as { data?: { errors?: string[]; message?: string } })?.data?.errors?.[0] ||
        (error as { data?: { message?: string } })?.data?.message ||
        (error instanceof Error ? error.message : "Неизвестная ошибка");
      return { success: false, error: message };
    }
  };

  const updateBookmarkCategoryToUser = async (
    titleId: string,
    category: import("@/types/user").BookmarkCategory,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await updateBookmarkCategoryMutation({ titleId, category }).unwrap();
      if (!result.success) {
        const msg =
          (result as { errors?: string[] }).errors?.[0] ||
          (result as { message?: string }).message ||
          "Не удалось изменить категорию";
        throw new Error(msg);
      }
      updateUserData({
        bookmarks: result.data?.bookmarks,
        updatedAt: result.data?.updatedAt,
      });
      // Do not refetch profile (GET may return empty bookmarks).
      return { success: true };
    } catch (error: unknown) {
      console.error("Error updating bookmark category:", error);
      const message =
        (error as { data?: { errors?: string[]; message?: string } })?.data?.errors?.[0] ||
        (error as { data?: { message?: string } })?.data?.message ||
        (error instanceof Error ? error.message : "Неизвестная ошибка");
      return { success: false, error: message };
    }
  };

  const removeBookmarkFromUser = async (
    titleId: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await removeBookmarkMutation(titleId).unwrap();

      if (!result.success) {
        const msg =
          (result as { errors?: string[] }).errors?.[0] ||
          (result as { message?: string }).message ||
          "Ошибка при удалении из закладок";
        throw new Error(msg);
      }

      updateUserData({
        bookmarks: result.data?.bookmarks,
        updatedAt: result.data?.updatedAt,
      });

      // Do not refetch profile (GET may return empty bookmarks).
      return { success: true };
    } catch (error: unknown) {
      console.error("Error removing bookmark:", error);
      const message =
        (error as { data?: { errors?: string[]; message?: string } })?.data?.errors?.[0] ||
        (error as { data?: { message?: string } })?.data?.message ||
        (error instanceof Error ? error.message : "Неизвестная ошибка");
      return { success: false, error: message };
    }
  };

  const updateChapterViewsCount = useCallback(
    async (_chapterId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        await incrementChapterViews(_chapterId).unwrap();
        return { success: true };
      } catch (error) {
        console.error("Error incrementing chapter views:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Неизвестная ошибка",
        };
      }
    },
    [incrementChapterViews],
  );

  const addToReadingHistoryFunc = useCallback(
    async (
      titleId: string,
      chapterId: string,
    ): Promise<{
      success: boolean;
      error?: string;
      progress?: ReadingProgressResponse;
    }> => {
      const stringifyUnknown = (value: unknown): string | null => {
        if (typeof value === "string") return value;
        if (typeof value === "number" || typeof value === "boolean") return String(value);
        if (value && typeof value === "object") {
          try {
            const json = JSON.stringify(value);
            if (json && json !== "{}") return json;
          } catch {
            // no-op: fall through to null
          }
        }
        return null;
      };

      const isVersionConflict = (msg: string): boolean =>
        msg === "READING_HISTORY_VERSION_CONFLICT" ||
        /no matching document|version \d+|modifiedPaths/i.test(msg);

      const tryAdd = async (): Promise<{
        success: boolean;
        error?: string;
        progress?: ReadingProgressResponse;
      }> => {
        const result = await addToReadingHistory({
          titleId,
          chapterId,
        }).unwrap();

        if (!result.success) {
          const raw =
            (result as { errors?: string[] }).errors?.[0] ||
            (result as { message?: string }).message ||
            "Ошибка при добавлении в историю чтения";
          const errorMessage = isVersionConflict(String(raw))
            ? "READING_HISTORY_VERSION_CONFLICT"
            : raw;
          return { success: false, error: errorMessage };
        }

        if (token) {
          try {
            await refetchProfile();
          } catch {
            // Profile query may be skipped on this page (RTK: "has not been started") — add succeeded
          }
        }
        return { success: true, progress: result.data };
      };

      const getErrorMessage = (err: unknown): string => {
        const e = err as {
          message?: unknown;
          data?: { errors?: unknown[]; message?: unknown };
          error?: unknown;
          status?: unknown;
        };
        const apiMessage =
          stringifyUnknown(e?.data?.errors?.[0]) ?? stringifyUnknown(e?.data?.message);
        const nativeMessage = stringifyUnknown(e?.message);
        const fallback =
          stringifyUnknown(e?.error) ?? stringifyUnknown(e?.status) ?? stringifyUnknown(err);
        return (
          apiMessage ??
          nativeMessage ??
          (err instanceof Error ? stringifyUnknown(err.message) : null) ??
          fallback ??
          "Неизвестная ошибка"
        );
      };

      const isAlreadyInHistory = (msg: string): boolean =>
        /already|already exists|duplicate|уже|дубликат/i.test(msg);
      const isRefetchNotStarted = (msg: string): boolean =>
        /cannot refetch.*has not been started/i.test(msg);

      const doRetry = async () => {
        if (token) {
          try {
            await refetchProfile();
          } catch {
            // Запрос профиля может быть не запущен на этой странице (RTK: "has not been started") — всё равно повторяем add
          }
        }
        return tryAdd();
      };

      try {
        const result = await tryAdd();
        if (result.success) return result;
        // Повторная попытка при версионном конфликте без лога в консоль
        if (isVersionConflict(result.error ?? "")) {
          try {
            const retryResult = await doRetry();
            if (!retryResult.success) {
              if (!isRefetchNotStarted(retryResult.error ?? "")) {
                console.error("Error adding to reading history (retry):", retryResult.error);
              }
              return {
                success: false,
                error: "Данные устарели. Обновите страницу и попробуйте снова.",
              };
            }
            return retryResult;
          } catch (retryError: unknown) {
            const retryMessage = getErrorMessage(retryError);
            if (!isRefetchNotStarted(retryMessage)) {
              console.error("Error adding to reading history (retry):", retryMessage);
            }
            return {
              success: false,
              error: "Данные устарели. Обновите страницу и попробуйте снова.",
            };
          }
        }
        console.error("Error adding to reading history:", result.error);
        return result;
      } catch (error: unknown) {
        const message = getErrorMessage(error);
        if (isAlreadyInHistory(message)) return { success: true };
        // Refetch failed (e.g. profile query was skipped) but add may have succeeded — don't log
        if (isRefetchNotStarted(message)) return { success: true };
        if (isVersionConflict(message)) {
          try {
            const retryResult = await doRetry();
            if (!retryResult.success) {
              if (!isRefetchNotStarted(retryResult.error ?? "")) {
                console.error("Error adding to reading history (retry):", retryResult.error);
              }
              return {
                success: false,
                error: "Данные устарели. Обновите страницу и попробуйте снова.",
              };
            }
            return retryResult;
          } catch (retryError: unknown) {
            const retryMessage = getErrorMessage(retryError);
            if (!isRefetchNotStarted(retryMessage)) {
              console.error("Error adding to reading history (retry):", retryMessage);
            }
            return {
              success: false,
              error: "Данные устарели. Обновите страницу и попробуйте снова.",
            };
          }
        }
        console.error("Error adding to reading history:", message);
        return { success: false, error: message };
      }
    },
    // token не добавляем — используется внутри RTK/API, стабильность через addToReadingHistory
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (token) {
        refetchProfile();
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Неизвестная ошибка";
      console.error("Error removing from reading history:", message);
      return { success: false, error: message };
    }
  };

  const loginUser = (authResponse: ApiResponseDto<AuthResponse> | AuthResponse) => {
    // Поддержка обоих форматов: { data: { access_token, user } } и { access_token, user }
    const data =
      authResponse &&
      "data" in authResponse &&
      authResponse.data != null &&
      typeof authResponse.data === "object"
        ? authResponse.data
        : (authResponse as AuthResponse);
    const token = data?.access_token;
    const refreshToken = data?.refresh_token;
    const user = data?.user;

    if (typeof window !== "undefined" && token && user) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

      // Check age and set verification if user is 18+
      if (user.birthDate) {
        checkAndSetAgeVerification(user.birthDate);
      }

      dispatch(login({ access_token: token, user }));
    }
  };

  const logoutUser = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
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
    updateBookmarkCategory: updateBookmarkCategoryToUser,
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
