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

export type ChapterAllowedReactionEmoji = (typeof CHAPTER_ALLOWED_REACTION_EMOJIS)[number];

/** Минимальная и максимальная оценка главы (шкала 1–10) */
export const CHAPTER_RATING_MIN = 1;
export const CHAPTER_RATING_MAX = 10;

/** Одна запись рейтинга главы (один пользователь — одна оценка 1–10) */
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
  /** Рейтинг и реакции из основной информации о главе (по спецификации API) */
  averageRating?: number;
  ratingSum?: number;
  ratingCount?: number;
  userRating?: number | null;
  reactions?: ChapterReactionCount[];
}

/** Тело запроса POST /chapters/:id/rating — поставить/изменить оценку 1–10 */
export interface SetChapterRatingDto {
  value: number;
}

/** Ответ GET /chapters/:id/rating (шкала 1–10) */
export interface ChapterRatingResponse {
  /** Средний рейтинг (или ratingSum/ratingCount на бэкенде) */
  averageRating?: number;
  ratingSum?: number;
  ratingCount?: number;
  /** Оценка текущего пользователя (при переданном JWT), 1–10 */
  userRating?: number | null;
}

/** Тело запроса POST /chapters/:id/reactions — переключить реакцию */
export interface ToggleChapterReactionDto {
  emoji: string;
}

/** Ответ GET /chapters/:id/reactions/count (при JWT в ответе добавляется userReaction) */
export interface ChapterReactionsCountResponse {
  reactions: ChapterReactionCount[];
  /** Эмодзи реакции текущего пользователя, если есть */
  userReaction?: string | null;
}
