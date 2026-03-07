"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { TrendingUp, Star, Users, Flame, Search, Eye, EyeOff, Calendar, MessageSquare, X, User, BookOpen, Trophy, Heart } from "lucide-react";

import { Footer, Header } from "@/widgets";
import LoadingSkeleton from "@/shared/skeleton/skeleton";
import ErrorState from "@/shared/profile/ProfileError";
import LeaderCard from "@/shared/leader-card/LeaderCard";
import {
  useGetLeaderboardQuery,
  LeaderboardCategory,
  LeaderboardPeriod,
  LeaderboardUser,
} from "@/store/api/leaderboardApi";
import { useGetHomepageActiveUsersQuery } from "@/store/api/usersApi";
import { useGetProfileByIdQuery } from "@/store/api/authApi";
import { useGetDecorationsQuery } from "@/store/api/shopApi";
import { useMounted } from "@/hooks/useMounted";
import { useAuth } from "@/hooks/useAuth";
import { useUserLeaderboardPositions } from "@/hooks/useUserLeaderboardPositions";
import { getDecorationImageUrl, getEquippedAvatarDecorationUrl, getEquippedFrameUrl, getEquippedCardUrl, type DecorationRarity } from "@/api/shop";
import { getCoverUrls } from "@/lib/asset-url";
import { getRankDisplay } from "@/lib/rank-utils";
import { isPremiumActive } from "@/lib/premium";
import { PremiumBadge } from "@/shared/premium-badge/PremiumBadge";
import type { EquippedDecorations } from "@/types/user";

type CategoryConfig = {
  id: LeaderboardCategory;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

const CATEGORIES: CategoryConfig[] = [
  {
    id: "level",
    label: "По уровню",
    shortLabel: "Уровень",
    icon: TrendingUp,
    description: "Топ пользователей по уровню и опыту",
  },
  {
    id: "chaptersRead",
    label: "По главам",
    shortLabel: "Главы",
    icon: Users,
    description: "Больше всего прочитанных глав",
  },
  {
    id: "ratings",
    label: "По оценкам",
    shortLabel: "Оценки",
    icon: Star,
    description: "Больше всего оценённых тайтлов",
  },
  {
    id: "comments",
    label: "По комментариям",
    shortLabel: "Комментарии",
    icon: MessageSquare,
    description: "Самые активные комментаторы",
  },
  {
    id: "streak",
    label: "По активности",
    shortLabel: "Серия",
    icon: Flame,
    description: "Самые длинные серии дней активности",
  },
];

type PeriodConfig = {
  id: LeaderboardPeriod;
  label: string;
  shortLabel: string;
};

const PERIODS: PeriodConfig[] = [
  { id: "all", label: "За всё время", shortLabel: "Всё время" },
  { id: "month", label: "За месяц", shortLabel: "Месяц" },
];

interface TransformableUserEquipped {
  avatar?: string | { id?: string; _id?: string; imageUrl?: string; image_url?: string } | null;
  frame?: string | { id?: string; _id?: string; imageUrl?: string; image_url?: string } | null;
  background?: string | { id?: string; _id?: string; imageUrl?: string; image_url?: string } | null;
  card?: string | { id?: string; _id?: string; imageUrl?: string; image_url?: string } | null;
}

interface TransformableUser {
  _id: string;
  username: string;
  avatar?: string;
  role?: string;
  level?: number;
  experience?: number;
  lastActiveAt?: string;
  activityScore?: number;
  reputationScore?: number;
  readingHistory?: Array<{ chapters?: Array<unknown> }>;
  bookmarks?: Array<unknown>;
  equippedDecorations?: TransformableUserEquipped | null;
  currentStreak?: number;
  longestStreak?: number;
  lastStreakDate?: string;
  readingTimeMinutes?: number;
  titlesReadCount?: number;
  completedTitlesCount?: number;
  commentsCount?: number;
  likesReceivedCount?: number;
  ratingsCount?: number;
  chaptersRead?: number;
  showStats?: boolean;
  subscriptionExpiresAt?: string | null;
}

type DecorationValue = string | { id?: string; _id?: string; imageUrl?: string; image_url?: string; rarity?: DecorationRarity } | null | undefined;
type DecorationMapEntry = { imageUrl: string; rarity: DecorationRarity; type: string };

interface ResolvedDecoration {
  url: string | null;
  rarity: DecorationRarity | null;
}

function resolveDecorationValue(
  value: DecorationValue,
  decorationsMap: Map<string, DecorationMapEntry>
): ResolvedDecoration {
  if (value == null) return { url: null, rarity: null };
  
  if (typeof value === "object") {
    const obj = value as { id?: string; _id?: string; imageUrl?: string; image_url?: string; rarity?: DecorationRarity };
    const imageUrl = obj.imageUrl ?? obj.image_url;
    if (imageUrl) {
      return { 
        url: getDecorationImageUrl(imageUrl) || imageUrl,
        rarity: obj.rarity ?? null
      };
    }
    const id = obj.id ?? obj._id;
    if (id && decorationsMap.has(id)) {
      const entry = decorationsMap.get(id)!;
      return { 
        url: getDecorationImageUrl(entry.imageUrl) || entry.imageUrl,
        rarity: entry.rarity
      };
    }
    return { url: null, rarity: null };
  }
  
  const trimmed = value.trim();
  if (!trimmed) return { url: null, rarity: null };
  
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return { url: getDecorationImageUrl(trimmed) || trimmed, rarity: null };
  }
  
  if (/^[a-f0-9]{24}$/i.test(trimmed)) {
    const entry = decorationsMap.get(trimmed);
    if (entry) {
      return { 
        url: getDecorationImageUrl(entry.imageUrl) || entry.imageUrl,
        rarity: entry.rarity
      };
    }
    return { url: null, rarity: null };
  }
  
  return { url: getDecorationImageUrl(trimmed) || null, rarity: null };
}

interface ResolvedEquippedDecorations {
  avatar?: string | null;
  frame?: string | null;
  background?: string | null;
  card?: string | null;
  cardRarity?: DecorationRarity | null;
  frameRarity?: DecorationRarity | null;
  avatarRarity?: DecorationRarity | null;
}

function resolveEquippedDecorations(
  equipped: TransformableUserEquipped | null | undefined,
  decorationsMap: Map<string, DecorationMapEntry>
): ResolvedEquippedDecorations | null {
  if (!equipped) return null;
  
  const avatar = resolveDecorationValue(equipped.avatar, decorationsMap);
  const frame = resolveDecorationValue(equipped.frame, decorationsMap);
  const card = resolveDecorationValue(equipped.card, decorationsMap);
  const background = resolveDecorationValue(equipped.background, decorationsMap);
  
  return {
    avatar: avatar.url,
    frame: frame.url,
    background: background.url,
    card: card.url,
    cardRarity: card.rarity,
    frameRarity: frame.rarity,
    avatarRarity: avatar.rarity,
  };
}

function transformUsersToLeaderboard(
  users: TransformableUser[],
  category: LeaderboardCategory,
  decorationsMap: Map<string, DecorationMapEntry>
): LeaderboardUser[] {
  const visibleUsers = users.filter(user => user.showStats !== false);
  
  const mappedUsers = visibleUsers.map(user => {
    const chaptersReadFromHistory = user.readingHistory?.reduce(
      (total, item) => total + (item.chapters?.length || 0),
      0
    ) ?? 0;
    
    const chaptersRead = user.chaptersRead ?? chaptersReadFromHistory;

    return {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      level: user.level ?? 0,
      experience: user.experience ?? 0,
      readingTime: user.readingTimeMinutes ?? chaptersRead * 2,
      readingTimeMinutes: user.readingTimeMinutes ?? chaptersRead * 2,
      chaptersRead,
      ratingsCount: user.ratingsCount ?? user.bookmarks?.length ?? Math.floor((user.reputationScore ?? 0) * 0.5),
      commentsCount: user.commentsCount ?? Math.floor((user.activityScore ?? 0) * 0.3),
      currentStreak: user.currentStreak ?? 0,
      longestStreak: user.longestStreak ?? 0,
      lastStreakDate: user.lastStreakDate,
      titlesReadCount: user.titlesReadCount ?? 0,
      completedTitlesCount: user.completedTitlesCount ?? 0,
      likesReceivedCount: user.likesReceivedCount ?? 0,
      equippedDecorations: resolveEquippedDecorations(user.equippedDecorations, decorationsMap),
      showStats: user.showStats,
      subscriptionExpiresAt: user.subscriptionExpiresAt ?? null,
    };
  });

  const sortedUsers = [...mappedUsers].sort((a, b) => {
    switch (category) {
      case "level":
        return (b.level ?? 0) - (a.level ?? 0) || (b.experience ?? 0) - (a.experience ?? 0);
      case "chaptersRead":
        return (b.chaptersRead ?? 0) - (a.chaptersRead ?? 0);
      case "readingTime":
        return (b.readingTime ?? 0) - (a.readingTime ?? 0);
      case "ratings":
        return (b.ratingsCount ?? 0) - (a.ratingsCount ?? 0);
      case "comments":
        return (b.commentsCount ?? 0) - (a.commentsCount ?? 0);
      case "streak":
        return (b.currentStreak ?? 0) - (a.currentStreak ?? 0) || (b.longestStreak ?? 0) - (a.longestStreak ?? 0);
      default:
        return 0;
    }
  });

  return sortedUsers;
}

const DEFAULT_AVATAR = "/logo/ring_logo.png";
function getLeaderAvatarUrl(u: LeaderboardUser): string {
  const deco = getEquippedAvatarDecorationUrl(u.equippedDecorations as EquippedDecorations | null);
  if (deco) return deco;
  const primary = getCoverUrls(u.avatar, "").primary;
  return primary || DEFAULT_AVATAR;
}
function getLeaderFrameUrl(u: LeaderboardUser): string | null {
  return getEquippedFrameUrl(u.equippedDecorations as EquippedDecorations | null);
}

const VALID_CATEGORIES: LeaderboardCategory[] = ["level", "chaptersRead", "ratings", "comments", "streak"];

/** Поля статистики и профиля для слияния из обоих источников (leaderboard + homepage), чтобы карточки были полными во всех топах */
const MERGE_STAT_KEYS: (keyof TransformableUser)[] = [
  "avatar", "role", "level", "experience", "chaptersRead", "readingTimeMinutes",
  "ratingsCount", "commentsCount", "currentStreak", "longestStreak", "lastStreakDate",
  "titlesReadCount", "completedTitlesCount", "likesReceivedCount", "showStats",
  "readingHistory", "bookmarks", "activityScore", "reputationScore",
  "equippedDecorations", "lastActiveAt",
];

const MERGE_EXTRA_KEYS = ["readingTime"] as const;

const NUMERIC_MERGE_KEYS = new Set([
  "level", "experience", "chaptersRead", "readingTimeMinutes", "ratingsCount", "commentsCount",
  "currentStreak", "longestStreak", "titlesReadCount", "completedTitlesCount", "likesReceivedCount",
  "activityScore", "reputationScore",
]);

/** snake_case варианты полей из API (лидерборд/профиль могут приходить в snake_case) */
const MERGE_KEY_SNAKE: Record<string, string> = {
  chaptersRead: "chapters_read",
  readingTimeMinutes: "reading_time_minutes",
  readingTime: "reading_time",
  ratingsCount: "ratings_count",
  commentsCount: "comments_count",
  titlesReadCount: "titles_read_count",
  completedTitlesCount: "completed_titles_count",
  currentStreak: "current_streak",
  longestStreak: "longest_streak",
  lastStreakDate: "last_streak_date",
  likesReceivedCount: "likes_received_count",
  activityScore: "activity_score",
  reputationScore: "reputation_score",
  equippedDecorations: "equipped_decorations",
  lastActiveAt: "last_active_at",
};

function getMergeVal(record: Record<string, unknown>, key: string): unknown {
  const val = record[key];
  if (val !== undefined && val !== null) return val;
  const snake = MERGE_KEY_SNAKE[key];
  if (snake) return record[snake];
  return undefined;
}

function mergeLeaderboardWithHomepage(
  leaderboardUser: Record<string, unknown>,
  homepageUser: Record<string, unknown> | undefined
): TransformableUser {
  const merged = { ...leaderboardUser } as Record<string, unknown>;
  if (homepageUser) {
    const keysToMerge = [...MERGE_STAT_KEYS, ...MERGE_EXTRA_KEYS];
    for (const key of keysToMerge) {
      const leaderVal = getMergeVal(merged, key);
      const homeVal = getMergeVal(homepageUser, key);
      const isNumeric = NUMERIC_MERGE_KEYS.has(key as keyof TransformableUser);
      const useHome =
        leaderVal === undefined || leaderVal === null
          ? (homeVal !== undefined && homeVal !== null && (!isNumeric || (typeof homeVal === "number" && (homeVal as number) > 0)))
          : (typeof leaderVal === "number" && leaderVal === 0 && typeof homeVal === "number" && (homeVal as number) > 0);
      if (useHome && homeVal !== undefined && homeVal !== null) {
        merged[key] = homeVal;
      }
    }
  }
  for (const key of Object.keys(MERGE_KEY_SNAKE)) {
    if (merged[key] === undefined && merged[MERGE_KEY_SNAKE[key]] !== undefined) {
      merged[key] = merged[MERGE_KEY_SNAKE[key]];
    }
  }
  if (merged.readingTimeMinutes == null && merged.readingTime != null && typeof merged.readingTime === "number") {
    merged.readingTimeMinutes = merged.readingTime;
  }
  return merged as unknown as TransformableUser;
}

export default function LeadersPageClient() {
  const mounted = useMounted();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const categoryFromUrl = searchParams.get("category");
  const initialCategory: LeaderboardCategory =
    categoryFromUrl && VALID_CATEGORIES.includes(categoryFromUrl as LeaderboardCategory)
      ? (categoryFromUrl as LeaderboardCategory)
      : "level";
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>(initialCategory);

  useEffect(() => {
    if (categoryFromUrl && VALID_CATEGORIES.includes(categoryFromUrl as LeaderboardCategory)) {
      setActiveCategory(categoryFromUrl as LeaderboardCategory);
    }
  }, [categoryFromUrl]);
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdmins, setShowAdmins] = useState(true);
  const [leaderModalState, setLeaderModalState] = useState<{ user: LeaderboardUser; rank: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const supportsPeriod = activeCategory === "ratings" || activeCategory === "comments";

  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    isFetching: leaderboardFetching,
    error: leaderboardError,
  } = useGetLeaderboardQuery({ 
    category: activeCategory, 
    period: supportsPeriod ? activePeriod : "all",
    limit: 50 
  }, {
    refetchOnMountOrArgChange: true,
  });

  const {
    data: homepageUsersData,
    isLoading: homepageLoading,
  } = useGetHomepageActiveUsersQuery({
    limit: 100,
    days: 9999,
    sortBy: "level",
    sortOrder: "desc",
    requireAvatar: false,
    format: "extended",
  });

  const { data: allDecorations = [] } = useGetDecorationsQuery();

  const decorationsMap = useMemo(() => {
    const map = new Map<string, { imageUrl: string; rarity: DecorationRarity; type: string }>();
    for (const d of allDecorations) {
      if (d.id && d.imageUrl) {
        map.set(d.id, { imageUrl: d.imageUrl, rarity: d.rarity ?? "common", type: d.type });
      }
    }
    return map;
  }, [allDecorations]);

  const leaderboardUsers = useMemo<LeaderboardUser[]>(() => {
    const homepageUsers = (() => {
      const payload = homepageUsersData?.data;
      if (!payload) return [];
      if (Array.isArray(payload)) return payload;
      if ("users" in payload && Array.isArray(payload.users)) return payload.users;
      return [];
    })();

    const leaderboardUsersData = leaderboardData?.data?.users ?? [];
    const homepageById = new Map<string, Record<string, unknown>>();
    for (const u of homepageUsers) {
      homepageById.set(u._id, u as unknown as Record<string, unknown>);
    }

    const mergedUsers: TransformableUser[] = [];
    for (const u of leaderboardUsersData) {
      const home = homepageById.get(u._id);
      const merged = mergeLeaderboardWithHomepage(u as unknown as Record<string, unknown>, home);
      mergedUsers.push(merged);
    }

    if (mergedUsers.length > 0) {
      return transformUsersToLeaderboard(mergedUsers, activeCategory, decorationsMap);
    }

    return [];
  }, [leaderboardData, homepageUsersData, activeCategory, decorationsMap]);

  const isLoading = leaderboardLoading || leaderboardFetching || homepageLoading;
  const hasError = leaderboardError && leaderboardUsers.length === 0;

  const activeCategoryConfig = CATEGORIES.find(c => c.id === activeCategory);

  const filteredUsers = useMemo(() => {
    let users = leaderboardUsers;
    
    if (!showAdmins) {
      users = users.filter(u => u.role !== "admin" && u.role !== "moderator");
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      users = users.filter(u => u.username.toLowerCase().includes(query));
    }
    
    return users;
  }, [leaderboardUsers, searchQuery, showAdmins]);

  const userRankMap = useMemo(() => {
    const map = new Map<string, number>();
    leaderboardUsers.forEach((u, index) => {
      map.set(u._id, index + 1);
    });
    return map;
  }, [leaderboardUsers]);

  const currentUserRank = useMemo(() => {
    if (!user?._id) return null;
    return userRankMap.get(user._id) ?? null;
  }, [userRankMap, user?._id]);

  const currentUserData = useMemo(() => {
    if (!user?._id) return null;
    return leaderboardUsers.find(u => u._id === user._id) || null;
  }, [leaderboardUsers, user?._id]);

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="flex flex-col items-center justify-center gap-6">
          <LoadingSkeleton />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen flex flex-col py-6 sm:py-8">
        <div className="w-full max-w-2xl mx-auto px-4 space-y-4">
          <header>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Лидеры</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              {activeCategoryConfig?.description ?? "Рейтинг активных читателей"}
            </p>
          </header>

          <div
            className="flex flex-wrap gap-1.5 p-1 rounded-lg bg-[var(--secondary)]/50 border border-[var(--border)] w-full sm:w-fit"
            role="tablist"
            aria-label="Категории рейтинга"
          >
            {CATEGORIES.map(category => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveCategory(category.id);
                    setSearchQuery("");
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("category", category.id);
                    router.replace(`${pathname}?${params.toString()}`);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{category.label}</span>
                  <span className="sm:hidden">{category.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {supportsPeriod && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
              <div className="flex gap-0.5">
                {PERIODS.map(period => (
                  <button
                    key={period.id}
                    onClick={() => setActivePeriod(period.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      activePeriod === period.id
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--secondary)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {period.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск по нику"
                className="w-full pl-8 pr-8 py-2 rounded-lg text-sm bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                aria-label="Поиск пользователя"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  aria-label="Очистить поиск"
                >
                  ×
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowAdmins(!showAdmins)}
              className={`shrink-0 p-2 rounded-lg border border-[var(--border)] transition-colors ${
                showAdmins ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              title={showAdmins ? "Скрыть админов" : "Показать админов"}
              aria-pressed={!showAdmins}
            >
              {showAdmins ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {user && currentUserRank && currentUserData && !searchQuery && (
            <div className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-[var(--secondary)]/50 border border-[var(--border)]">
              <span className="w-7 h-7 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-semibold shrink-0">
                {currentUserRank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[var(--foreground)] truncate">
                  Вы · {getCategoryDisplayValue(currentUserData, activeCategory)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div ref={listRef} className="w-full max-w-2xl mx-auto px-4 mt-6">
          {isLoading ? (
            <LeaderboardSkeleton />
          ) : hasError ? (
            <ErrorState />
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-3">
              {!searchQuery && filteredUsers.slice(0, 3).length > 0 && (
                <div className="mb-6 max-w-lg mx-auto pb-2">
                  <div className="flex items-end justify-center gap-0 sm:gap-1">
                    {[2, 1, 3].map((rank) => {
                      const idx = rank - 1;
                      const u = filteredUsers[idx];
                      if (!u) return null;
                      const blockHeight = rank === 1 ? "h-24 sm:h-28 md:h-32" : rank === 2 ? "h-20 sm:h-24 md:h-26" : "h-16 sm:h-20 md:h-24";
                      const avatarWrapperSize = rank === 1 ? "w-[5.5rem] sm:w-[7.7rem] md:w-[9rem]" : rank === 2 ? "w-[4.5rem] sm:w-[6rem] md:w-[7rem]" : "w-16 sm:w-20 md:w-[5.5rem]";
                      const borderClass = rank === 1 ? "border-yellow-400" : rank === 2 ? "border-slate-400" : "border-amber-500";
                      const StatIcon = getCategoryIcon(activeCategory);
                      const frameUrl = getLeaderFrameUrl(u);
                      return (
                        <div key={u._id} className="flex flex-col items-center flex-1 max-w-[150px] sm:max-w-[180px]">
                          <div className="flex items-center justify-center gap-1 w-full mb-0.5 px-0.5 -mt-0.5">
                            <p
                              className={`text-xs sm:text-sm font-semibold truncate text-center ${isPremiumActive(u.subscriptionExpiresAt) ? "text-amber-500" : "text-[var(--foreground)]"}`}
                              title={u.username}
                            >
                              {u.username}
                            </p>
                            {isPremiumActive(u.subscriptionExpiresAt) && (
                              <PremiumBadge size="xs" className="shrink-0" ariaLabel="Премиум-подписчик" />
                            )}
                          </div>
                          <div className={`relative ${avatarWrapperSize} aspect-[1/1.15] z-10 flex justify-center items-center shrink-0`}>
                            <div className="relative w-full aspect-square max-w-full shrink-0 min-w-0 transition-transform duration-200 hover:scale-105 origin-center cursor-pointer" style={{ aspectRatio: "1 / 1" }}>
                              <button
                                type="button"
                                onClick={() => setLeaderModalState({ user: u, rank })}
                                className={`relative rounded-full border-2 ${borderClass} overflow-hidden bg-[var(--secondary)] shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 w-full h-full block aspect-square`}
                              >
                                <img
                                  src={getLeaderAvatarUrl(u)}
                                  alt={u.username}
                                  className="w-full h-full object-cover aspect-square min-w-full min-h-full"
                                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                                />
                              </button>
                              {frameUrl && (
                                <img
                                  src={frameUrl}
                                  alt=""
                                  className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none object-contain z-10"
                                  style={{ maxWidth: "none", maxHeight: "none" }}
                                  aria-hidden
                                />
                              )}
                            </div>
                          </div>
                          <div
                            className={`w-full ${blockHeight} mt-0 flex flex-col rounded-t-lg overflow-hidden shadow-md border border-b-0 border-rose-600/80 bg-rose-500/90 dark:bg-rose-600/80 dark:border-rose-500/70`}
                            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 6px -1px rgba(0,0,0,0.2)" }}
                          >
                            <div className="flex-1 flex items-center justify-center min-h-0 pt-1">
                              <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-md select-none" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                                {rank}
                              </span>
                            </div>
                            <div className="px-1.5 pb-1.5 pt-1 flex items-center justify-center gap-1 min-h-0 bg-rose-700/50 dark:bg-rose-800/50 backdrop-blur-[1px]">
                              <StatIcon className="w-3.5 h-3.5 shrink-0 text-white" />
                              <span className="text-[10px] sm:text-xs font-semibold text-white truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }} title={getCategoryDisplayValue(u, activeCategory)}>
                                {getCategoryDisplayValue(u, activeCategory)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(searchQuery ? filteredUsers : filteredUsers.slice(3)).length > 0 && (
                <div className="space-y-2">
                  {(searchQuery ? filteredUsers : filteredUsers.slice(3)).map((userData, index) => {
                    const actualRank = searchQuery 
                      ? (userRankMap.get(userData._id) ?? index + 1)
                      : index + 4;
                    return (
                      <LeaderCard
                        key={userData._id}
                        user={userData}
                        rank={actualRank}
                        category={activeCategory}
                        isCurrentUser={userData._id === user?._id}
                        showAnimation
                        animationDelay={Math.min(index * 50, 500)}
                        onClick={() => setLeaderModalState({ user: userData, rank: actualRank })}
                      />
                    );
                  })}
                </div>
              )}

              {leaderModalState && (
                <PodiumUserModal
                  user={leaderModalState.user}
                  rank={leaderModalState.rank}
                  category={activeCategory}
                  isCurrentUser={leaderModalState.user._id === user?._id}
                  onClose={() => setLeaderModalState(null)}
                />
              )}
            </div>
          ) : searchQuery && filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4 opacity-50" />
              <p className="text-[var(--muted-foreground)]">Пользователь не найден</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-2">
                Попробуйте изменить поисковый запрос
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="relative inline-block mb-4">
                <Users className="w-16 h-16 text-[var(--muted-foreground)] mx-auto" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center">
                  <span className="text-[var(--primary-foreground)] text-xs">?</span>
                </div>
              </div>
              <p className="text-[var(--muted-foreground)] font-medium">Нет данных для отображения</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-2">
                Скоро здесь появятся лидеры сообщества
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-4">
                Начните читать, ставить оценки и комментировать, чтобы попасть в рейтинг!
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function getCategoryIcon(category: LeaderboardCategory) {
  const config = CATEGORIES.find(c => c.id === category);
  if (config) return config.icon;
  return TrendingUp;
}

function getRarityGlowClass(rarity: DecorationRarity | null | undefined): string {
  if (rarity === "legendary") return "rarity-legendary";
  if (rarity === "epic") return "rarity-epic";
  if (rarity === "rare") return "rarity-rare";
  return "";
}

/** Поля статистики для подстановки из профиля, если в лидерборде их нет (вкладки «По оценкам» / «По комментариям») */
const MODAL_STAT_KEYS: (keyof LeaderboardUser)[] = [
  "level", "experience", "chaptersRead", "readingTimeMinutes", "readingTime",
  "ratingsCount", "commentsCount", "titlesReadCount", "completedTitlesCount",
  "currentStreak", "longestStreak", "likesReceivedCount",
  "avatar", "equippedDecorations", "subscriptionExpiresAt",
];

/** Соответствие camelCase → snake_case для полей из API (профиль может приходить в snake_case) */
const MODAL_STAT_KEY_SNAKE: Record<string, string> = {
  chaptersRead: "chapters_read",
  readingTimeMinutes: "reading_time_minutes",
  readingTime: "reading_time",
  ratingsCount: "ratings_count",
  commentsCount: "comments_count",
  titlesReadCount: "titles_read_count",
  completedTitlesCount: "completed_titles_count",
  currentStreak: "current_streak",
  longestStreak: "longest_streak",
  likesReceivedCount: "likes_received_count",
  subscriptionExpiresAt: "subscription_expires_at",
};

/** Дополнительные варианты ключей для полей (бэкенд может использовать другие имена) */
const MODAL_STAT_EXTRA_KEYS: Record<string, string[]> = {
  commentsCount: ["comment_count", "total_comments", "totalComments"],
  ratingsCount: ["rating_count", "total_ratings", "totalRatings"],
};

function getProfileVal(profile: Record<string, unknown>, key: string): unknown {
  const val = profile[key];
  if (val !== undefined && val !== null) return val;
  const snake = MODAL_STAT_KEY_SNAKE[key];
  if (snake) {
    const snakeVal = profile[snake];
    if (snakeVal !== undefined && snakeVal !== null) return snakeVal;
  }
  const stats = profile.stats ?? profile.statistics;
  if (stats && typeof stats === "object" && !Array.isArray(stats)) {
    const statObj = stats as Record<string, unknown>;
    const s = statObj[key];
    if (s !== undefined && s !== null) return s;
    if (snake) {
      const snakeVal = statObj[snake];
      if (snakeVal !== undefined && snakeVal !== null) return snakeVal;
    }
    for (const extra of MODAL_STAT_EXTRA_KEYS[key] ?? []) {
      const ev = statObj[extra];
      if (ev !== undefined && ev !== null) return ev;
    }
  }
  for (const extra of MODAL_STAT_EXTRA_KEYS[key] ?? []) {
    const ev = profile[extra];
    if (ev !== undefined && ev !== null) return ev;
  }
  if (key === "commentsCount") {
    const fromCounts = (profile.counts as Record<string, unknown>)?.comments ?? (profile.counts as Record<string, unknown>)?.comments_count;
    if (fromCounts !== undefined && fromCounts !== null) return fromCounts;
    const fromActivity = (profile.activity as Record<string, unknown>)?.commentsCount ?? (profile.activity as Record<string, unknown>)?.comments_count;
    if (fromActivity !== undefined && fromActivity !== null) return fromActivity;
  }
  return undefined;
}

/** Считает число прочитанных глав из readingHistory (профиль может не отдавать chaptersRead отдельно) */
function getChaptersReadFromProfile(profile: Record<string, unknown>): number | undefined {
  const raw = profile.readingHistory ?? profile.reading_history;
  if (!Array.isArray(raw)) return undefined;
  let total = 0;
  for (const item of raw) {
    const chapters = (item as Record<string, unknown>)?.chapters;
    if (Array.isArray(chapters)) total += chapters.length;
  }
  return total > 0 ? total : undefined;
}

const NUMERIC_MODAL_STAT_KEYS = new Set([
  "level", "experience", "chaptersRead", "readingTimeMinutes", "readingTime",
  "ratingsCount", "commentsCount", "titlesReadCount", "completedTitlesCount",
  "currentStreak", "longestStreak", "likesReceivedCount",
]);

function mergeLeaderForModal(leader: LeaderboardUser, profile: Record<string, unknown> | undefined): LeaderboardUser {
  if (!profile) return leader;
  const merged = { ...leader } as Record<string, unknown>;
  for (const key of MODAL_STAT_KEYS) {
    const leaderVal = merged[key];
    let profileVal = getProfileVal(profile, key);
    if (key === "chaptersRead" && (profileVal === undefined || profileVal === null)) {
      profileVal = getChaptersReadFromProfile(profile);
    }
    const isNumeric = NUMERIC_MODAL_STAT_KEYS.has(key);
    if (isNumeric && typeof profileVal === "string") {
      const n = Number(profileVal);
      if (!Number.isNaN(n)) profileVal = n;
    }
    const leaderMissing = leaderVal === undefined || leaderVal === null;
    const leaderZero = isNumeric && typeof leaderVal === "number" && leaderVal === 0;
    const profileHasValue = profileVal !== undefined && profileVal !== null;
    const profilePositive = !isNumeric || (typeof profileVal === "number" && (profileVal as number) > 0);
    if (profileHasValue && (leaderMissing || (leaderZero && profilePositive))) {
      merged[key] = profileVal;
    }
  }
  return merged as LeaderboardUser;
}

function PodiumUserModal({
  user,
  rank,
  category,
  isCurrentUser,
  onClose,
}: {
  user: LeaderboardUser;
  rank: number;
  category: LeaderboardCategory;
  isCurrentUser: boolean;
  onClose: () => void;
}) {
  const [showCardOnly, setShowCardOnly] = useState(false);
  const { data: profileResponse } = useGetProfileByIdQuery(user._id);
  const profileData = profileResponse?.success && profileResponse?.data ? (profileResponse.data as unknown as Record<string, unknown>) : undefined;
  const displayUser = useMemo(() => mergeLeaderForModal(user, profileData), [user, profileData]);

  const { positions: allPositions } = useUserLeaderboardPositions(user._id);
  const topPositionByCategory = useMemo(() => {
    const map = new Map<LeaderboardCategory, number>();
    map.set(category, rank);
    allPositions.forEach((p) => map.set(p.category, p.position));
    return map;
  }, [category, rank, allPositions]);

  const isTop3 = rank >= 1 && rank <= 3;
  const borderClass = isTop3
    ? rank === 1 ? "border-yellow-400" : rank === 2 ? "border-slate-400" : "border-amber-500"
    : "border-[var(--border)]";
  const badgeBgClass = isTop3
    ? rank === 1 ? "from-yellow-400/90 to-amber-500/90" : rank === 2 ? "from-slate-400/90 to-slate-500/90" : "from-amber-500/90 to-orange-600/90"
    : "from-[var(--muted)] to-[var(--muted)]";
  const badgeTextClass = isTop3 ? "text-white" : "text-[var(--foreground)]";
  const level = displayUser.level ?? 0;
  const cardUrl = getEquippedCardUrl(displayUser.equippedDecorations as EquippedDecorations | null);
  const frameUrl = getLeaderFrameUrl(displayUser);
  const cardRarity = displayUser.equippedDecorations?.cardRarity ?? displayUser.equippedDecorations?.frameRarity ?? null;
  const rarityGlowClass = getRarityGlowClass(cardRarity);

  type StatItem = { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; category?: LeaderboardCategory; categories?: LeaderboardCategory[] };
  const stats: StatItem[] = [];
  if (displayUser.level != null) stats.push({ icon: Trophy, label: "Уровень", value: displayUser.level, category: "level" });
  if (displayUser.experience != null) stats.push({ icon: TrendingUp, label: "Опыт", value: displayUser.experience.toLocaleString("ru") + " XP" });
  if (displayUser.chaptersRead != null) {
    const chapters = displayUser.chaptersRead ?? 0;
    stats.push({ icon: BookOpen, label: "Глав прочитано", value: `${chapters.toLocaleString("ru")} глав`, categories: ["chaptersRead"] });
  }
  if (displayUser.ratingsCount != null) stats.push({ icon: Star, label: "Оценок", value: displayUser.ratingsCount.toLocaleString("ru"), category: "ratings" });
  if (displayUser.commentsCount != null) stats.push({ icon: MessageSquare, label: "Комментариев", value: displayUser.commentsCount.toLocaleString("ru"), category: "comments" });
  if (displayUser.titlesReadCount != null) stats.push({ icon: BookOpen, label: "Тайтлов прочитано", value: displayUser.titlesReadCount.toLocaleString("ru") });
  if (displayUser.completedTitlesCount != null && displayUser.completedTitlesCount > 0) stats.push({ icon: Trophy, label: "Завершено тайтлов", value: displayUser.completedTitlesCount.toLocaleString("ru") });
  if (displayUser.currentStreak != null && displayUser.currentStreak > 0) stats.push({ icon: Flame, label: "Серия дней", value: `${displayUser.currentStreak} ${displayUser.currentStreak === 1 ? "день" : displayUser.currentStreak < 5 ? "дня" : "дней"}`, category: "streak" });
  if (displayUser.longestStreak != null && displayUser.longestStreak > 0) stats.push({ icon: Flame, label: "Рекорд серии", value: `${displayUser.longestStreak} дн.`, category: "streak" });
  if (displayUser.likesReceivedCount != null && displayUser.likesReceivedCount > 0) stats.push({ icon: Heart, label: "Лайков получено", value: displayUser.likesReceivedCount.toLocaleString("ru") });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="podium-modal-title"
    >
      <div
        className={`relative w-auto max-w-[calc(100vw-2rem)] rounded-2xl border shadow-xl aspect-[9/19] flex flex-col overflow-hidden bg-[var(--card)] ${rarityGlowClass} ${cardRarity && cardRarity !== "common" ? "border-2" : ""} ${cardRarity === "legendary" ? "border-amber-400/80" : cardRarity === "epic" ? "border-purple-500/70" : cardRarity === "rare" ? "border-blue-500/70" : "border-[var(--border)]"}`}
        style={{ height: "clamp(450px, 70vh, 70vh)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {cardUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ backgroundImage: `url(${cardUrl})` }}
            aria-hidden
          />
        )}
        <header className="relative z-10 flex items-center justify-between gap-2 px-3 pt-2 pb-0.5 shrink-0 bg-transparent">
          {!showCardOnly && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r ${badgeBgClass} ${badgeTextClass} shadow-sm shrink-0`}>
              <span className="text-xs font-bold">{rank}</span>
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={() => setShowCardOnly((v) => !v)}
              className="p-1.5 rounded-md bg-[var(--card)]/80 backdrop-blur-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors shrink-0"
              aria-label={showCardOnly ? "Показать всё" : "Только карточка"}
              title={showCardOnly ? "Показать всё" : "Только карточка"}
            >
              {showCardOnly ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md bg-[var(--card)]/80 backdrop-blur-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors shrink-0"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {!showCardOnly && (
        <div className="relative z-10 flex flex-col flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col items-center text-center pt-0 px-3 pb-2 bg-transparent shrink-0">
            <div className="p-4 shrink-0">
              <div className="relative w-20 h-20 shrink-0">
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <img
                    src={getLeaderAvatarUrl(displayUser)}
                    alt=""
                    className={`w-full h-full rounded-full object-cover aspect-square min-w-full min-h-full border-2 ${borderClass} shadow-md bg-[var(--secondary)]`}
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                  />
                </div>
                {frameUrl && (
                  <img
                    src={frameUrl}
                    alt=""
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] pointer-events-none object-contain z-10"
                    style={{ maxWidth: "none", maxHeight: "none" }}
                    aria-hidden
                  />
                )}
              </div>
            </div>
            <h2 id="podium-modal-title" className="mt-1.5 text-lg font-semibold truncate max-w-full px-1">
              <span className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--card)]/90 backdrop-blur-sm shadow-sm ${isPremiumActive(displayUser.subscriptionExpiresAt) ? "text-amber-500" : "text-[var(--foreground)]"}`}>
                {displayUser.username}
                {isPremiumActive(displayUser.subscriptionExpiresAt) && (
                  <PremiumBadge size="xs" className="shrink-0" ariaLabel="Премиум-подписчик" />
                )}
              </span>
            </h2>
            {displayUser.role && displayUser.role !== "user" && (
              <span className="mt-0.5 text-[11px] px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)] capitalize">
                {displayUser.role}
              </span>
            )}
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
              <span className="inline-block px-2.5 py-1 rounded-md bg-[var(--card)]/90 backdrop-blur-sm shadow-sm">
                {getRankDisplay(level).split("  ")[0]}
              </span>
            </p>
          </div>

          <div className="flex-1 min-h-0" aria-hidden />

          <div className="relative z-10 px-3 pb-3 pt-2 flex flex-col gap-3 shrink-0">
            {stats.length > 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-sm px-3 py-2.5">
                <p className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1.5 px-0.5">
                  Показатели
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                  {stats.map(({ icon: Icon, label, value, category: statCategory, categories: statCategories }) => {
                    const cats = statCategories ?? (statCategory ? [statCategory] : []);
                    const positions = cats.map((c) => topPositionByCategory.get(c)).filter((p): p is number => p != null);
                    const bestPos = positions.length > 0 ? Math.min(...positions) : null;
                    return (
                      <div key={label} className="flex items-start gap-1.5 min-w-0">
                        <Icon className="w-3 h-3 shrink-0 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 text-left overflow-hidden">
                          <p className="text-[10px] text-[var(--muted-foreground)] leading-tight truncate" title={label}>{label}</p>
                          <p className="text-[11px] font-semibold text-[var(--foreground)] leading-tight flex flex-wrap items-center gap-x-1 gap-y-0.5">
                            <span className="truncate max-w-full">{value}</span>
                            {bestPos != null && (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-medium shrink-0" title={`Топ ${bestPos}`}>
                                <Trophy className="w-2.5 h-2.5" aria-hidden />
                                {bestPos}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col items-center gap-1">
              <Link
                href={`/user/${displayUser._id}`}
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition-opacity text-sm"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                Посмотреть профиль
              </Link>
              {isCurrentUser && (
                <span className="text-[11px] text-[var(--muted-foreground)]">Это вы</span>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

function formatReadingTimeDisplay(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
  return `${Math.floor(minutes / 1440)} д ${Math.floor((minutes % 1440) / 60)} ч`;
}

function getCategoryDisplayValue(user: LeaderboardUser, category: LeaderboardCategory): string {
  switch (category) {
    case "level":
      return `Уровень ${user.level ?? 0}`;
    case "chaptersRead":
      const chapters = user.chaptersRead ?? 0;
      const readingMinutes = user.readingTimeMinutes ?? user.readingTime ?? chapters * 2;
      return `${chapters} глав · ${formatReadingTimeDisplay(readingMinutes)}`;
    case "readingTime":
      const minutes = user.readingTimeMinutes ?? user.readingTime ?? 0;
      if (minutes < 60) return `${minutes} мин`;
      if (minutes < 1440) return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
      return `${Math.floor(minutes / 1440)} д ${Math.floor((minutes % 1440) / 60)} ч`;
    case "ratings":
      return `${user.ratingsCount ?? 0} оценок`;
    case "comments":
      return `${user.commentsCount ?? 0} комментариев`;
    case "streak":
      const streak = user.currentStreak ?? 0;
      const days = streak === 1 ? "день" : streak < 5 ? "дня" : "дней";
      return `${streak} ${days} 🔥`;
    default:
      return "";
  }
}

function LeaderboardSkeleton() {
  const podiumBlockHeight = ["h-20 sm:h-24 md:h-26", "h-24 sm:h-28 md:h-32", "h-16 sm:h-20 md:h-24"];
  const avatarWrapperSize = [
    "w-[4.5rem] sm:w-[6rem] md:w-[7rem]",
    "w-[5.5rem] sm:w-[7.7rem] md:w-[9rem]",
    "w-16 sm:w-20 md:w-[5.5rem]",
  ];
  return (
    <div className="space-y-4 animate-pulse">
      <div className="mb-6 max-w-lg mx-auto pb-2">
        <div className="flex items-end justify-center gap-0 sm:gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center flex-1 max-w-[150px] sm:max-w-[180px]">
              <div className="h-3 w-16 sm:w-20 bg-[var(--muted)] rounded mb-0.5 mx-0.5" />
              <div className={`relative ${avatarWrapperSize[i]} aspect-[1/1.15] z-10 flex justify-center items-center shrink-0`}>
                <div className="w-full aspect-square rounded-full bg-[var(--muted)] max-w-full shrink-0" />
              </div>
              <div
                className={`w-full ${podiumBlockHeight[i]} mt-0 flex flex-col rounded-t-lg overflow-hidden border border-b-0 border-[var(--border)] bg-[var(--muted)]`}
              >
                <div className="flex-1 flex items-center justify-center min-h-0 pt-1">
                  <div className="w-6 h-8 sm:w-8 sm:h-10 bg-[var(--secondary)] rounded" />
                </div>
                <div className="px-1.5 pb-1.5 pt-1 flex items-center justify-center gap-1 min-h-0">
                  <div className="w-3.5 h-3.5 rounded bg-[var(--secondary)]" />
                  <div className="h-3 w-12 sm:w-14 bg-[var(--secondary)] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4">
            <div className="w-9 h-9 rounded-lg bg-[var(--muted)] shrink-0" />
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--muted)] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="w-24 h-4 bg-[var(--muted)] rounded" />
              <div className="w-16 h-3 bg-[var(--muted)] rounded mt-1.5" />
            </div>
            <div className="w-20 h-7 bg-[var(--muted)] rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
