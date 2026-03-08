"use client";

import { UserProfile } from "@/types/user";
import { Sun, Moon, CloudSun } from "lucide-react";
import { useMemo } from "react";
import { getRankColor, levelToRank } from "@/lib/rank-utils";

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
    case "morning":
      return "Доброе утро";
    case "afternoon":
      return "Добрый день";
    case "evening":
      return "Добрый вечер";
    case "night":
      return "Доброй ночи";
  }
}

function getTimeIcon(timeOfDay: "morning" | "afternoon" | "evening" | "night"): React.ElementType {
  switch (timeOfDay) {
    case "morning":
      return CloudSun;
    case "afternoon":
      return Sun;
    case "evening":
      return CloudSun;
    case "night":
      return Moon;
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${rankColor}15` }}>
          <TimeIcon className="w-4 h-4 shrink-0" style={{ color: rankColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-[var(--foreground)] truncate">
            {greeting}, {displayName}!
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{quote}</p>
        </div>
      </div>
    </div>
  );
}
