// Типы для ридера

export interface ReaderTitle {
  _id: string;
  title: string;
  originalTitle?: string;
  image: string;
  description?: string;
  type?: string;
  year?: number;
  rating?: number;
  genres?: string[];
  status?: string;
  author?: string;
  artist?: string;
  totalChapters?: number;
  views?: number;
  lastUpdate?: string;
  chapters?: ReaderChapter[];
  alternativeTitles?: string[];
}

export interface ReaderChapter {
  _id: string;
  number: number;
  title?: string;
  images: string[];
  createdAt?: string;
  updatedAt?: string;
  date?: string;
  views?: number;
}
