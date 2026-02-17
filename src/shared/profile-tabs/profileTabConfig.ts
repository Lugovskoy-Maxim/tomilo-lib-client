import {
  BarChart3,
  Bookmark,
  Clock,
  LayoutDashboard,
  Package,
  Repeat,
  Settings,
  User,
} from "lucide-react";

export type ProfileTab =
  | "overview"
  | "bookmarks"
  | "history"
  | "inventory"
  | "exchanges"
  | "settings";

export const PROFILE_TABS: ProfileTab[] = [
  "overview",
  "bookmarks",
  "history",
  "inventory",
  "exchanges",
  "settings",
];

export const tabMeta: Record<
  ProfileTab,
  { label: string; icon: React.ElementType; description: string }
> = {
  overview: {
    label: "О себе",
    icon: BarChart3,
    description: "Информация и краткий обзор",
  },
  bookmarks: {
    label: "Закладки",
    icon: Bookmark,
    description: "Все сохранённые вами манги",
  },
  history: {
    label: "История",
    icon: Clock,
    description: "Прочитанные главы",
  },
  inventory: {
    label: "Инвентарь",
    icon: Package,
    description: "Предметы и декорации",
  },
  exchanges: {
    label: "Обмены",
    icon: Repeat,
    description: "Обмен с другими пользователями",
  },
  settings: {
    label: "Настройки",
    icon: Settings,
    description: "Уведомления, приватность, безопасность",
  },
};

export const tabGroups: { label: string; icon: React.ElementType; tabs: ProfileTab[] }[] = [
  { label: "Профиль", icon: User, tabs: ["overview"] },
  {
    label: "Контент",
    icon: LayoutDashboard,
    tabs: ["bookmarks", "history", "inventory", "exchanges"],
  },
  { label: "Настройки", icon: Settings, tabs: ["settings"] },
];

export function isValidProfileTab(tab: string | null): tab is ProfileTab {
  return Boolean(tab && PROFILE_TABS.includes(tab as ProfileTab));
}
