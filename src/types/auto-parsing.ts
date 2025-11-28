export interface AutoParsingJob {
  _id: string;
  titleId: {
    _id: string;
    name: string;
    // другие поля тайтла при необходимости
  };
  url: string;
  frequency: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutoParsingJobDto {
  titleId: string;
  url: string;
  frequency: string;
}

export interface UpdateAutoParsingJobDto {
  titleId?: string;
  url?: string;
  frequency?: string;
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
