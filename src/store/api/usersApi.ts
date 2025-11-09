import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponse } from "@/types/api";
import { UserProfile } from "@/types/user";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    getUsers: builder.query<
      ApiResponse<{ data: UserProfile[]; total: number; page: number; limit: number }>,
      { search?: string; page?: number; limit?: number }
    >({
      query: ({ search = "", page = 1, limit = 20 }) => ({
        url: `/users/admin/?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
      }),
      providesTags: ["Users"],
    }),
    deleteUser: builder.mutation<ApiResponse<void>, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const { useGetUsersQuery, useDeleteUserMutation } = usersApi;
