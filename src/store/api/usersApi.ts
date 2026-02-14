import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponse } from "@/types/api";
import { UserProfile } from "@/types/user";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: "include",
    prepareHeaders: headers => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ["Users"],
  endpoints: builder => ({
    getUsers: builder.query<
      ApiResponse<{
        users: UserProfile[];
        pagination: { total: number; page: number; limit: number; pages: number };
      }>,
      { search?: string; page?: number; limit?: number }
    >({
      query: ({ search = "", page = 1, limit = 50 }) => ({
        url: `/users/admin/?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
      }),
      providesTags: ["Users"],
    }),
    getUserById: builder.query<ApiResponse<UserProfile>, string>({
      query: userId => ({
        url: `/users/admin/${userId}`,
      }),
      providesTags: (result, error, id) => [{ type: "Users", id }],
    }),
    deleteUser: builder.mutation<ApiResponse<void>, string>({
      query: userId => ({
        url: `/users/admin/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const { useGetUsersQuery, useDeleteUserMutation, useGetUserByIdQuery } = usersApi;
