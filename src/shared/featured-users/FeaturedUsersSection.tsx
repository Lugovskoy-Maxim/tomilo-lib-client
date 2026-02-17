"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ShieldCheck, TrendingUp } from "lucide-react";
import { HomepageActiveUser, useGetHomepageActiveUsersQuery, useGetUsersQuery } from "@/store/api/usersApi";

type FeaturedUser = {
  id: string;
  username: string;
  avatar?: string;
  bio: string;
  role?: string;
  lastActiveDays: number;
  activityScore: number;
  reputationScore: number;
  isVerified: boolean;
  score?: number;
};

const MOCK_USERS: FeaturedUser[] = [
  {
    id: "u_1",
    username: "AoiReader",
    bio: "Собираю подборки романтики и комедии.",
    role: "user",
    lastActiveDays: 1,
    activityScore: 94,
    reputationScore: 92,
    isVerified: true,
  },
  {
    id: "u_2",
    username: "HanSeok",
    bio: "Читаю экшен и делаю полезные комментарии.",
    role: "user",
    lastActiveDays: 3,
    activityScore: 88,
    reputationScore: 84,
    isVerified: true,
  },
  {
    id: "u_3",
    username: "MikaFox",
    bio: "Новые главы каждый день, люблю фэнтези.",
    role: "user",
    lastActiveDays: 0,
    activityScore: 97,
    reputationScore: 81,
    isVerified: true,
  },
  {
    id: "u_4",
    username: "NightRain",
    bio: "Подсказываю скрытые тайтлы в жанре драма.",
    role: "user",
    lastActiveDays: 2,
    activityScore: 84,
    reputationScore: 90,
    isVerified: true,
  },
  {
    id: "u_5",
    username: "YunaPage",
    bio: "Оцениваю новинки и веду мини-обзоры.",
    role: "moderator",
    lastActiveDays: 6,
    activityScore: 72,
    reputationScore: 87,
    isVerified: true,
  },
  {
    id: "u_6",
    username: "KuroNeko",
    bio: "Манхва, приключения и мемы в комментариях.",
    role: "user",
    lastActiveDays: 4,
    activityScore: 79,
    reputationScore: 78,
    isVerified: true,
  },
  {
    id: "u_7",
    username: "TestBotCandidate",
    bio: "Технический профиль для проверки фильтров.",
    role: "admin",
    lastActiveDays: 2,
    activityScore: 90,
    reputationScore: 70,
    isVerified: false,
  },
];

function clampScore(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function getDaysSince(dateString?: string): number {
  if (!dateString) return 30;
  const value = new Date(dateString).getTime();
  if (Number.isNaN(value)) return 30;
  const diffMs = Date.now() - value;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function getFreshnessBoost(lastActiveDays: number): number {
  if (lastActiveDays <= 1) return 100;
  if (lastActiveDays <= 3) return 85;
  if (lastActiveDays <= 7) return 70;
  if (lastActiveDays <= 14) return 50;
  return 30;
}

function toFeaturedUsersFromHomepageEndpoint(users: HomepageActiveUser[]): FeaturedUser[] {
  return users.map(user => {
    const lastActiveDays =
      typeof user.lastActiveDays === "number"
        ? user.lastActiveDays
        : getDaysSince(user.lastActivityAt || user.lastActiveAt || user.updatedAt || user.createdAt);
    const userLevel = user.level || 1;

    return {
      id: user._id,
      username: user.username,
      avatar: user.avatar ? normalizeAvatarUrl(user.avatar) : undefined,
      bio: user.bio || `Уровень ${userLevel}`,
      role: user.role,
      lastActiveDays,
      activityScore:
        typeof user.activityScore === "number" ? clampScore(user.activityScore) : clampScore(100 - lastActiveDays * 4),
      reputationScore:
        typeof user.reputationScore === "number"
          ? clampScore(user.reputationScore)
          : clampScore((user.emailVerified ? 70 : 40) + Math.min(25, Math.floor(userLevel * 2.5))),
      isVerified: user.emailVerified ?? true,
    };
  });
}

function toFeaturedUsersFromAdminUsers(users: {
  _id: string;
  username: string;
  avatar?: string;
  role?: string;
  level?: number;
  createdAt?: string;
  updatedAt?: string;
}[]): FeaturedUser[] {
  return users.map(user => {
    const lastActiveDays = getDaysSince(user.updatedAt || user.createdAt);
    const userLevel = user.level || 1;

    return {
      id: user._id,
      username: user.username,
      avatar: user.avatar ? normalizeAvatarUrl(user.avatar) : undefined,
      bio: `Уровень ${userLevel}`,
      role: user.role,
      lastActiveDays,
      activityScore: clampScore(100 - lastActiveDays * 4),
      reputationScore: clampScore(45 + Math.min(30, userLevel * 3)),
      isVerified: true,
    };
  });
}

function extractHomepageUsers(
  response?: { data?: HomepageActiveUser[] | { users?: HomepageActiveUser[] } },
): HomepageActiveUser[] {
  const payload = response?.data;
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.users)) return payload.users;
  return [];
}

function getFeaturedUsers(users: FeaturedUser[], limit = 4): FeaturedUser[] {
  const rankedUsers = users
    .map(user => {
      const freshnessBoost = getFreshnessBoost(user.lastActiveDays);
      const score = user.activityScore * 0.7 + user.reputationScore * 0.2 + freshnessBoost * 0.1;

      return {
        ...user,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
  return rankedUsers.slice(0, limit);
}

function getInitial(username: string): string {
  return username.charAt(0).toUpperCase();
}

function normalizeAvatarUrl(avatarUrl: string): string {
  if (!avatarUrl) return "";
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }
  const baseUrl = process.env.NEXT_PUBLIC_URL || "";
  return `${baseUrl}${avatarUrl}`;
}

export default function FeaturedUsersSection() {
  const primaryUsersQuery = useGetHomepageActiveUsersQuery({});
  const fallbackUsersQuery = useGetHomepageActiveUsersQuery({});
  const adminUsersFallbackQuery = useGetUsersQuery({
    page: 1,
    limit: 200,
  });

  const isLoading = primaryUsersQuery.isLoading || fallbackUsersQuery.isLoading;
  const isError = Boolean(primaryUsersQuery.isError && fallbackUsersQuery.isError);
  const homepageUsers = useMemo(() => {
    const merged = [
      ...extractHomepageUsers(primaryUsersQuery.data),
      ...extractHomepageUsers(fallbackUsersQuery.data),
    ];
    const uniqueById = new Map<string, HomepageActiveUser>();
    for (const user of merged) {
      uniqueById.set(user._id, user);
    }
    return Array.from(uniqueById.values());
  }, [primaryUsersQuery.data, fallbackUsersQuery.data]);
  const adminFallbackUsers = useMemo(
    () => toFeaturedUsersFromAdminUsers(adminUsersFallbackQuery.data?.data?.users || []),
    [adminUsersFallbackQuery.data],
  );
  const serverUsers = useMemo(() => {
    const primaryMapped = toFeaturedUsersFromHomepageEndpoint(homepageUsers);
    if (primaryMapped.length >= 4) {
      return primaryMapped;
    }

    const merged = [...primaryMapped, ...adminFallbackUsers];
    const uniqueById = new Map<string, FeaturedUser>();
    for (const user of merged) {
      uniqueById.set(user.id, user);
    }
    return Array.from(uniqueById.values());
  }, [homepageUsers, adminFallbackUsers]);
  const preparedUsers = useMemo(
    () => (serverUsers.length > 0 ? serverUsers : MOCK_USERS),
    [serverUsers],
  );
  const featuredUsers = useMemo(() => getFeaturedUsers(preparedUsers), [preparedUsers]);
  const isUsingFallback = isError || serverUsers.length === 0;

  return (
    <section className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6">
      <div className="flex flex-col gap-2 mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-[var(--muted-foreground)]" />
          <h2 className="text-2xl font-bold text-[var(--muted-foreground)]">
            Рекомендуемые пользователи
          </h2>
        </div>
        <p className="text-sm text-[var(--muted-foreground)] max-w-2xl">
          Показываем активных и качественных пользователей.
        </p>
        {isLoading && (
          <p className="text-xs text-[var(--muted-foreground)]">Загружаем пользователей с сервера...</p>
        )}
        {isUsingFallback && !isLoading && (
          <p className="text-xs text-[var(--muted-foreground)]">
            Серверные данные недоступны, показана тестовая выборка.
          </p>
        )}
      </div>

      <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
        {featuredUsers.map(user => (
          <Link
            key={user.id}
            href={`/user/${user.id}`}
            className="w-64 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 hover:bg-[var(--secondary)]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-12 h-12 rounded-full object-cover border border-[var(--border)]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[var(--secondary)] flex items-center justify-center border border-[var(--border)]">
                  <span className="font-semibold text-[var(--foreground)]">{getInitial(user.username)}</span>
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[var(--foreground)] truncate">{user.username}</p>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Активен {user.lastActiveDays === 0 ? "сегодня" : `${user.lastActiveDays} дн. назад`}
                </p>
              </div>
            </div>

            <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2">{user.bio}</p>

            <div className="mt-2 flex items-center gap-1 text-xs flex-wrap">
              <span className="px-2 py-1 rounded-full bg-[var(--secondary)] text-[var(--foreground)]">
                Активность {user.activityScore}
              </span>
              <span className="px-2 py-1 rounded-full bg-[var(--secondary)] text-[var(--foreground)]">
                Репутация {user.reputationScore}
              </span>
            </div>

          </Link>
        ))}
      </div>
    </section>
  );
}
