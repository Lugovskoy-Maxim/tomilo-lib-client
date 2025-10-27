import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AuthResponse, LoginData, RegisterData, User } from '@/types/auth';

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
    getProfile: builder.query<User, void>({
      query: () => '/users/profile',
      providesTags: ['Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery, 
} = authApi;