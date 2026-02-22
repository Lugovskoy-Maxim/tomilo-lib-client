import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import { ApiResponseDto } from "@/types/api";
import type {
  Announcement,
  AnnouncementsQuery,
  AnnouncementsResponse,
  AdminAnnouncementsQuery,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  UploadImageResponse,
} from "@/types/announcement";

const ANNOUNCEMENTS_TAG = "Announcements";

export const announcementsApi = createApi({
  reducerPath: "announcementsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [ANNOUNCEMENTS_TAG],
  endpoints: builder => ({
    // ——— Публичные (без авторизации) ———
    getAnnouncements: builder.query<
      ApiResponseDto<AnnouncementsResponse>,
      AnnouncementsQuery | void
    >({
      query: (params = {}) => ({
        url: "/announcements",
        params: { page: params?.page, limit: params?.limit, tag: params?.tag, isPinned: params?.isPinned },
      }),
      providesTags: [ANNOUNCEMENTS_TAG],
      transformResponse: (response: ApiResponseDto<unknown>) => {
        const data = response?.data as { announcements?: unknown[]; total?: number; page?: number; limit?: number; totalPages?: number } | undefined;
        const raw = data?.announcements ?? (Array.isArray(data) ? data : []);
        const announcements = raw.map((a: Record<string, unknown>) => ({
          ...a,
          id: (a.id as string) ?? (a._id as string) ?? "",
        })) as Announcement[];
        const total = data?.total ?? (Array.isArray(data) ? data.length : 0);
        const page = data?.page ?? 1;
        const limit = data?.limit ?? 10;
        const totalPages = data?.totalPages ?? Math.ceil(total / limit) || 1;
        return {
          ...response,
          data: { announcements, total, page, limit, totalPages },
        } as ApiResponseDto<AnnouncementsResponse>;
      },
    }),

    getAnnouncementBySlug: builder.query<ApiResponseDto<Announcement>, string>({
      query: slug => `/announcements/by-slug/${encodeURIComponent(slug)}`,
      providesTags: (_, __, slug) => [{ type: ANNOUNCEMENTS_TAG, id: slug }],
    }),

    getAnnouncementById: builder.query<ApiResponseDto<Announcement>, string>({
      query: id => `/announcements/${id}`,
      providesTags: (_, __, id) => [{ type: ANNOUNCEMENTS_TAG, id }],
    }),

    // ——— Админ ———
    getAdminAnnouncements: builder.query<
      ApiResponseDto<AnnouncementsResponse>,
      AdminAnnouncementsQuery | void
    >({
      query: (params = {}) => ({
        url: "/announcements/admin",
        params: {
          page: params?.page,
          limit: params?.limit,
          tag: params?.tag,
          isPinned: params?.isPinned,
          includeDraft: params?.includeDraft,
        },
      }),
      providesTags: [ANNOUNCEMENTS_TAG],
      transformResponse: (response: ApiResponseDto<unknown>) => {
        const data = response?.data as { announcements?: unknown[]; total?: number; page?: number; limit?: number; totalPages?: number } | undefined;
        const raw = data?.announcements ?? (Array.isArray(data) ? data : []);
        const announcements = raw.map((a: Record<string, unknown>) => ({
          ...a,
          id: (a.id as string) ?? (a._id as string) ?? "",
        })) as Announcement[];
        const total = data?.total ?? (Array.isArray(data) ? data.length : 0);
        const page = data?.page ?? 1;
        const limit = data?.limit ?? 10;
        const totalPages = data?.totalPages ?? Math.ceil(total / limit) || 1;
        return {
          ...response,
          data: { announcements, total, page, limit, totalPages },
        } as ApiResponseDto<AnnouncementsResponse>;
      },
    }),

    getAdminAnnouncementById: builder.query<ApiResponseDto<Announcement>, string>({
      query: id => `/announcements/admin/${id}`,
      providesTags: (_, __, id) => [{ type: ANNOUNCEMENTS_TAG, id }],
    }),

    createAnnouncement: builder.mutation<ApiResponseDto<Announcement>, CreateAnnouncementDto>({
      query: body => ({
        url: "/announcements/admin",
        method: "POST",
        body,
      }),
      invalidatesTags: [ANNOUNCEMENTS_TAG],
    }),

    updateAnnouncement: builder.mutation<
      ApiResponseDto<Announcement>,
      { id: string; data: UpdateAnnouncementDto }
    >({
      query: ({ id, data }) => ({
        url: `/announcements/admin/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: ANNOUNCEMENTS_TAG, id }, ANNOUNCEMENTS_TAG],
    }),

    deleteAnnouncement: builder.mutation<void, string>({
      query: id => ({
        url: `/announcements/admin/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [ANNOUNCEMENTS_TAG],
    }),

    uploadAnnouncementImage: builder.mutation<
      ApiResponseDto<UploadImageResponse>,
      { file: File; announcementId?: string }
    >({
      query: ({ file, announcementId }) => {
        const formData = new FormData();
        formData.append("file", file);
        const url = announcementId
          ? `/announcements/admin/upload-image?announcementId=${encodeURIComponent(announcementId)}`
          : "/announcements/admin/upload-image";
        return {
          url,
          method: "POST",
          body: formData,
        };
      },
    }),
  }),
});

export const {
  useGetAnnouncementsQuery,
  useGetAnnouncementBySlugQuery,
  useGetAnnouncementByIdQuery,
  useGetAdminAnnouncementsQuery,
  useGetAdminAnnouncementByIdQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useUploadAnnouncementImageMutation,
} = announcementsApi;
