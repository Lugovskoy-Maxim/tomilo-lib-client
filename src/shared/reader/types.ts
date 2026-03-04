// Типы для ридера

import type { ChapterReactionCount } from "@/types/chapter";

export interface ReaderTitle {
  _id: string;
  title: string;
  originalTitle: string;
  image: string;
  description: string;
  slug?: string;
  type: string;
  year: number;
  rating: number;
  genres: string[];
  status: string;
  author: string;
  artist: string;
  totalChapters: number;
  views: number;
  lastUpdate: string;
  chapters: ReaderChapter[];
  alternativeTitles: string[];
}

/** Рейтинг главы из API (шкала 1–10), опционально в ответе главы */
export interface ReaderChapterRating {
  averageRating?: number;
  ratingSum?: number;
  ratingCount?: number;
  userRating?: number | null;
}

export interface ReaderChapter {
  _id: string;
  number: number;
  title: string;
  images: string[];
  createdAt?: string;
  updatedAt?: string;
  date?: string;
  views: number;
  teamId?: string;
  /** Рейтинг и реакции из основной информации о главе (по спецификации API) */
  averageRating?: number;
  ratingSum?: number;
  ratingCount?: number;
  userRating?: number | null;
  reactions?: ChapterReactionCount[];
}
