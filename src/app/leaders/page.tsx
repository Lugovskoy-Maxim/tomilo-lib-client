"use client";

import { useState, useMemo } from "react";
import { Crown, TrendingUp, Clock, Star, Users, Shield } from "lucide-react";

import { Footer, Header } from "@/widgets";
import { LoadingSkeleton, ErrorState } from "@/shared";
import LeaderCard from "@/shared/leader-card/LeaderCard";
import {
  useGetLeaderboardQuery,
  LeaderboardCategory,
  LeaderboardUser,
} from "@/store/api/leaderboardApi";
import { useGetHomepageActiveUsersQuery, useGetUsersQuery } from "@/store/api/usersApi";
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
    id: "readingTime",
    label: "По времени чтения",
    shortLabel: "Чтение",
    icon: Clock,
    description: "Самые активные читатели",
  },
  {
    id: "ratings",
    label: "По оценкам",
    shortLabel: "Оценки",
    icon: Star,
    description: "Больше всего оценённых тайтлов",
  },
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
  const mappedUsers = users.map(user => {
    const chaptersRead = user.readingHistory?.reduce(
      (total, item) => total + (item.chapters?.length || 0),
      0
    ) ?? 0;

    return {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      level: user.level ?? 0,
      experience: user.experience ?? 0,
      readingTime: chaptersRead * 2,
      chaptersRead,
      ratingsCount: user.bookmarks?.length ?? Math.floor((user.reputationScore ?? 0) * 0.5),
      commentsCount: Math.floor((user.activityScore ?? 0) * 0.3),
      equippedDecorations: resolveEquippedDecorations(user.equippedDecorations, decorationsMap),
    };
  });

  const sortedUsers = [...mappedUsers].sort((a, b) => {
    switch (category) {
      case "level":
        return (b.level ?? 0) - (a.level ?? 0) || (b.experience ?? 0) - (a.experience ?? 0);
      case "readingTime":
        return (b.readingTime ?? 0) - (a.readingTime ?? 0);
      case "ratings":
        return (b.ratingsCount ?? 0) - (a.ratingsCount ?? 0);
      case "comments":
        return (b.commentsCount ?? 0) - (a.commentsCount ?? 0);
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
  const [showAdmins, setShowAdmins] = useState(false);

  const isAdmin = user?.role === "admin";

  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    error: leaderboardError,
  } = useGetLeaderboardQuery({ category: activeCategory, limit: 50 });

  const {
    data: homepageUsersData,
    isLoading: homepageLoading,
  } = useGetHomepageActiveUsersQuery({
    limit: 100,
    days: 365,
    sortBy: "level",
    sortOrder: "desc",
    requireAvatar: false,
    format: "extended",
  });

  const {
    data: allUsersData,
    isLoading: allUsersLoading,
  } = useGetUsersQuery({
    page: 1,
    limit: 100,
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
    const shouldFilterAdmins = !showAdmins;

    if (leaderboardData?.data?.users && leaderboardData.data.users.length > 0) {
      const filtered = shouldFilterAdmins
        ? leaderboardData.data.users.filter(u => u.role !== "admin" && u.role !== "moderator")
        : leaderboardData.data.users;
      
      return filtered.slice(0, 50).map(u => ({
        ...u,
        equippedDecorations: resolveEquippedDecorations(u.equippedDecorations, decorationsMap),
      }));
    }

    const homepageUsers = (() => {
      const payload = homepageUsersData?.data;
      if (!payload) return [];
      if (Array.isArray(payload)) return payload;
      if ("users" in payload && Array.isArray(payload.users)) return payload.users;
      return [];
    })();

    const adminUsersData = allUsersData?.data?.users ?? [];

    const allUsersMap = new Map<string, TransformableUser>();
    
    for (const u of homepageUsers) {
      allUsersMap.set(u._id, u as TransformableUser);
    }
    
    for (const u of adminUsersData) {
      if (!allUsersMap.has(u._id)) {
        allUsersMap.set(u._id, u as TransformableUser);
      } else {
        const existing = allUsersMap.get(u._id)!;
        allUsersMap.set(u._id, { ...existing, ...u } as TransformableUser);
      }
    }

    const mergedUsers = Array.from(allUsersMap.values())
      .filter(u => shouldFilterAdmins ? (u.role !== "admin" && u.role !== "moderator") : true);

    if (mergedUsers.length > 0) {
      return transformUsersToLeaderboard(mergedUsers, activeCategory, decorationsMap).slice(0, 50);
    }

    return [];
  }, [leaderboardData, homepageUsersData, allUsersData, activeCategory, showAdmins, decorationsMap]);

  const isLoading = leaderboardLoading || homepageLoading || allUsersLoading;
  const hasError = leaderboardError && leaderboardUsers.length === 0;

  const activeCategoryConfig = CATEGORIES.find(c => c.id === activeCategory);

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
            <Crown className="w-8 h-8 text-yellow-500" />
            Таблица лидеров
          </h1>
          <p className="text-[var(--muted-foreground)]">
            {activeCategoryConfig?.description ?? "Лучшие пользователи сообщества"}
          </p>
        </div>

        <div className="w-full max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {CATEGORIES.map(category => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                    ${isActive
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg"
                      : "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--secondary)]/80"
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

          {isAdmin && (
            <div className="flex justify-center mb-8">
              <button
                onClick={() => setShowAdmins(!showAdmins)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  border-2
                  ${showAdmins
                    ? "bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400"
                    : "bg-[var(--secondary)] border-[var(--border)] text-[var(--muted-foreground)] hover:border-amber-500/50"
                  }
                `}
              >
                <Shield className="w-4 h-4" />
                <span>{showAdmins ? "Скрыть админов" : "Показать админов"}</span>
              </button>
            </div>
          )}
        </div>

        <div className="w-full max-w-4xl mx-auto px-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : hasError ? (
            <ErrorState />
          ) : leaderboardUsers.length > 0 ? (
            <div className="space-y-3">
              {leaderboardUsers.slice(0, 3).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {leaderboardUsers.slice(0, 3).map((user, index) => (
                    <LeaderCard
                      key={user._id}
                      user={user}
                      rank={index + 1}
                      category={activeCategory}
                    />
                  ))}
                </div>
              )}

              {leaderboardUsers.length > 3 && (
                <div className="space-y-2">
                  {leaderboardUsers.slice(3).map((user, index) => (
                    <LeaderCard
                      key={user._id}
                      user={user}
                      rank={index + 4}
                      category={activeCategory}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4" />
              <p className="text-[var(--muted-foreground)]">Нет данных для отображения</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-2">
                Скоро здесь появятся лидеры сообщества
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
