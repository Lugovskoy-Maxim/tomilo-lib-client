import { createApi } from "@reduxjs/toolkit/query/react";
import { ApiResponse } from "@/types/api";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export interface SiteSettings {
  _id: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  registrationEnabled: boolean;
  commentsEnabled: boolean;
  ratingsEnabled: boolean;
  adultContentEnabled: boolean;
  maxUploadSize: number;
  defaultUserRole: string;
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  socialLinks: {
    telegram?: string;
    discord?: string;
    vk?: string;
  };
  seoSettings: {
    defaultTitle?: string;
    defaultDescription?: string;
    defaultKeywords?: string;
  };
  updatedAt: string;
  updatedBy?: string;
}

export interface UpdateSiteSettingsRequest {
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  registrationEnabled?: boolean;
  commentsEnabled?: boolean;
  ratingsEnabled?: boolean;
  adultContentEnabled?: boolean;
  maxUploadSize?: number;
  siteName?: string;
  siteDescription?: string;
  contactEmail?: string;
  socialLinks?: {
    telegram?: string;
    discord?: string;
    vk?: string;
  };
  seoSettings?: {
    defaultTitle?: string;
    defaultDescription?: string;
    defaultKeywords?: string;
  };
}

export const siteSettingsApi = createApi({
  reducerPath: "siteSettingsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["SiteSettings"],
  endpoints: builder => ({
    getSiteSettings: builder.query<ApiResponse<SiteSettings>, void>({
      query: () => ({
        url: "/admin/settings",
      }),
      providesTags: ["SiteSettings"],
    }),

    updateSiteSettings: builder.mutation<ApiResponse<SiteSettings>, UpdateSiteSettingsRequest>({
      query: data => ({
        url: "/admin/settings",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["SiteSettings"],
    }),

    clearCache: builder.mutation<ApiResponse<{ cleared: string[] }>, { cacheType?: string }>({
      query: data => ({
        url: "/admin/cache/clear",
        method: "POST",
        body: data,
      }),
    }),

    getSystemHealth: builder.query<
      ApiResponse<{
        status: "healthy" | "degraded" | "down";
        uptime: number;
        memoryUsage: number;
        cpuUsage: number;
        dbStatus: "connected" | "disconnected";
        cacheStatus: "connected" | "disconnected";
      }>,
      void
    >({
      query: () => ({
        url: "/admin/health",
      }),
    }),
  }),
});

export const {
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
  useClearCacheMutation,
  useGetSystemHealthQuery,
} = siteSettingsApi;
