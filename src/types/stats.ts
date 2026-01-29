export interface StatsResponse {
  totalTitles: number;
  totalChapters: number;
  totalUsers: number;
  totalCollections: number;
  totalViews: number;
  totalBookmarks: number;
  daily: {
    views: number;
    newUsers: number;
    newTitles: number;
    newChapters: number;
    chaptersRead: number;
  };
  weekly: {
    views: number;
    newUsers: number;
    newTitles: number;
    newChapters: number;
    chaptersRead: number;
  };
  monthly: {
    views: number;
    newUsers: number;
    newTitles: number;
    newChapters: number;
    chaptersRead: number;
  };
  popularTitles: PopularTitle[];
  popularChapters: PopularChapter[];
  activeUsersToday: number;
  newUsersThisMonth: number;
  totalRatings: number;
  averageRating: number;
  ongoingTitles: number;
  completedTitles: number;
}

export interface PopularTitle {
  id: string;
  name: string;
  slug: string;
  views: number;
  dayViews: number;
  weekViews: number;
  monthViews: number;
}

export interface PopularChapter {
  id: string;
  titleId: string;
  titleName: string;
  chapterNumber: number;
  name: string;
  views: number;
}
