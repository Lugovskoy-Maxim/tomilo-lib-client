export interface StatsResponse {
  totalTitles: number;
  totalChapters: number;
  totalUsers: number;
  totalCollections: number;
  totalViews: number;
  totalBookmarks: number;
  daily: PeriodStats;
  weekly: PeriodStats;
  monthly: PeriodStats;
  popularTitles: PopularTitle[];
  popularChapters: PopularChapter[];
  activeUsersToday: number;
  newUsersThisMonth: number;
  totalRatings: number;
  averageRating: number;
  ongoingTitles: number;
  completedTitles: number;
  history?: DailyStatsHistory[];
}

export interface PeriodStats {
  views: number;
  newUsers: number;
  newTitles: number;
  newChapters: number;
  chaptersRead: number;
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

// Historical data interfaces
export interface DailyStatsHistory {
  date: string;
  views: number;
  newUsers: number;
  newTitles: number;
  newChapters: number;
  chaptersRead: number;
  totalUsers: number;
  totalTitles: number;
  totalChapters: number;
}

export interface MonthlyStatsHistory {
  year: number;
  month: number;
  views: number;
  newUsers: number;
  newTitles: number;
  newChapters: number;
  chaptersRead: number;
  totalUsers: number;
  totalTitles: number;
  totalChapters: number;
}

export interface YearlyStatsHistory {
  year: number;
  views: number;
  newUsers: number;
  newTitles: number;
  newChapters: number;
  chaptersRead: number;
  totalUsers: number;
  totalTitles: number;
  totalChapters: number;
}

// Stats history response
export interface StatsHistoryResponse {
  type: "daily" | "monthly" | "yearly";
  data: DailyStatsHistory[] | MonthlyStatsHistory[] | YearlyStatsHistory[];
  total: number;
}

// Daily stats query params
export interface DailyStatsParams {
  date: string; // YYYY-MM-DD
}

// Range stats query params
export interface RangeStatsParams {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

// Monthly stats query params
export interface MonthlyStatsParams {
  year: number;
  month: number;
}

// Yearly stats query params
export interface YearlyStatsParams {
  year: number;
}

// Recent stats query params
export interface RecentStatsParams {
  days: number;
}

// Available years response
export interface AvailableYearsResponse {
  years: number[];
}

// Record stats response
export interface RecordStatsResponse {
  success: boolean;
  message: string;
  date: string;
  recorded: boolean;
}

// Stats with history params
export interface StatsWithHistoryParams {
  includeHistory?: boolean;
  historyDays?: number;
}
