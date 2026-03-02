"use client";

import { UserProfile } from "@/types/user";
import { Sparkles, Sun, Moon, CloudSun } from "lucide-react";
import { useMemo } from "react";
import { getRankDisplay, getRankColor, levelToRank } from "@/lib/rank-utils";

interface ProfileWelcomeProps {
  userProfile: UserProfile;
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function getGreeting(timeOfDay: "morning" | "afternoon" | "evening" | "night"): string {
  switch (timeOfDay) {
    case "morning": return "Доброе утро";
    case "afternoon": return "Добрый день";
    case "evening": return "Добрый вечер";
    case "night": return "Доброй ночи";
  }
}

function getTimeIcon(timeOfDay: "morning" | "afternoon" | "evening" | "night"): React.ElementType {
  switch (timeOfDay) {
    case "morning": return CloudSun;
    case "afternoon": return Sun;
    case "evening": return CloudSun;
    case "night": return Moon;
  }
}

function getMotivationalQuote(level: number, streak: number): string {
  if (streak >= 30) {
    return "Невероятная серия! Вы настоящий мастер чтения.";
  }
  if (streak >= 14) {
    return "Отличная серия активности! Продолжайте в том же духе.";
  }
  if (streak >= 7) {
    return "Целая неделя активности! Вы на верном пути.";
  }
  if (level >= 50) {
    return "Впечатляющий прогресс! Вы достигли высокого уровня мастерства.";
  }
  if (level >= 25) {
    return "Отличный прогресс! Ваша коллекция впечатляет.";
  }
  if (level >= 10) {
    return "Хороший старт! Продолжайте читать и открывать новые миры.";
  }
  return "Добро пожаловать! Начните читать, чтобы получать опыт.";
}

export default function ProfileWelcome({ userProfile }: ProfileWelcomeProps) {
  const { greeting, TimeIcon, quote, rankColor } = useMemo(() => {
    const timeOfDay = getTimeOfDay();
    const level = userProfile.level ?? 0;
    const streak = userProfile.currentStreak ?? 0;
    const rankInfo = levelToRank(level);
    
    return {
      greeting: getGreeting(timeOfDay),
      TimeIcon: getTimeIcon(timeOfDay),
      quote: getMotivationalQuote(level, streak),
      rankColor: getRankColor(rankInfo.rank),
    };
  }, [userProfile.level, userProfile.currentStreak]);
  
  const displayName = userProfile.username || "Культиватор";
  
  return (
    <div 
      className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${rankColor}08 0%, transparent 50%, ${rankColor}05 100%)`,
        borderColor: `${rankColor}30`,
      }}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <TimeIcon 
                className="w-5 h-5 shrink-0" 
                style={{ color: rankColor }} 
              />
              <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)] truncate">
                {greeting}, <span style={{ color: rankColor }}>{displayName}</span>!
              </h2>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {quote}
            </p>
          </div>
          
          <div 
            className="shrink-0 p-2 rounded-xl opacity-20"
            style={{ backgroundColor: rankColor }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
