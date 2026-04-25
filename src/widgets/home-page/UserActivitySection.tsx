"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import {
  MessageCircle,
  BookOpen,
  Flame,
  Heart,
  User,
  Users,
  Trophy,
  Star,
  Sparkles,
  ThumbsUp,
  BookMarked,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useGetHomepageActivityQuery } from "@/store/api/usersApi";
import type {
  HomepageActivity,
  HomepageActivityComment,
  HomepageActivityReader,
  HomepageActivityStreak,
  HomepageActivityTopTitle,
  HomepageActivityLevelUser,
  HomepageActivityNewUser,
  HomepageActivityLikesUser,
} from "@/store/api/usersApi";
import { getCoverUrls } from "@/lib/asset-url";
import { formatUsernameDisplay } from "@/lib/username-display";

/* ─── helpers ─── */

function avatarUrl(a?: string) {
  return a ? getCoverUrls(a, "").primary : "";
}

function Avatar({ username, avatar, size = 32 }: { username: string; avatar?: string; size?: number }) {
  const url = avatarUrl(avatar);
  if (url) {
    return (
      <img
        src={url}
        alt={formatUsernameDisplay(username)}
        className="rounded-full object-cover flex-shrink-0 ring-1 ring-[var(--border)]"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-[var(--secondary)] flex items-center justify-center flex-shrink-0 ring-1 ring-[var(--border)]"
      style={{ width: size, height: size }}
    >
      <User className="w-3 h-3 text-[var(--muted-foreground)]" />
    </div>
  );
}

/* ─── Skeleton variants ─── */

const SKELETON_VARIANTS = [
  // wide bar + circle
  <div key="s1" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] animate-pulse">
    <div className="w-8 h-8 rounded-full bg-[var(--muted)]/40 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-2.5 bg-[var(--muted)]/40 rounded w-3/4" />
      <div className="h-2 bg-[var(--muted)]/30 rounded w-1/2" />
    </div>
    <div className="w-10 h-5 bg-[var(--muted)]/30 rounded-full" />
  </div>,
  // two lines
  <div key="s2" className="flex flex-col gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] animate-pulse">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded bg-[var(--muted)]/40" />
      <div className="h-2 bg-[var(--muted)]/40 rounded w-1/3" />
    </div>
    <div className="h-2.5 bg-[var(--muted)]/30 rounded w-full" />
    <div className="h-2 bg-[var(--muted)]/20 rounded w-2/3" />
  </div>,
  // avatar + badge
  <div key="s3" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] animate-pulse">
    <div className="relative flex-shrink-0">
      <div className="w-9 h-9 rounded-full bg-[var(--muted)]/40" />
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--muted)]/50" />
    </div>
    <div className="flex-1 space-y-1.5">
      <div className="h-2.5 bg-[var(--muted)]/40 rounded w-2/3" />
      <div className="h-2 bg-[var(--muted)]/25 rounded w-1/2" />
    </div>
    <div className="w-8 h-6 bg-[var(--muted)]/30 rounded" />
  </div>,
  // icon row
  <div key="s4" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] animate-pulse">
    <div className="w-8 h-8 rounded-lg bg-[var(--muted)]/40 flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-2 bg-[var(--muted)]/40 rounded w-1/4" />
      <div className="h-2.5 bg-[var(--muted)]/30 rounded w-3/4" />
    </div>
  </div>,
];

function randomSkeletons(count: number) {
  const shuffled = [...SKELETON_VARIANTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/* ─── Card shell ─── */

function Card({
  href,
  accent,
  children,
}: {
  href?: string;
  accent?: string;
  children: React.ReactNode;
}) {
  const cls = [
    "flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]",
    "hover:bg-[var(--secondary)]/20 transition-colors duration-150 h-full",
    accent ?? "",
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className="block h-full">
        <div className={cls}>{children}</div>
      </Link>
    );
  }
  return <div className={cls}>{children}</div>;
}

/* ─── Individual cards ─── */

function CommentCard({
  c,
  variant = "popular",
}: {
  c: HomepageActivityComment;
  variant?: "popular" | "latest";
}) {
  const isLatest = variant === "latest";
  return (
    <Card href={c.entityUrl || undefined} accent={isLatest ? "hover:border-sky-500/30" : "hover:border-violet-500/30"}>
      <Avatar username={c.user.username} avatar={c.user.avatar} size={34} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          {isLatest
            ? <Clock className="w-3 h-3 text-sky-400 flex-shrink-0" />
            : <MessageCircle className="w-3 h-3 text-violet-400 flex-shrink-0" />}
          <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide truncate">
            {isLatest ? "Последний комментарий" : `"Любимый" комментарий`}
          </span>
        </div>
        <p className="text-xs text-[var(--foreground)] line-clamp-2 leading-relaxed">
          {c.content}
        </p>
        {(c.titleName || c.entityName) && (
          <div className="flex items-center gap-1 mt-1">
            <BookMarked className="w-3 h-3 text-[var(--primary)] flex-shrink-0" />
            <span className="text-[11px] text-[var(--muted-foreground)] truncate">
              {c.titleName ?? c.entityName}
              {c.chapterName && c.titleName ? ` · ${c.chapterName}` : ""}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0 text-rose-500">
        <Heart className="w-3.5 h-3.5 fill-rose-500" />
        <span className="text-xs font-bold tabular-nums">{c.reactionsTotal}</span>
      </div>
    </Card>
  );
}

function ReaderCard({ r }: { r: HomepageActivityReader }) {
  return (
    <Card href={`/user/${r.user._id}`} accent="hover:border-blue-500/30">
      <div className="relative flex-shrink-0">
        <Avatar username={r.user.username} avatar={r.user.avatar} size={34} />
        <span className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
          <Trophy className="w-2.5 h-2.5" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <BookOpen className="w-3 h-3 text-blue-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
            Топ читатель
          </span>
        </div>
        <p className="text-sm font-semibold text-[var(--foreground)] truncate">
          {formatUsernameDisplay(r.user.username)}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-base font-black text-blue-400 tabular-nums leading-none">{r.count}</p>
        <p className="text-[10px] text-[var(--muted-foreground)]">глав</p>
      </div>
    </Card>
  );
}

function StreakCard({ s }: { s: HomepageActivityStreak }) {
  // const flames = Math.min(s.streak, 5);
  // const extra = s.streak - 5;
  return (
    <Card href={`/user/${s.user._id}`} accent="hover:border-orange-500/30">
      <div className="relative flex-shrink-0">
        <Avatar username={s.user.username} avatar={s.user.avatar} size={34} />
        <span className="absolute -bottom-0.5 -right-0.5 bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">
          🔥
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
            Топ серия
          </span>
        </div>
        <p className="text-sm font-semibold text-[var(--foreground)] truncate">
          {formatUsernameDisplay(s.user.username)}
        </p>
        {/* <div className="flex items-center gap-0.5 mt-0.5">
          {Array.from({ length: flames }).map((_, i) => (
            <Flame key={i} className="w-3 h-3 text-orange-500 fill-orange-500/40" />
          ))}
          {extra > 0 && <span className="text-[10px] text-orange-500 font-bold">+{extra}</span>}
        </div> */}
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-base font-black text-orange-400 tabular-nums leading-none">{s.streak}</p>
        <p className="text-[10px] text-[var(--muted-foreground)]">дней</p>
      </div>
    </Card>
  );
}

function TopTitleCard({ t }: { t: HomepageActivityTopTitle }) {
  return (
    <Card href={t.slug ? `/titles/${t.slug}` : undefined} accent="hover:border-emerald-500/30">
      {t.coverImage ? (
        <img
          src={getCoverUrls(t.coverImage, "").primary}
          alt={t.name}
          className="w-8 h-10 rounded object-cover flex-shrink-0 ring-1 ring-[var(--border)]"
        />
      ) : (
        <div className="w-8 h-10 rounded bg-[var(--secondary)] flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-[var(--muted-foreground)]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
            Топ тайтл недели
          </span>
        </div>
        <p className="text-sm font-semibold text-[var(--foreground)] truncate">{t.name}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-base font-black text-emerald-400 tabular-nums leading-none">{t.chaptersReadCount}</p>
        <p className="text-[10px] text-[var(--muted-foreground)]">глав</p>
      </div>
    </Card>
  );
}

function LevelCard({ u }: { u: HomepageActivityLevelUser }) {
  return (
    <Card href={`/user/${u.user._id}`} accent="hover:border-yellow-500/30">
      <div className="relative flex-shrink-0">
        <Avatar username={u.user.username} avatar={u.user.avatar} size={34} />
        <span className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
          <Star className="w-2.5 h-2.5 fill-white" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
            Топ уровень
          </span>
        </div>
        <p className="text-sm font-semibold text-[var(--foreground)] truncate">
          {formatUsernameDisplay(u.user.username)}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-base font-black text-yellow-400 tabular-nums leading-none">{u.level}</p>
        <p className="text-[10px] text-[var(--muted-foreground)]">уровень</p>
      </div>
    </Card>
  );
}

function NewUserCard({ u }: { u: HomepageActivityNewUser }) {
  return (
    <Card href={`/user/${u.user._id}`} accent="hover:border-pink-500/30">
      <div className="relative flex-shrink-0">
        <Avatar username={u.user.username} avatar={u.user.avatar} size={34} />
        <span className="absolute -bottom-0.5 -right-0.5 bg-pink-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <Sparkles className="w-3 h-3 text-pink-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
            Новичок недели
          </span>
        </div>
        <p className="text-sm font-semibold text-[var(--foreground)] truncate">
          {formatUsernameDisplay(u.user.username)}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-base font-black text-pink-400 tabular-nums leading-none">{u.chaptersRead}</p>
        <p className="text-[10px] text-[var(--muted-foreground)]">глав</p>
      </div>
    </Card>
  );
}

function LikesCard({ u }: { u: HomepageActivityLikesUser }) {
  return (
    <Card href={`/user/${u.user._id}`} accent="hover:border-rose-500/30">
      <div className="relative flex-shrink-0">
        <Avatar username={u.user.username} avatar={u.user.avatar} size={34} />
        <span className="absolute -bottom-0.5 -right-0.5 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
          <Heart className="w-2.5 h-2.5 fill-white" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <ThumbsUp className="w-3 h-3 text-rose-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
            Топ по сердечкам
          </span>
        </div>
        <p className="text-sm font-semibold text-[var(--foreground)] truncate">
          {formatUsernameDisplay(u.user.username)}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-base font-black text-rose-400 tabular-nums leading-none">{u.likesReceived}</p>
        <p className="text-[10px] text-[var(--muted-foreground)]">сердечек</p>
      </div>
    </Card>
  );
}

/* ─── Build pool & pick 3 random ─── */

type ActivityCard = { key: string; node: React.ReactNode };

function buildPool(activity: HomepageActivity): ActivityCard[] {
  const pool: ActivityCard[] = [];

  if (activity.popularComment) {
    pool.push({ key: "comment", node: <CommentCard c={activity.popularComment} variant="popular" /> });
  }
  if (activity.lastComment) {
    pool.push({ key: "lastcomment", node: <CommentCard c={activity.lastComment} variant="latest" /> });
  }
  if (activity.topChapterReader) {
    pool.push({ key: "reader", node: <ReaderCard r={activity.topChapterReader} /> });
  }
  if (activity.topStreak) {
    pool.push({ key: "streak", node: <StreakCard s={activity.topStreak} /> });
  }
  if (activity.topTitle) {
    pool.push({ key: "title", node: <TopTitleCard t={activity.topTitle} /> });
  }
  if (activity.topLevelUser) {
    pool.push({ key: "level", node: <LevelCard u={activity.topLevelUser} /> });
  }
  if (activity.topNewUser) {
    pool.push({ key: "newuser", node: <NewUserCard u={activity.topNewUser} /> });
  }
  if (activity.topLikesUser) {
    pool.push({ key: "likes", node: <LikesCard u={activity.topLikesUser} /> });
  }

  // shuffle and pick 3
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

/* ─── Main ─── */

export default function UserActivitySection() {
  const { data: response, isLoading, isError } = useGetHomepageActivityQuery();
  const activity = response?.data;

  // Стабилизируем выбор карточек — пересчитываем только когда данные пришли
  const skeletonsRef = useRef(randomSkeletons(3));
  const cards = useMemo(
    () => (activity ? buildPool(activity) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [!!activity],
  );

  if (isError) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:py-6">
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center gap-2 min-w-0 flex-nowrap">
          <div className="flex shrink-0 items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)] truncate min-w-0">
            Активность сообщества
          </h2>
        </div>
        <p className="text-[var(--muted-foreground)] text-xs mt-0.5 max-w-2xl">
          Лучшие читатели, комментарии и достижения за эту неделю.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {isLoading
          ? skeletonsRef.current.map((s, i) => <div key={i}>{s}</div>)
          : cards.map(c => <div key={c.key}>{c.node}</div>)}
      </div>
    </section>
  );
}
