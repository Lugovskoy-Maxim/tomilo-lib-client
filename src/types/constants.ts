// Types for mock data constants

export interface TopTitleCombined {
  id: string;
  slug?: string;
  title: string;
  type: string;
  year: number;
  rating: number;
  coverImage: string;
  views?: number | string;
  isAdult?: boolean;
}
