// Types for mock data constants

export interface ReadingProgress {
  id: number;
  title: string;
  type: string;
  currentChapter: number;
  totalChapters: number;
  lastRead: string;
  chaptersRead: number;
  image: string;
  rating: number;
  year: number;
  genres: string[];
}

export interface TopTitle {
  id: string;
  title: string;
  type: string;
  year: number;
  rating: number;
  image: string;
  genres: string[];
  rank?: number;
  views?: number;
  period?: 'day' | 'week' | 'month';
  isAdult?: boolean;
}

export interface TopTitleCombined {
  id: string;
  title: string;
  type: string;
  year: number;
  rating: number;
  coverImage: string;
  views?: number | string;
}


export interface LatestUpdate {
  id: string;
  title: string;
  chapter: string;
  chapterNumber: number;
  timeAgo: string;
  newChapters?: number;
  cover: string;
  type?: string;
}
