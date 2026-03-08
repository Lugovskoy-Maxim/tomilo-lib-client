export interface ParseTitleDto {
  url: string;
  chapterNumbers?: string[];
  customTitle?: string;
  customDescription?: string;
  customGenres?: string[];
  customType?: string;
}

export interface ParseChaptersDto {
  url: string;
  titleId: string;
  chapterNumbers?: string[];
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

/** Тело запроса повторной синхронизации страниц глав из источника */
export interface SyncChaptersDto {
  titleId: string;
  sourceUrl: string;
  chapterNumbers?: number[];
}

/** Результат синхронизации глав: какие обновлены, пропущены, ошибки */
export interface SyncChaptersResponse {
  synced: number[];
  skipped: number[];
  errors: Array<{ chapterNumber?: number; message: string }>;
}
