export interface ReaderChapter {
  _id: string; // original chapter ID from database
  id?: number; // legacy numeric ID for compatibility
  number: number; // chapter number
  title: string;
  date: string;
  views: number;
  images: string[]; // absolute URLs
}

export interface ReaderTitle {
  _id: string;
  id?: number; // legacy numeric ID for compatibility
  title: string;
  originalTitle: string;
  type: string;
  year: number;
  rating: number;
  image: string; // cover url
  genres: string[];
  description: string;
  status: string;
  author: string;
  artist: string;
  totalChapters: number;
  views: number;
  lastUpdate: string;
  chapters: ReaderChapter[];
  alternativeTitles: string[];
}
