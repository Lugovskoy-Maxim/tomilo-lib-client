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
}


export interface ReaderChapter {
  _id: string;
  number: number;
  title: string;
  date: string;
  views: number;
  images: string[];
}