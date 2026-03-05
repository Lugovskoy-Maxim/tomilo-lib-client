export type TranslatorRole = "translator" | "editor" | "proofreader" | "cleaner" | "typesetter" | "leader";

export interface TranslatorTeamMember {
  _id: string;
  userId?: string;
  name: string;
  avatar?: string;
  role: TranslatorRole;
  socialLinks?: {
    telegram?: string;
    discord?: string;
    vk?: string;
    boosty?: string;
    patreon?: string;
  };
}

/** Участник при создании/обновлении команды: _id не обязателен (сервер присвоит новым). */
export type TranslatorTeamMemberInput = Omit<TranslatorTeamMember, "_id"> & { _id?: string };

export interface TranslatorTeam {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  avatar?: string;
  banner?: string;
  members: TranslatorTeamMember[];
  titleIds: string[];
  chaptersCount: number;
  subscribersCount: number;
  totalViews: number;
  socialLinks?: {
    telegram?: string;
    discord?: string;
    vk?: string;
    boosty?: string;
    patreon?: string;
    website?: string;
  };
  donationLinks?: {
    boosty?: string;
    patreon?: string;
    donationalerts?: string;
    yoomoney?: string;
  };
  isVerified?: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TranslatorTeamListResponse {
  teams: TranslatorTeam[];
  total: number;
  page: number;
  limit: number;
}

export type CreateTranslatorTeamDto = Omit<
  TranslatorTeam,
  | "_id"
  | "members"
  | "chaptersCount"
  | "subscribersCount"
  | "totalViews"
  | "createdAt"
  | "updatedAt"
  | "isActive"
> & { members: TranslatorTeamMemberInput[]; isActive?: boolean };
export type UpdateTranslatorTeamDto = Partial<CreateTranslatorTeamDto>;

export const translatorRoleLabels: Record<TranslatorRole, string> = {
  translator: "Переводчик",
  editor: "Редактор",
  proofreader: "Корректор",
  cleaner: "Клинер",
  typesetter: "Тайпсеттер",
  leader: "Лидер",
};

export const translatorRoleColors: Record<TranslatorRole, string> = {
  translator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  editor: "bg-green-500/20 text-green-400 border-green-500/30",
  proofreader: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  cleaner: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  typesetter: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  leader: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};
