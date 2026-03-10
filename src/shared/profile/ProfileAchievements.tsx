"use client";

import { UserProfile, ProfileAchievementFromServer } from "@/types/user";
import { useGetProfileAchievementsQuery } from "@/store/api/authApi";
import {
  Trophy,
  BookOpen,
  Bookmark,
  Users,
  Clock,
  Crown,
  ChevronRight,
  ChevronUp,
  Sparkles,
  MessageCircle,
  Star,
  Flame,
  CheckCircle,
  Coins,
  ShoppingBag,
  Heart,
  Compass,
  ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useMemo, memo } from "react";

const ICON_MAP: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  bookmark: Bookmark,
  crown: Crown,
  clock: Clock,
  users: Users,
  "message-circle": MessageCircle,
  star: Star,
  flame: Flame,
  "check-circle": CheckCircle,
  coins: Coins,
  "shopping-bag": ShoppingBag,
  heart: Heart,
  compass: Compass,
  "shield-alert": ShieldAlert,
};

const ACHIEVEMENT_STYLE: Record<string, { color: string; bgColor: string }> = {
  reader: { color: "#3b82f6", bgColor: "from-blue-500/20 to-cyan-500/20" },
  collector: { color: "#8b5cf6", bgColor: "from-purple-500/20 to-violet-500/20" },
  cultivator: { color: "#f59e0b", bgColor: "from-amber-500/20 to-orange-500/20" },
  veteran: { color: "#64748b", bgColor: "from-slate-500/20 to-zinc-500/20" },
  social: { color: "#06b6d4", bgColor: "from-cyan-500/20 to-teal-500/20" },
  commentator: { color: "#ec4899", bgColor: "from-pink-500/20 to-rose-500/20" },
  critic: { color: "#eab308", bgColor: "from-yellow-500/20 to-amber-500/20" },
  marathon: { color: "#ef4444", bgColor: "from-red-500/20 to-orange-500/20" },
  completer: { color: "#22c55e", bgColor: "from-green-500/20 to-emerald-500/20" },
  time_reader: { color: "#0ea5e9", bgColor: "from-sky-500/20 to-blue-500/20" },
  saver: { color: "#84cc16", bgColor: "from-lime-500/20 to-green-500/20" },
  shopper: { color: "#a855f7", bgColor: "from-purple-500/20 to-fuchsia-500/20" },
  popular: { color: "#f43f5e", bgColor: "from-rose-500/20 to-pink-500/20" },
  explorer: { color: "#14b8a6", bgColor: "from-teal-500/20 to-cyan-500/20" },
  reporter: { color: "#64748b", bgColor: "from-slate-500/20 to-zinc-500/20" },
};

function serverToDisplayAchievements(
  list: ProfileAchievementFromServer[],
): AchievementWithLevels[] {
  return list.map((a) => {
    const style = ACHIEVEMENT_STYLE[a.id] ?? {
      color: "var(--muted-foreground)",
      bgColor: "from-[var(--secondary)] to-[var(--secondary)]",
    };
    const Icon = ICON_MAP[a.icon] ?? Trophy;
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      icon: Icon,
      color: style.color,
      bgColor: style.bgColor,
      currentLevel: a.currentLevel,
      maxLevel: a.maxLevel,
      currentValue: a.currentValue,
      levels: a.levels.map((l) => ({ threshold: l.threshold, name: l.name })),
    };
  });
}

interface ProfileAchievementsProps {
  userProfile: UserProfile;
  compact?: boolean;
  /** Публичный просмотр (чужой профиль) */
  isPublicView?: boolean;
}

interface AchievementWithLevels {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  currentLevel: number;
  maxLevel: number;
  currentValue: number;
  levels: { threshold: number; name: string }[];
}

function generateAchievements(userProfile: UserProfile): AchievementWithLevels[] {
  const chaptersRead =
    userProfile.readingHistory?.reduce(
      (t, item) => t + (item.chaptersCount ?? item.chapters?.length ?? 0),
      0,
    ) ?? 0;
  const totalBookmarks = userProfile.bookmarks?.length ?? 0;
  const level = userProfile.level ?? 0;
  const joinedDate = userProfile.createdAt ? new Date(userProfile.createdAt) : null;
  const daysSinceJoined = joinedDate
    ? Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const linkedProviders = userProfile.linkedProviders?.length ?? 0;
  const emailVerified = userProfile.emailVerified ? 1 : 0;
  const commentsCount = userProfile.commentsCount ?? 0;
  const ratingsCount = userProfile.ratingsCount ?? 0;
  const longestStreak = userProfile.longestStreak ?? 0;
  const completedTitlesCount = userProfile.completedTitlesCount ?? 0;
  const readingTimeMinutes = userProfile.readingTimeMinutes ?? 0;
  const balance = userProfile.balance ?? 0;
  const ownedDecorationsCount = userProfile.ownedDecorations?.length ?? 0;
  const likesReceivedCount = userProfile.likesReceivedCount ?? 0;
  const titlesReadCount = userProfile.titlesReadCount ?? 0;
  const reportsCount = userProfile.reportsCount ?? 0;

  const achievements: AchievementWithLevels[] = [
    {
      id: "reader",
      name: "Читатель",
      description: "Прочитайте главы манги",
      icon: BookOpen,
      color: "#3b82f6",
      bgColor: "from-blue-500/20 to-cyan-500/20",
      currentValue: chaptersRead,
      levels: [
        { threshold: 1, name: "Новичок" },
        { threshold: 10, name: "Любитель" },
        { threshold: 50, name: "Книжный червь" },
        { threshold: 100, name: "Заядлый" },
        { threshold: 500, name: "Мастер" },
        { threshold: 1000, name: "Легенда" },
        { threshold: 5000, name: "Всезнающий" },
      ],
      currentLevel: 0,
      maxLevel: 7,
    },
    {
      id: "collector",
      name: "Коллекционер",
      description: "Добавляйте мангу в закладки",
      icon: Bookmark,
      color: "#8b5cf6",
      bgColor: "from-purple-500/20 to-violet-500/20",
      currentValue: totalBookmarks,
      levels: [
        { threshold: 1, name: "Начинающий" },
        { threshold: 10, name: "Собиратель" },
        { threshold: 25, name: "Знаток" },
        { threshold: 50, name: "Ценитель" },
        { threshold: 100, name: "Хранитель" },
      ],
      currentLevel: 0,
      maxLevel: 5,
    },
    {
      id: "cultivator",
      name: "Культиватор",
      description: "Повышайте уровень аккаунта",
      icon: Crown,
      color: "#f59e0b",
      bgColor: "from-amber-500/20 to-orange-500/20",
      currentValue: level,
      levels: [
        { threshold: 5, name: "Ученик" },
        { threshold: 10, name: "Адепт" },
        { threshold: 25, name: "Мастер" },
        { threshold: 50, name: "Грандмастер" },
        { threshold: 80, name: "Бессмертный" },
      ],
      currentLevel: 0,
      maxLevel: 5,
    },
    {
      id: "veteran",
      name: "Ветеран",
      description: "Время на сайте",
      icon: Clock,
      color: "#22c55e",
      bgColor: "from-green-500/20 to-emerald-500/20",
      currentValue: daysSinceJoined,
      levels: [
        { threshold: 7, name: "Неделя" },
        { threshold: 30, name: "Месяц" },
        { threshold: 90, name: "Сезон" },
        { threshold: 180, name: "Полгода" },
        { threshold: 365, name: "Год" },
      ],
      currentLevel: 0,
      maxLevel: 5,
    },
    {
      id: "social",
      name: "Социальный",
      description: "Привяжите аккаунты соцсетей",
      icon: Users,
      color: "#ec4899",
      bgColor: "from-pink-500/20 to-rose-500/20",
      currentValue: linkedProviders + emailVerified,
      levels: [
        { threshold: 1, name: "Подтверждён" },
        { threshold: 2, name: "Связан" },
        { threshold: 3, name: "Интегрирован" },
      ],
      currentLevel: 0,
      maxLevel: 3,
    },
    {
      id: "commentator",
      name: "Комментатор",
      description: "Оставляйте комментарии к главам и тайтлам",
      icon: MessageCircle,
      color: "#06b6d4",
      bgColor: "from-cyan-500/20 to-teal-500/20",
      currentValue: commentsCount,
      levels: [
        { threshold: 5, name: "Первый отзыв" },
        { threshold: 50, name: "Голос сообщества" },
        { threshold: 250, name: "Активный участник" },
        { threshold: 500, name: "Эксперт мнений" },
        { threshold: 2500, name: "Легенда обсуждений" },
      ],
      currentLevel: 0,
      maxLevel: 5,
    },
    {
      id: "critic",
      name: "Критик",
      description: "Ставьте оценки тайтлам и главам",
      icon: Star,
      color: "#eab308",
      bgColor: "from-yellow-500/20 to-amber-500/20",
      currentValue: ratingsCount,
      levels: [
        { threshold: 5, name: "Оценка" },
        { threshold: 50, name: "Ценитель" },
        { threshold: 250, name: "Знаток" },
        { threshold: 500, name: "Строгий судья" },
        { threshold: 1500, name: "Вердикт мастера" },
      ],
      currentLevel: 0,
      maxLevel: 5,
    },
    {
      id: "marathon",
      name: "Марафонец",
      description: "Читайте подряд несколько дней подряд (серия)",
      icon: Flame,
      color: "#ef4444",
      bgColor: "from-red-500/20 to-orange-500/20",
      currentValue: longestStreak,
      levels: [
        { threshold: 3, name: "Три дня" },
        { threshold: 7, name: "Неделя" },
        { threshold: 14, name: "Две недели" },
        { threshold: 30, name: "Месяц" },
        { threshold: 100, name: "Сто дней" },
      ],
      currentLevel: 0,
      maxLevel: 5,
    },
    {
      id: "completer",
      name: "Завершающий",
      description: "Добавляйте тайтлы в «Прочитано»",
      icon: CheckCircle,
      color: "#10b981",
      bgColor: "from-emerald-500/20 to-green-500/20",
      currentValue: completedTitlesCount,
      levels: [
        { threshold: 1, name: "Первый финиш" },
        { threshold: 5, name: "Любитель концовок" },
        { threshold: 15, name: "Собиратель завершений" },
        { threshold: 30, name: "Мастер списка" },
        { threshold: 100, name: "Легенда завершений" },
      ],
      currentLevel: 0,
      maxLevel: 5,
    },
    {
      id: "time_reader",
      name: "Читатель времени",
      description: "Проводите время за чтением (минуты)",
      icon: Clock,
      color: "#6366f1",
      bgColor: "from-indigo-500/20 to-violet-500/20",
      currentValue: readingTimeMinutes,
      levels: [
        { threshold: 60, name: "Час" },
        { threshold: 300, name: "Пять часов" },
        { threshold: 600, name: "Десять часов" },
        { threshold: 1800, name: "30 часов" },
        { threshold: 5000, name: "Сто часов" },
        { threshold: 10000, name: "Мастер времени" },
      ],
      currentLevel: 0,
      maxLevel: 6,
    },
    {
      id: "saver",
      name: "Накопитель",
      description: "Копите монеты на балансе",
      icon: Coins,
      color: "#84cc16",
      bgColor: "from-lime-500/20 to-green-500/20",
      currentValue: balance,
      levels: [
        { threshold: 100, name: "Первая сотня" },
        { threshold: 500, name: "Копилка" },
        { threshold: 1000, name: "Бережливый" },
        { threshold: 2500, name: "Накопитель" },
        { threshold: 5000, name: "Казначей" },
        { threshold: 10000, name: "Владелец сундука" },
      ],
      currentLevel: 0,
      maxLevel: 6,
    },
    {
      id: "shopper",
      name: "Покупатель",
      description: "Покупайте декорации в магазине",
      icon: ShoppingBag,
      color: "#a855f7",
      bgColor: "from-violet-500/20 to-purple-500/20",
      currentValue: ownedDecorationsCount,
      levels: [
        { threshold: 1, name: "Первый выбор" },
        { threshold: 5, name: "Клиент магазина" },
        { threshold: 10, name: "Покупатель" },
        { threshold: 25, name: "Коллекционер декора" },
        { threshold: 50, name: "Меценат" },
      ],
      currentLevel: 0,
      maxLevel: 5,
    },
    {
      id: "popular",
      name: "Популярный",
      description: "Получайте лайки на комментариях",
      icon: Heart,
      color: "#f43f5e",
      bgColor: "from-rose-500/20 to-pink-500/20",
      currentValue: likesReceivedCount,
      levels: [
        { threshold: 1, name: "Первый лайк" },
        { threshold: 10, name: "Заметный" },
        { threshold: 50, name: "Популярный" },
        { threshold: 100, name: "Любимец сообщества" },
        { threshold: 500, name: "Звезда обсуждений" },
      ],
      currentLevel: 0,
      maxLevel: 5,
    },
    {
      id: "explorer",
      name: "Исследователь",
      description: "Читайте разные тайтлы (уникальные прочитанные)",
      icon: Compass,
      color: "#0ea5e9",
      bgColor: "from-sky-500/20 to-blue-500/20",
      currentValue: titlesReadCount,
      levels: [
        { threshold: 1, name: "Первый тайтл" },
        { threshold: 10, name: "Любознательный" },
        { threshold: 50, name: "Исследователь" },
        { threshold: 100, name: "Широкий кругозор" },
        { threshold: 300, name: "Мастер жанров" },
      ],
      currentLevel: 0,
      maxLevel: 5,
    },
    {
      id: "reporter",
      name: "Страж порядка",
      description: "Отправляйте жалобы на некорректный контент",
      icon: ShieldAlert,
      color: "#64748b",
      bgColor: "from-slate-500/20 to-zinc-500/20",
      currentValue: reportsCount,
      levels: [
        { threshold: 1, name: "Первый сигнал" },
        { threshold: 5, name: "Бдительный" },
        { threshold: 10, name: "Помощник модерации" },
        { threshold: 25, name: "Страж порядка" },
        { threshold: 50, name: "Защитник сообщества" },
      ],
      currentLevel: 0,
      maxLevel: 5,
    },
  ];

  return achievements.map(ach => {
    let currentLevel = 0;
    for (let i = 0; i < ach.levels.length; i++) {
      if (ach.currentValue >= ach.levels[i].threshold) {
        currentLevel = i + 1;
      }
    }
    return { ...ach, currentLevel };
  });
}

const AchievementCard = memo(function AchievementCard({
  achievement,
  expanded,
  onToggle,
}: {
  achievement: AchievementWithLevels;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = achievement.icon;
  const isUnlocked = achievement.currentLevel > 0;
  const currentLevelData = achievement.levels[achievement.currentLevel - 1];
  const nextLevelData = achievement.levels[achievement.currentLevel];

  const prevThreshold = currentLevelData?.threshold ?? 0;
  const nextThreshold =
    nextLevelData?.threshold ?? achievement.levels[achievement.levels.length - 1].threshold;
  const progressInLevel = achievement.currentValue - prevThreshold;
  const levelRange = nextThreshold - prevThreshold;
  const progressPercent = nextLevelData ? Math.min((progressInLevel / levelRange) * 100, 100) : 100;

  const formatValue = (val: number, id: string) => {
    if (id === "veteran") {
      if (val >= 365) return `${Math.floor(val / 365)}г ${val % 365}д`;
      if (val >= 30) return `${Math.floor(val / 30)}м ${val % 30}д`;
      return `${val}д`;
    }
    if (id === "time_reader") {
      if (val >= 60) return `${Math.floor(val / 60)}ч`;
      return `${val}м`;
    }
    return val.toLocaleString();
  };

  return (
    <div
      className={`relative rounded-xl border overflow-hidden transition-all duration-300 ${
        isUnlocked
          ? "border-[var(--border)]/80 bg-[var(--card)]"
          : "border-[var(--border)]/40 bg-[var(--secondary)]/20 opacity-70"
      }`}
    >
      {/* Main content */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-3 min-[360px]:p-3.5 flex items-center gap-2.5 min-[360px]:gap-3 text-left"
      >
        {/* Icon */}
        <div
          className={`relative shrink-0 w-10 h-10 min-[360px]:w-11 min-[360px]:h-11 rounded-xl flex items-center justify-center ${
            isUnlocked ? `bg-gradient-to-br ${achievement.bgColor}` : "bg-[var(--secondary)]"
          }`}
          style={isUnlocked ? { boxShadow: `0 0 16px ${achievement.color}30` } : undefined}
        >
          <Icon
            className="w-5 h-5 min-[360px]:w-5.5 min-[360px]:h-5.5"
            style={{ color: isUnlocked ? achievement.color : "var(--muted-foreground)" }}
          />
          {isUnlocked && (
            <div
              className="absolute -top-1 -right-1 w-5 h-5 min-[360px]:w-5.5 min-[360px]:h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: achievement.color }}
            >
              {achievement.currentLevel}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-[360px]:gap-2 mb-0.5">
            <h3
              className={`text-sm font-semibold truncate ${isUnlocked ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
            >
              {achievement.name}
            </h3>
            {isUnlocked && currentLevelData && (
              <span
                className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${achievement.color}20`,
                  color: achievement.color,
                }}
              >
                {currentLevelData.name}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: achievement.color,
                }}
              />
            </div>
            <span className="shrink-0 text-[10px] text-[var(--muted-foreground)] tabular-nums">
              {formatValue(achievement.currentValue, achievement.id)}
              {nextLevelData && (
                <span className="opacity-60">/{formatValue(nextThreshold, achievement.id)}</span>
              )}
            </span>
          </div>
        </div>

        {/* Expand button */}
        <div className="shrink-0 p-1">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
          )}
        </div>
      </button>

      {/* Expanded levels */}
      {expanded && (
        <div className="px-3 min-[360px]:px-3.5 pb-3 min-[360px]:pb-3.5 pt-1 border-t border-[var(--border)]/50">
          <p className="text-[11px] text-[var(--muted-foreground)] mb-2">
            {achievement.description}
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {achievement.levels.map((lvl, idx) => {
              const levelNum = idx + 1;
              const isCompleted = levelNum <= achievement.currentLevel;
              const isCurrent = levelNum === achievement.currentLevel;
              const isNext = levelNum === achievement.currentLevel + 1;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs ${
                    isCompleted
                      ? "bg-[var(--secondary)]/60"
                      : isNext
                        ? "bg-[var(--secondary)]/30 border border-dashed border-[var(--border)]"
                        : "opacity-50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCompleted
                        ? "text-white"
                        : "text-[var(--muted-foreground)] bg-[var(--secondary)]"
                    }`}
                    style={isCompleted ? { backgroundColor: achievement.color } : undefined}
                  >
                    {isCompleted ? "✓" : levelNum}
                  </div>
                  <span
                    className={`flex-1 ${isCompleted ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
                  >
                    {lvl.name}
                  </span>
                  <span className="text-[var(--muted-foreground)] tabular-nums">
                    {formatValue(lvl.threshold, achievement.id)}
                  </span>
                  {isCurrent && (
                    <Sparkles className="w-3 h-3" style={{ color: achievement.color }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default function ProfileAchievements({
  userProfile,
  compact = false,
  isPublicView = false,
}: ProfileAchievementsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: achievementsResponse } = useGetProfileAchievementsQuery(undefined, {
    skip: isPublicView,
  });

  const achievements = useMemo(() => {
    if (!isPublicView && achievementsResponse?.success && achievementsResponse?.data?.achievements?.length) {
      return serverToDisplayAchievements(achievementsResponse.data.achievements);
    }
    if (isPublicView && userProfile.profileAchievements?.length) {
      return serverToDisplayAchievements(userProfile.profileAchievements);
    }
    return generateAchievements(userProfile);
  }, [isPublicView, userProfile, achievementsResponse?.success, achievementsResponse?.data?.achievements]);

  const { totalLevels, unlockedLevels, overallPercent } = useMemo(() => {
    const total = achievements.reduce((sum, a) => sum + a.maxLevel, 0);
    const unlocked = achievements.reduce((sum, a) => sum + a.currentLevel, 0);
    return {
      totalLevels: total,
      unlockedLevels: unlocked,
      overallPercent: Math.round((unlocked / total) * 100),
    };
  }, [achievements]);

  // Если это публичный просмотр и пользователь скрыл достижения — не показываем
  const isAchievementsHidden = isPublicView && userProfile.showAchievements === false;

  if (isAchievementsHidden) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-[var(--card)]/90 backdrop-blur-sm p-6 sm:p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[var(--muted-foreground)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <p className="text-[var(--foreground)] font-medium mb-1">Достижения скрыты</p>
        <p className="text-sm text-[var(--muted-foreground)]">
          Пользователь ограничил доступ к своим достижениям в настройках приватности.
        </p>
      </div>
    );
  }

  const INITIAL_FULL = 6;
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const displayedAchievements = compact
    ? achievements.slice(0, 3)
    : showAllAchievements
      ? achievements
      : achievements.slice(0, INITIAL_FULL);
  const hasMoreAchievements = !compact && achievements.length > INITIAL_FULL && !showAllAchievements;

  return (
    <div
      className={`rounded-xl border border-[var(--border)]/80 bg-[var(--card)]/90 backdrop-blur-sm shadow-sm ${compact ? "p-3 min-[360px]:p-3.5" : "p-3 min-[360px]:p-4"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 min-[360px]:mb-4">
        <div className="flex items-center gap-2 min-[360px]:gap-2.5 min-w-0">
          <div className="shrink-0 p-2 min-[360px]:p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Trophy className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm min-[360px]:text-base font-bold text-[var(--foreground)] truncate">
              Достижения
            </h2>
            <p className="text-[10px] min-[360px]:text-xs text-[var(--muted-foreground)]">
              {unlockedLevels} из {totalLevels} уровней
            </p>
          </div>
        </div>

        {/* Progress ring */}
        <div className="shrink-0 relative w-10 h-10 min-[360px]:w-12 min-[360px]:h-12">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="var(--secondary)"
              strokeWidth="3.5"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="url(#achievementGradient)"
              strokeWidth="3.5"
              strokeDasharray={`${overallPercent}, 100`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="achievementGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] min-[360px]:text-xs font-bold text-[var(--foreground)]">
              {overallPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Achievements list */}
      <div className="flex flex-col gap-2">
        {displayedAchievements.map(achievement => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            expanded={expandedId === achievement.id}
            onToggle={() => setExpandedId(expandedId === achievement.id ? null : achievement.id)}
          />
        ))}
      </div>

      {hasMoreAchievements && (
        <button
          type="button"
          onClick={() => setShowAllAchievements(true)}
          className="mt-3 py-2 w-full rounded-lg text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 border border-[var(--border)]/60 transition-colors"
        >
          Показать ещё ({achievements.length - INITIAL_FULL})
        </button>
      )}

      {/* Show more for compact mode */}
      {compact && achievements.length > 3 && (
        <div className="mt-2 text-center">
          <span className="text-[11px] text-[var(--muted-foreground)]">
            +{achievements.length - 3} ещё
          </span>
        </div>
      )}
    </div>
  );
}
