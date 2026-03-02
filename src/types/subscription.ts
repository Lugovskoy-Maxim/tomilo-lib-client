export type SubscriptionType = "title" | "team" | "user";

export interface TitleSubscription {
  _id: string;
  userId: string;
  titleId: string;
  titleInfo?: {
    _id: string;
    name: string;
    slug?: string;
    coverImage?: string;
  };
  notifyOnNewChapter: boolean;
  notifyOnAnnouncement: boolean;
  createdAt: string;
}

export interface TeamSubscription {
  _id: string;
  userId: string;
  teamId: string;
  teamInfo?: {
    _id: string;
    name: string;
    slug?: string;
    avatar?: string;
  };
  notifyOnNewChapter: boolean;
  notifyOnNewTitle: boolean;
  createdAt: string;
}

export interface SubscriptionListResponse {
  subscriptions: TitleSubscription[];
  total: number;
  page: number;
  limit: number;
}

export interface TeamSubscriptionListResponse {
  subscriptions: TeamSubscription[];
  total: number;
  page: number;
  limit: number;
}

export interface SubscribeToTitleDto {
  titleId: string;
  notifyOnNewChapter?: boolean;
  notifyOnAnnouncement?: boolean;
}

export interface SubscribeToTeamDto {
  teamId: string;
  notifyOnNewChapter?: boolean;
  notifyOnNewTitle?: boolean;
}

export interface SubscriptionStats {
  titlesCount: number;
  teamsCount: number;
  usersCount: number;
}
