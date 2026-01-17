import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { AuthResponse, LoginData, RegisterData, User } from "@/types/auth";

// Ключи для localStorage (сохраняем ваши существующие)
const AUTH_TOKEN_KEY = "tomilo_lib_token";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
    prepareHeaders: headers => {
      // Используем ваши существующие ключи localStorage
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ["Auth"],
  endpoints: builder => ({
    login: builder.mutation<AuthResponse, LoginData>({
      query: credentials => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),
    register: builder.mutation<AuthResponse, RegisterData>({
      query: userData => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Auth"],
    }),
    getMe: builder.query<User, void>({
      query: () => "/profile",
      providesTags: ["Auth"],
    }),
    changePassword: builder.mutation<{ success: boolean; message: string }, { currentPassword: string; newPassword: string }>({
      query: (passwords) => ({
        url: "/auth/change-password",
        method: "POST",
        body: passwords,
      }),
      invalidatesTags: ["Auth"],
    }),
    forgotPassword: builder.mutation<{ success: boolean; message: string }, { email: string }>({
      query: (emailDto) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: emailDto,
      }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useGetMeQuery, useChangePasswordMutation, useForgotPasswordMutation } = authApi;
