// Тип данных, который возвращает сервер для популярных тайтлов
export interface PopularTitle {
  id: string;
  title: string;
  cover?: string;
  description?: string;
  rating?: number;
  type?: string;
  releaseYear?: number;
}

export interface Collection {
  id: string;
  name: string;
  image: string;
  link: string;
}

export interface ReadingProgress {
  titleId: string | { _id: string; id?: string; name?: string; coverImage?: string; totalChapters?: number; type?: string; chapters?: { chapterNumber: number; readAt: string }[] };
  chapterId: string | { _id: string; id?: string };
  chapterNumber: number;
  lastReadDate?: string;
}

export interface LatestUpdate {
  id: string;
  title: string;
  cover: string;
  chapter: string;
  chapterNumber: number;
  timeAgo: string;
  releaseYear?: number;
  type?: string;
  newChapters?: number;
}

// Типы для пропсов компонентов карточек
export interface CarouselCardData {
  id: string;
  title: string;
  type: string;
  year: number;
  rating: number;
  image?: string;
  genres: string[];
}

export interface CollectionCardData {
  id: string;
  name: string;
  image: string;
  link: string;
}

export interface ReadingCardData {
  id: string;
  title: string;
  cover: string;
  currentChapter: number;
  totalChapters: number;
  newChaptersSinceLastRead: number;
  type: string;
  readingHistory?: {
    titleId: string;
    chapterId: string;
    chapterNumber: number;
    lastReadDate?: string;
  };
}

export interface LatestUpdateCardData {
  id: string;
  title: string;
  cover: string;
  chapter: string;
  chapterNumber: number;
  timeAgo: string;
  releaseYear?: number;
  type?: string;
  newChapters?: number;
  isAdult?: boolean;
}

export interface TopTitle extends TitleCard {
  isAdult?: boolean;
}

// Make cover optional to match the data structure
export interface TopTitleCardData extends Omit<TitleCard, 'cover'> {
  cover?: string;
  isAdult?: boolean;
}

export interface TopTitleData {
  data: (TopTitleCardData & { image: string })[];
  loading: boolean;
  error: unknown;
}

export interface RankedTopTitle {
  id: string;
  title: string;
  type: string;
  year: number;
  rating: number;
  image: string;
  genres: string[];
  rank: number;
  views?: number;
  period: string;
  isAdult: boolean;
  ratingCount?: number;
}

import { ComponentType } from "react";

// Типы для компонентов
export type CarouselCardComponent = ComponentType<{ data: CarouselCardData }>;
export type CollectionCardComponent = ComponentType<{ data: CollectionCardData }>;
export type ReadingCardComponent = ComponentType<{ data: ReadingCardData }>;
export type LatestUpdateCardComponent = ComponentType<{ data: LatestUpdateCardData }>;

// Пропсы для карусели
export interface CarouselProps<T> {
  title: string;
  data: T[];
  cardComponent: ComponentType<{ data: T }>;
  type: "browse" | "collection";
  href?: string;
  description?: string;
  icon?: React.ReactNode;
  navigationIcon?: React.ReactNode;
  cardWidth?: string;
  showNavigation?: boolean;
  descriptionLink?: {
    text: string;
    href: string;
  };
}

export interface TitleCard {
  id: string;
  title: string;
  cover: string;
  description?: string;
  type?: string;
  year?: number;
  rating?: number;
  genres?: string[];
}

export interface CollectionCard {
  id: string;
  name: string;
  image: string;
  link: string;
}

export interface ReadingCard {
  id: string;
  title: string;
  cover: string;
  currentChapter: number;
  totalChapters: number;
  newChaptersSinceLastRead: number;
  type: string;
}

export interface LatestUpdateCard {
  id: string;
  title: string;
  cover: string;
  chapter: string;
  chapterNumber: number;
  timeAgo: string;
  releaseYear?: number;
  type?: string;
  newChapters?: number;
}