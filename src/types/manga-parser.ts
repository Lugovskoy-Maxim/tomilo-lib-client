export interface ParseTitleDto {
  url: string;
  chapterNumbers?: number[];
  customTitle?: string;
  customDescription?: string;
  customGenres?: string[];
}

export interface ParseChapterDto {
  url: string;
  titleId: string;
  chapterNumber: number;
  customName?: string;
}

export interface SupportedSitesResponse {
  sites: string[];
}

export interface ParseResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}
