export interface ParseTitleDto {
  url: string;
  chapterNumbers?: string[];
  customTitle?: string;
  customDescription?: string;
  customGenres?: string[];
}

export interface ParseChaptersDto {
  url: string;
  titleId: string;
  chapterNumbers: string[];
  customName?: string;
}

export interface ParseChaptersInfoDto {
  url: string;
}

export interface ParseChaptersInfoResponse {
  chapters: Array<{
    number: string;
    name: string;
    url: string;
  }>;
}

export interface SupportedSitesResponse {
  sites: string[];
}

export interface ParseResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}
