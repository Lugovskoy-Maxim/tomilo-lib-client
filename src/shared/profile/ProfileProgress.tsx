"use client";

import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Trophy, 
  Zap, 
  ArrowUp, 
  Calendar,
  Filter,
  Trash2,
  ChevronDown,
  Crown,
  BookOpen,
  Bookmark,
  Users,
  Clock,
  Star
} from "lucide-react";
import { useProgressNotification } from "@/contexts/ProgressNotificationContext";
import { ProgressEvent, ProgressEventType } from "@/types/progress";
import { AchievementRarity, AchievementType } from "@/types/user";
import { getRankColor } from "@/lib/rank-utils";
import { UserProfile } from "@/types/user";

interface ProfileProgressProps {
  userProfile: UserProfile;
}

const EVENT_TYPE_CONFIG: Record<ProgressEventType, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}> = {
  level_up: {
    label: "Повышение уровня",
    icon: ArrowUp,
    color: "text-amber-500",
    bg: "bg-amber-500/15",
  },
  achievement: {
    label: "Достижение",
    icon: Trophy,
    color: "text-purple-500",
    bg: "bg-purple-500/15",
  },
  exp_gain: {
    label: "Опыт",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-500/15",
  },
};

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: "text-slate-400",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
};

const TYPE_ICONS: Record<AchievementType, React.ElementType> = {
  reading: BookOpen,
  collection: Bookmark,
  social: Users,
  veteran: Clock,
  special: Star,
  level: Crown,
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupEventsByDate(events: ProgressEvent[]): Map<string, ProgressEvent[]> {
  const groups = new Map<string, ProgressEvent[]>();
  
  events.forEach(event => {
    const dateKey = formatDate(event.timestamp);
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, event]);
  });
  
  return groups;
}

function EventCard({ event }: { event: ProgressEvent }) {
  const config = EVENT_TYPE_CONFIG[event.type];
  const Icon = config.icon;

  if (event.type === "level_up") {
    const rankColor = getRankColor(event.newRank.rank);
    return (
      <div className="flex items-start gap-4 p-4 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]/50 hover:border-[var(--border)] transition-colors">
        <div 
          className="p-2.5 rounded-xl"
          style={{ backgroundColor: `${rankColor}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: rankColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              Уровень {event.oldLevel} → {event.newLevel}
            </span>
            {event.newRank.rank > event.oldRank.rank && (
              <span 
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ 
                  backgroundColor: `${rankColor}20`,
                  color: rankColor,
                }}
              >
                Новый ранг!
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {event.newRank.name}
          </p>
          <div className="flex gap-1 mt-2">
            {[...Array(9)].map((_, i) => (
              <Star
                key={i}
                className="w-3 h-3"
                fill={i < event.newRank.stars ? rankColor : "transparent"}
                style={{ color: rankColor, opacity: i < event.newRank.stars ? 1 : 0.3 }}
              />
            ))}
          </div>
        </div>
        <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">
          {formatTime(event.timestamp)}
        </span>
      </div>
    );
  }

  if (event.type === "achievement") {
    const { achievement } = event;
    const AchIcon = TYPE_ICONS[achievement.type] || Trophy;
    const rarityColor = RARITY_COLORS[achievement.rarity];
    
    return (
      <div className="flex items-start gap-4 p-4 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]/50 hover:border-[var(--border)] transition-colors">
        <div className={`p-2.5 rounded-xl ${config.bg}`}>
          <AchIcon className={`w-5 h-5 ${rarityColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {achievement.name}
            </span>
            <span className={`text-[10px] ${rarityColor} font-medium`}>
              {achievement.rarity === "common" && "Обычное"}
              {achievement.rarity === "uncommon" && "Необычное"}
              {achievement.rarity === "rare" && "Редкое"}
              {achievement.rarity === "epic" && "Эпическое"}
              {achievement.rarity === "legendary" && "Легендарное"}
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {achievement.description}
          </p>
        </div>
        <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">
          {formatTime(event.timestamp)}
        </span>
      </div>
    );
  }

  if (event.type === "exp_gain") {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]/50 hover:border-[var(--border)] transition-colors">
        <div className={`p-2.5 rounded-xl ${config.bg}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-yellow-500">
            +{event.amount} XP
          </span>
          <p className="text-xs text-[var(--muted-foreground)]">
            {event.reason}
          </p>
        </div>
        <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">
          {formatTime(event.timestamp)}
        </span>
      </div>
    );
  }

  return null;
}

export default function ProfileProgress({ userProfile }: ProfileProgressProps) {
  const { history, clearHistory } = useProgressNotification();
  const [filter, setFilter] = useState<ProgressEventType | "all">("all");
  const [showAll, setShowAll] = useState(false);

  const filteredEvents = useMemo(() => {
    if (filter === "all") return history;
    return history.filter(e => e.type === filter);
  }, [history, filter]);

  const groupedEvents = useMemo(() => {
    return groupEventsByDate(filteredEvents);
  }, [filteredEvents]);

  const displayedGroups = useMemo(() => {
    const groups = Array.from(groupedEvents.entries());
    if (showAll) return groups;
    return groups.slice(0, 3);
  }, [groupedEvents, showAll]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let weeklyXp = 0;
    let monthlyXp = 0;
    let levelUps = 0;
    let achievements = 0;

    history.forEach(event => {
      const eventDate = new Date(event.timestamp);
      
      if (event.type === "exp_gain") {
        if (eventDate >= weekAgo) weeklyXp += event.amount;
        if (eventDate >= monthAgo) monthlyXp += event.amount;
      }
      if (event.type === "level_up") levelUps++;
      if (event.type === "achievement") achievements++;
    });

    return { weeklyXp, monthlyXp, levelUps, achievements };
  }, [history]);

  const filterOptions: { id: ProgressEventType | "all"; label: string; icon: React.ElementType }[] = [
    { id: "all", label: "Все", icon: Filter },
    { id: "level_up", label: "Уровни", icon: ArrowUp },
    { id: "achievement", label: "Достижения", icon: Trophy },
    { id: "exp_gain", label: "Опыт", icon: Zap },
  ];

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]/60">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-yellow-500/15">
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
              За неделю
            </span>
          </div>
          <p className="text-xl font-bold text-[var(--foreground)]">
            {stats.weeklyXp.toLocaleString()} XP
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]/60">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-orange-500/15">
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
              За месяц
            </span>
          </div>
          <p className="text-xl font-bold text-[var(--foreground)]">
            {stats.monthlyXp.toLocaleString()} XP
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]/60">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15">
              <ArrowUp className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
              Уровней
            </span>
          </div>
          <p className="text-xl font-bold text-[var(--foreground)]">
            {stats.levelUps}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]/60">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-purple-500/15">
              <Trophy className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
              Достижений
            </span>
          </div>
          <p className="text-xl font-bold text-[var(--foreground)]">
            {stats.achievements}
          </p>
        </div>
      </div>

      {/* History section */}
      <div className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-[var(--card)]/90 backdrop-blur-sm p-4 sm:p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)]">
                История прогресса
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                {history.length} событий
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Очистить
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterOptions.map(({ id, label, icon: FilterIcon }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                filter === id
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  : "bg-[var(--secondary)]/50 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              <FilterIcon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Events list */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex p-4 rounded-2xl bg-[var(--secondary)]/50 border border-[var(--border)]/60 mb-4">
              <Calendar className="w-10 h-10 text-[var(--muted-foreground)]" />
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {filter === "all" 
                ? "История прогресса пуста" 
                : "Нет событий этого типа"}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Читайте мангу, чтобы получать опыт и достижения
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayedGroups.map(([date, events]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-[var(--border)]" />
                  <span className="text-xs font-medium text-[var(--muted-foreground)] px-2">
                    {date}
                  </span>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                </div>
                <div className="space-y-2">
                  {events.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show more button */}
        {groupedEvents.size > 3 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full mt-6 py-2.5 px-4 rounded-xl bg-[var(--secondary)]/50 hover:bg-[var(--secondary)] border border-[var(--border)]/50 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all duration-200 flex items-center justify-center gap-2"
          >
            Показать все ({groupedEvents.size} дней)
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
