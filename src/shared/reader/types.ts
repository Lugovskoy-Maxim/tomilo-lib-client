// Типы для ридера

export interface ReaderTitle {
  _id: string;
  title: string;
  image: string;
  description?: string;
  type?: string;
  releaseYear?: number;
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
