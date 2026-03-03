"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { TrendingUp, Star, Users, Flame, Search, ChevronUp, Eye, EyeOff, Calendar, MessageSquare } from "lucide-react";

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
import { useGetDecorationsQuery } from "@/store/api/shopApi";
import { useMounted } from "@/hooks/useMounted";
import { useAuth } from "@/hooks/useAuth";
import { getDecorationImageUrl, type DecorationRarity } from "@/api/shop";

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

export default function LeadersPageClient() {
  const mounted = useMounted();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>("level");
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showAdmins, setShowAdmins] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const supportsPeriod = activeCategory === "ratings" || activeCategory === "comments";

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

    const allUsersMap = new Map<string, TransformableUser>();
    
    for (const u of homepageUsers) {
      allUsersMap.set(u._id, u as TransformableUser);
    }

    for (const u of leaderboardUsersData) {
      if (!allUsersMap.has(u._id)) {
        allUsersMap.set(u._id, u as TransformableUser);
      } else {
        const existing = allUsersMap.get(u._id)!;
        allUsersMap.set(u._id, { ...existing, ...u } as TransformableUser);
      }
    }

    const mergedUsers = Array.from(allUsersMap.values());

    if (mergedUsers.length > 0) {
      return transformUsersToLeaderboard(mergedUsers, activeCategory, decorationsMap).slice(0, 50);
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
                  onClick={() => { setActiveCategory(category.id); setSearchQuery(""); }}
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
                #{currentUserRank}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="md:order-2">
                    <LeaderCard
                      user={filteredUsers[0]}
                      rank={1}
                      category={activeCategory}
                      isCurrentUser={filteredUsers[0]._id === user?._id}
                      showAnimation
                      animationDelay={0}
                    />
                  </div>
                  {filteredUsers[1] && (
                    <div className="md:order-1 md:mt-8 md:scale-90 origin-top">
                      <LeaderCard
                        user={filteredUsers[1]}
                        rank={2}
                        category={activeCategory}
                        isCurrentUser={filteredUsers[1]._id === user?._id}
                        showAnimation
                        animationDelay={100}
                      />
                    </div>
                  )}
                  {filteredUsers[2] && (
                    <div className="md:order-3 md:mt-8 md:scale-90 origin-top">
                      <LeaderCard
                        user={filteredUsers[2]}
                        rank={3}
                        category={activeCategory}
                        isCurrentUser={filteredUsers[2]._id === user?._id}
                        showAnimation
                        animationDelay={200}
                      />
                    </div>
                  )}
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
                      />
                    );
                  })}
                </div>
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

        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className="fixed bottom-5 right-5 z-50 p-2.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md hover:shadow-lg transition-shadow"
            aria-label="Наверх"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        )}
      </main>
      <Footer />
    </>
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
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] aspect-[9/16] ${i === 0 ? "md:order-2" : i === 1 ? "md:order-1 md:mt-6 md:scale-90" : "md:order-3 md:mt-6 md:scale-90"}`}
          >
            <div className="flex flex-col items-center justify-end h-full pb-4">
              <div className={`rounded-full bg-[var(--muted)] ${i === 0 ? "w-24 h-24" : "w-20 h-20"} mb-3`} />
              <div className="w-28 h-4 bg-[var(--muted)] rounded mb-2" />
              <div className="w-20 h-3 bg-[var(--muted)] rounded mb-3" />
              <div className="w-24 h-8 bg-[var(--muted)] rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--muted)] shrink-0" />
            <div className="w-10 h-10 rounded-full bg-[var(--muted)] shrink-0" />
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
