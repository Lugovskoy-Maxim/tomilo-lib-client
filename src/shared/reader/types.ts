export interface ReaderChapter {
  id: number; // stable numeric id for UI
  _id?: string; // original chapter ID from database
  number: number; // chapter number
  title: string;
  date: string | Date;
  views: number;
  images: string[]; // absolute URLs
}

export interface ReaderTitle {
  id: number; // for routes back to /browse/:id
  title: string;
  originalTitle?: string;
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
  lastUpdate?: string | Date;
  chapters?: ReaderChapter[];
  alternativeTitles?: string[];
}


