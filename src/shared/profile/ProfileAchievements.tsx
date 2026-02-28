"use client";

import { UserProfile } from "@/types/user";
import { 
  Trophy, BookOpen, Bookmark, Users, Clock, Crown, Shield, 
  ChevronRight, ChevronUp, Sparkles
} from "lucide-react";
import { useState } from "react";

interface ProfileAchievementsProps {
  userProfile: UserProfile;
  compact?: boolean;
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
  const chaptersRead = userProfile.readingHistory?.reduce(
    (t, item) => t + (item.chaptersCount ?? item.chapters?.length ?? 0), 0
  ) ?? 0;
  const totalBookmarks = userProfile.bookmarks?.length ?? 0;
  const level = userProfile.level ?? 0;
  const joinedDate = userProfile.createdAt ? new Date(userProfile.createdAt) : null;
  const daysSinceJoined = joinedDate ? Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const linkedProviders = userProfile.linkedProviders?.length ?? 0;
  const emailVerified = userProfile.emailVerified ? 1 : 0;

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

function AchievementCard({ achievement, expanded, onToggle }: { 
  achievement: AchievementWithLevels; 
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = achievement.icon;
  const isUnlocked = achievement.currentLevel > 0;
  const currentLevelData = achievement.levels[achievement.currentLevel - 1];
  const nextLevelData = achievement.levels[achievement.currentLevel];
  
  const prevThreshold = currentLevelData?.threshold ?? 0;
  const nextThreshold = nextLevelData?.threshold ?? achievement.levels[achievement.levels.length - 1].threshold;
  const progressInLevel = achievement.currentValue - prevThreshold;
  const levelRange = nextThreshold - prevThreshold;
  const progressPercent = nextLevelData 
    ? Math.min((progressInLevel / levelRange) * 100, 100)
    : 100;

  const formatValue = (val: number, id: string) => {
    if (id === "veteran") {
      if (val >= 365) return `${Math.floor(val / 365)}г ${val % 365}д`;
      if (val >= 30) return `${Math.floor(val / 30)}м ${val % 30}д`;
      return `${val}д`;
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
            <h3 className={`text-sm font-semibold truncate ${isUnlocked ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>
              {achievement.name}
            </h3>
            {isUnlocked && currentLevelData && (
              <span 
                className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ 
                  backgroundColor: `${achievement.color}20`,
                  color: achievement.color
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
              {nextLevelData && <span className="opacity-60">/{formatValue(nextThreshold, achievement.id)}</span>}
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
          <p className="text-[11px] text-[var(--muted-foreground)] mb-2">{achievement.description}</p>
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
                      isCompleted ? "text-white" : "text-[var(--muted-foreground)] bg-[var(--secondary)]"
                    }`}
                    style={isCompleted ? { backgroundColor: achievement.color } : undefined}
                  >
                    {isCompleted ? "✓" : levelNum}
                  </div>
                  <span className={`flex-1 ${isCompleted ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>
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
}

export default function ProfileAchievements({ userProfile, compact = false }: ProfileAchievementsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const achievements = generateAchievements(userProfile);

  const totalLevels = achievements.reduce((sum, a) => sum + a.maxLevel, 0);
  const unlockedLevels = achievements.reduce((sum, a) => sum + a.currentLevel, 0);
  const overallPercent = Math.round((unlockedLevels / totalLevels) * 100);

  const displayedAchievements = compact ? achievements.slice(0, 3) : achievements;

  return (
    <div className={`rounded-xl border border-[var(--border)]/80 bg-[var(--card)]/90 backdrop-blur-sm shadow-sm ${compact ? "p-3 min-[360px]:p-3.5" : "p-3 min-[360px]:p-4"}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 min-[360px]:mb-4">
        <div className="flex items-center gap-2 min-[360px]:gap-2.5 min-w-0">
          <div className="shrink-0 p-2 min-[360px]:p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Trophy className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm min-[360px]:text-base font-bold text-[var(--foreground)] truncate">Достижения</h2>
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
        {displayedAchievements.map((achievement) => (
          <AchievementCard 
            key={achievement.id} 
            achievement={achievement}
            expanded={expandedId === achievement.id}
            onToggle={() => setExpandedId(expandedId === achievement.id ? null : achievement.id)}
          />
        ))}
      </div>

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
