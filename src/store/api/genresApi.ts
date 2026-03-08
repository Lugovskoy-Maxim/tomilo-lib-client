import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiResponse } from "@/types/api";

const AUTH_TOKEN_KEY = "tomilo_lib_token";

export interface Genre {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  titlesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGenreRequest {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateGenreRequest {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
}

export const genresApi = createApi({
  reducerPath: "genresApi",
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
  tagTypes: ["Genres"],
  endpoints: builder => ({
    getGenres: builder.query<
      ApiResponse<{
        genres: Genre[];
        pagination: { total: number; page: number; limit: number; pages: number };
      }>,
      { search?: string; page?: number; limit?: number }
    >({
      query: ({ search = "", page = 1, limit = 50 }) => ({
        url: `/genres/admin?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
      }),
      providesTags: ["Genres"],
    }),

    getGenreById: builder.query<ApiResponse<Genre>, string>({
      query: id => ({
        url: `/genres/admin/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Genres", id }],
    }),

    createGenre: builder.mutation<ApiResponse<Genre>, CreateGenreRequest>({
      query: data => ({
        url: "/genres/admin",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Genres"],
    }),

    updateGenre: builder.mutation<ApiResponse<Genre>, UpdateGenreRequest>({
      query: ({ id, ...data }) => ({
        url: `/genres/admin/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Genres", id }, "Genres"],
    }),

    deleteGenre: builder.mutation<ApiResponse<void>, string>({
      query: id => ({
        url: `/genres/admin/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Genres"],
    }),

    mergeGenres: builder.mutation<ApiResponse<Genre>, { sourceId: string; targetId: string }>({
      query: ({ sourceId, targetId }) => ({
        url: `/genres/admin/merge`,
        method: "POST",
        body: { sourceId, targetId },
      }),
      invalidatesTags: ["Genres"],
    }),
  }),
});

export const {
  useGetGenresQuery,
  useGetGenreByIdQuery,
  useCreateGenreMutation,
  useUpdateGenreMutation,
  useDeleteGenreMutation,
  useMergeGenresMutation,
} = genresApi;
