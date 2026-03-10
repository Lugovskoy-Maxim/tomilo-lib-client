export interface AutoParsingJob {
  _id: string;
  titleId: {
    _id: string;
    name: string;
    coverImage?: string;
    author?: string;
    releaseYear?: number;
    // другие поля тайтла при необходимости
  };
  url?: string;
  sources?: string[];
  frequency: string;
  /** Час запуска в UTC (0–23). Задаётся для распределения парсинга по часам. */
  scheduleHour?: number;
  /** Минута запуска: слот 0, 10, 20, 30, 40, 50 (шаг 10 минут). Если не задана — 0. */
  scheduleMinute?: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutoParsingJobDto {
  titleId: string;
  sources?: string[];
  frequency?: string;
  /** Час запуска в UTC (0–23), опционально. */
  scheduleHour?: number;
  /** Минута: 0, 10, 20, 30, 40, 50 (шаг 10 минут). Опционально, по умолчанию 0. */
  scheduleMinute?: number;
  enabled?: boolean;
}

export interface UpdateAutoParsingJobDto {
  titleId?: string;
  sources?: string[];
  frequency?: string;
  /** Час запуска в UTC (0–23). null — сбросить (вернуть в расписание без часа). */
  scheduleHour?: number | null;
  /** Минута: 0, 10, 20, 30, 40, 50. null — сбросить (как 0). */
  scheduleMinute?: number | null;
  enabled?: boolean;
}

export interface CheckNewChaptersResponse {
  jobId: string;
  titleId: string;
  chaptersFound: number;
  chaptersAdded: number;
  message: string;
  timestamp: string;
}
