import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AuthResponse, LoginData, RegisterData, User, ApiResponseDto } from '@/types/auth';

// Ключи для localStorage (сохраняем ваши существующие)
const AUTH_TOKEN_KEY = "tomilo_lib_token";
const USER_DATA_KEY = "tomilo_lib_user";


export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    prepareHeaders: (headers) => {
      // Используем ваши существующие ключи localStorage
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginData>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation<AuthResponse, RegisterData>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Auth'],
    }),
    getProfile: builder.query<ApiResponseDto<User>, void>({
      query: () => '/users/profile',
      providesTags: ['Auth'],
      transformResponse: (response: ApiResponseDto<User>) => response,
    }),
    addBookmark: builder.mutation<ApiResponseDto<User>, string>({
      query: (titleId) => ({
        url: `/users/bookmarks/${titleId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
    removeBookmark: builder.mutation<ApiResponseDto<User>, string>({
      query: (titleId) => ({
        url: `/users/bookmarks/${titleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Auth'],
    }),
   getContinueReading: builder.query<ApiResponseDto<{ titleId: string; chapterId: string; chapterNumber: number }>, void>({
     query: () => '/users/continue-reading',
     providesTags: ['Auth'],
   }),
 }),
});
export const {
 useLoginMutation,
 useRegisterMutation,
 useGetProfileQuery,
 useAddBookmarkMutation,
 useRemoveBookmarkMutation,
 useGetContinueReadingQuery,
} = authApi;