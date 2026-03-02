"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Crown, TrendingUp, Star, Users, Flame, Search, RefreshCw, ChevronUp, Shield, Eye, EyeOff, Calendar, MessageSquare } from "lucide-react";

import { Footer, Header } from "@/widgets";
import { LoadingSkeleton, ErrorState } from "@/shared";
import LeaderCard from "@/shared/leader-card/LeaderCard";
import {
  useGetLeaderboardQuery,
  LeaderboardCategory,
  LeaderboardPeriod,
  LeaderboardUser,
} from "@/store/api/leaderboardApi";
import { useGetHomepageActiveUsersQuery } from "@/store/api/usersApi";
import { useGetDecorationsQuery } from "@/store/api/shopApi";
import { useSEO } from "@/hooks/useSEO";
import { useMounted } from "@/hooks/useMounted";
import { useAuth } from "@/hooks/useAuth";
import { getDecorationImageUrl } from "@/api/shop";

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
  avatar?: string | null;
  frame?: string | null;
  background?: string | null;
  card?: string | null;
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

function resolveDecorationValue(
  value: string | null | undefined,
  decorationsMap: Map<string, string>
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return getDecorationImageUrl(trimmed) || trimmed;
  }
  
  if (/^[a-f0-9]{24}$/i.test(trimmed)) {
    const imageUrl = decorationsMap.get(trimmed);
    if (imageUrl) {
      return getDecorationImageUrl(imageUrl) || imageUrl;
    }
    return null;
  }
  
  return getDecorationImageUrl(trimmed) || null;
}

function resolveEquippedDecorations(
  equipped: TransformableUserEquipped | null | undefined,
  decorationsMap: Map<string, string>
): TransformableUserEquipped | null {
  if (!equipped) return null;
  
  return {
    avatar: resolveDecorationValue(equipped.avatar, decorationsMap),
    frame: resolveDecorationValue(equipped.frame, decorationsMap),
    background: resolveDecorationValue(equipped.background, decorationsMap),
    card: resolveDecorationValue(equipped.card, decorationsMap),
  };
}

function transformUsersToLeaderboard(
  users: TransformableUser[],
  category: LeaderboardCategory,
  decorationsMap: Map<string, string>
): LeaderboardUser[] {
  // Фильтруем пользователей, которые скрыли свою статистику
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

export default function LeadersPage() {
  const mounted = useMounted();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>("level");
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showAdmins, setShowAdmins] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const isCurrentUserAdmin = user?.role === "admin" || user?.role === "moderator";
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
    const map = new Map<string, string>();
    for (const d of allDecorations) {
      if (d.id && d.imageUrl) {
        map.set(d.id, d.imageUrl);
      }
    }
    return map;
  }, [allDecorations]);

  useSEO({
    title: `Лидеры ${CATEGORIES.find(c => c.id === activeCategory)?.label} - Tomilo-lib.ru`,
    description: "Таблица лидеров. Топ пользователей по уровню, времени чтения, оценкам и комментариям.",
    keywords: "лидеры, рейтинг, топ пользователей, таблица лидеров, читатели",
    type: "website",
  });

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
      <main className="flex flex-col items-center justify-center gap-6 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2 flex items-center justify-center gap-3">
            <Crown className="w-8 h-8 text-yellow-500 animate-pulse" />
            Таблица лидеров
          </h1>
          <p className="text-[var(--muted-foreground)]">
            {activeCategoryConfig?.description ?? "Лучшие пользователи сообщества"}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-[var(--muted-foreground)]">
            <RefreshCw className="w-3 h-3" />
            <span>Обновляется каждый час</span>
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {CATEGORIES.map(category => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id);
                    setSearchQuery("");
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                    ${isActive
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg scale-105"
                      : "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--secondary)]/80 hover:scale-[1.02]"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                  <span className="sm:hidden">{category.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {supportsPeriod && (
            <div className="flex justify-center gap-2 mb-4">
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
                <Calendar className="w-4 h-4 ml-2 text-[var(--muted-foreground)]" />
                {PERIODS.map(period => (
                  <button
                    key={period.id}
                    onClick={() => setActivePeriod(period.id)}
                    className={`
                      px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                      ${activePeriod === period.id
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                        : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                      }
                    `}
                  >
                    <span className="hidden sm:inline">{period.label}</span>
                    <span className="sm:hidden">{period.shortLabel}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <div className={`
              relative w-full sm:w-80 transition-all duration-200
              ${isSearchFocused ? "sm:w-96" : ""}
            `}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Поиск пользователя..."
                className="
                  w-full pl-10 pr-4 py-2.5 rounded-xl border-2 text-sm
                  bg-[var(--secondary)] border-[var(--border)] text-[var(--foreground)]
                  placeholder:text-[var(--muted-foreground)]
                  focus:border-[var(--primary)] focus:outline-none
                  transition-all duration-200
                "
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  ×
                </button>
              )}
            </div>

            {isCurrentUserAdmin && (
              <button
                onClick={() => setShowAdmins(!showAdmins)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                  border-2
                  ${showAdmins
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                    : "bg-[var(--secondary)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--primary)]/50"
                  }
                `}
                title={showAdmins ? "Скрыть админов" : "Показать админов"}
              >
                <Shield className="w-4 h-4" />
                {showAdmins ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="hidden sm:inline">{showAdmins ? "Скрыть админов" : "Показать админов"}</span>
              </button>
            )}
          </div>

          {user && currentUserRank && currentUserData && !searchQuery && (
            <div className="mb-6 p-4 rounded-2xl border-2 border-[var(--primary)]/30 bg-[var(--primary)]/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm bg-[var(--primary)] text-[var(--primary-foreground)]">
                    #{currentUserRank}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">Ваша позиция</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {currentUserRank <= 10 ? "🎉 Вы в топ-10!" : currentUserRank <= 50 ? "👍 Вы в топ-50!" : "Продолжайте в том же духе!"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--foreground)]">
                    {getCategoryDisplayValue(currentUserData, activeCategory)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div ref={listRef} className="w-full max-w-4xl mx-auto px-4">
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
            onClick={scrollToTop}
            className="
              fixed bottom-6 right-6 z-50 p-3 rounded-full
              bg-[var(--primary)] text-[var(--primary-foreground)]
              shadow-lg hover:shadow-xl transition-all duration-200
              hover:scale-110 animate-fade-in
            "
            aria-label="Наверх"
          >
            <ChevronUp className="w-5 h-5" />
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
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`
              rounded-2xl border-2 border-[var(--border)] bg-[var(--card)] p-6
              ${i === 0 ? "md:order-2" : i === 1 ? "md:order-1 md:mt-4" : "md:order-3 md:mt-4"}
            `}
          >
            <div className="flex flex-col items-center">
              <div className={`w-${i === 0 ? "24" : "20"} h-${i === 0 ? "24" : "20"} rounded-full bg-[var(--muted)]`} />
              <div className="w-32 h-5 bg-[var(--muted)] rounded mt-4" />
              <div className="w-24 h-4 bg-[var(--muted)] rounded mt-2" />
              <div className="w-28 h-8 bg-[var(--muted)] rounded-xl mt-4" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="space-y-2">
        {[4, 5, 6, 7, 8].map(i => (
          <div key={i} className="flex items-center gap-4 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] p-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--muted)]" />
            <div className="w-12 h-12 rounded-full bg-[var(--muted)]" />
            <div className="flex-1">
              <div className="w-32 h-4 bg-[var(--muted)] rounded" />
              <div className="w-20 h-3 bg-[var(--muted)] rounded mt-2" />
            </div>
            <div className="w-24 h-8 bg-[var(--muted)] rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
