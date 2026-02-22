/** Типы блоков контента для гибкой вёрстки */
export type ContentBlockType =
  | "title"
  | "paragraph"
  | "image"
  | "list"
  | "quote"
  | "code"
  | "divider"
  | "embed";

export interface ContentBlock {
  type: ContentBlockType;
  data: Record<string, unknown> & { src?: string; items?: string[]; html?: string };
  style?: Record<string, string>;
}

/** Варианты раскладки на фронте */
export type AnnouncementLayout = "default" | "wide" | "compact" | "minimal";

export interface Announcement {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  body?: string;
  contentBlocks?: ContentBlock[];
  coverImage?: string;
  images?: string[];
  layout?: AnnouncementLayout;
  style?: Record<string, string>;
  isPublished: boolean;
  publishedAt?: string;
  isPinned?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateAnnouncementDto = Omit<
  Announcement,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
};

export type UpdateAnnouncementDto = Partial<CreateAnnouncementDto>;

/** Публичный список: пагинация, фильтр по tag, isPinned */
export interface AnnouncementsQuery {
  page?: number;
  limit?: number;
  tag?: string;
  isPinned?: boolean;
}

export interface AnnouncementsResponse {
  announcements: Announcement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore?: boolean;
}

/** Админ-список: все, включая черновики при includeDraft=true */
export interface AdminAnnouncementsQuery extends AnnouncementsQuery {
  includeDraft?: boolean;
}

/** Ответ загрузки изображения */
export interface UploadImageResponse {
  url: string;
}
