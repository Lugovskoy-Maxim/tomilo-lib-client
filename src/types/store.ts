// Types for store-specific interfaces

// Типы для истории чтения
export interface ReadingHistoryChapter {
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string | null;
  readAt: string;
}

export interface ReadingHistoryEntry {
  titleId:
    | string
    | {
        _id: string;
        name: string;
        coverImage?: string;
        type?: string;
        chapters?: { chapterNumber: number }[];
      };
  chapters: ReadingHistoryChapter[];
  readAt: string;
}

// Тип для закладок
export interface BookmarkItem {
  _id: string;
  coverImage?: string;
  type?: string;
  releaseYear?: number;
}

// Тип для ответа при обновлении аватара
export interface AvatarResponse {
  message: string;
}
