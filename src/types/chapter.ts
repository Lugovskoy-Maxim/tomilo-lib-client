/** Разрешённые эмодзи для реакций глав (как у комментариев) */
export const CHAPTER_ALLOWED_REACTION_EMOJIS = [
  "👍",
  "👎",
  "❤️",
  "🔥",
  "😂",
  "😮",
  "😢",
  "🎉",
  "👏",
] as const;

export type ChapterAllowedReactionEmoji =
  (typeof CHAPTER_ALLOWED_REACTION_EMOJIS)[number];

/** Одна запись рейтинга главы (один пользователь — одна оценка 1–5) */
export interface ChapterRatingByUser {
  userId: string;
  value: number;
}

/** Одна реакция в ответе API: эмодзи и количество поставивших */
export interface ChapterReactionCount {
  emoji: string;
  count: number;
}

export interface Chapter {
  _id: string;
  chapterNumber: number | string;
  name?: string;
  releaseDate?: string;
  views: number | string;
  pages: string[];
  isPublished?: boolean;
  translator?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  /** Рейтинг: сумма оценок (бэкенд) */
  ratingSum?: number;
  /** Рейтинг: количество голосов (бэкенд) */
  ratingCount?: number;
  /** Рейтинг: массив оценок по пользователям (один пользователь — одна оценка 1–5) */
  ratingByUser?: ChapterRatingByUser[];
  /** Реакции: массив { emoji, userIds } на бэкенде; в ответах count — { emoji, count }[] */
  reactions?: ChapterReactionCount[];
}

export interface ReaderChapter {
  _id: string;
  number: number;
  title: string;
  date?: string;
  views: number;
  images: string[];
  createdAt?: string;
  updatedAt?: string;
  teamId?: string;
}

/** Тело запроса POST /chapters/:id/rating — поставить/изменить оценку 1–5 */
export interface SetChapterRatingDto {
  value: number;
}

/** Ответ GET /chapters/:id/rating */
export interface ChapterRatingResponse {
  /** Средний рейтинг (или ratingSum/ratingCount на бэкенде) */
  averageRating?: number;
  ratingSum?: number;
  ratingCount?: number;
  /** Оценка текущего пользователя (при переданном JWT) */
  userRating?: number | null;
}

/** Тело запроса POST /chapters/:id/reactions — переключить реакцию */
export interface ToggleChapterReactionDto {
  emoji: string;
}

/** Ответ GET /chapters/:id/reactions/count */
export interface ChapterReactionsCountResponse {
  reactions: ChapterReactionCount[];
}
