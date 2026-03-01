"use client";

import { UserProfile } from "@/types/user";
import { Crown, ChevronRight, Zap, Target } from "lucide-react";
import { getLevelProgress, getRankColor, levelToRank } from "@/lib/rank-utils";
import { useMemo } from "react";
import Link from "next/link";

interface NextRankProgressProps {
  userProfile: UserProfile;
  onShowStats?: () => void;
}

function getMotivationalMessage(progressPercent: number, daysOnSite: number, level: number): string {
  if (level === 0) {
    return "Начните читать, чтобы получать опыт и повышать уровень!";
  }
  
  if (progressPercent >= 90) {
    return "Почти достигли следующего уровня! Ещё немного!";
  }
  
  if (progressPercent >= 70) {
    return "Отличный прогресс! Вы на верном пути к новому уровню.";
  }
  
  if (progressPercent >= 50) {
    return "Уже половина пути до следующего уровня!";
  }
  
  if (progressPercent >= 25) {
    return "Хорошее начало! Продолжайте читать для получения опыта.";
  }
  
  return "Читайте главы, чтобы получать опыт и открывать достижения!";
}

export default function NextRankProgress({ userProfile, onShowStats }: NextRankProgressProps) {
  const level = userProfile.level ?? 0;
  const experience = userProfile.experience ?? 0;
  
  const { 
    progressPercent, 
    nextLevelExp, 
    currentRank, 
    motivationalMessage 
  } = useMemo(() => {
    const { progressPercent, nextLevelExp } = getLevelProgress(level, experience);
    const currentRankInfo = levelToRank(level);
    
    const joinedDate = userProfile.createdAt ? new Date(userProfile.createdAt) : null;
    const daysOnSite = joinedDate ? Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      progressPercent,
      nextLevelExp,
      currentRank: currentRankInfo,
      motivationalMessage: getMotivationalMessage(progressPercent, daysOnSite, level),
    };
  }, [level, experience, userProfile.createdAt]);
  
  const currentRankColor = getRankColor(currentRank.rank);
  
  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)]/80 bg-gradient-to-br from-[var(--card)] to-[var(--card)]/80 overflow-hidden">
      <div 
        className="p-4 sm:p-5"
        style={{
          background: `linear-gradient(135deg, ${currentRankColor}08 0%, transparent 50%)`,
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-xl"
              style={{ 
                background: `linear-gradient(135deg, ${currentRankColor}25 0%, ${currentRankColor}10 100%)`,
                border: `1px solid ${currentRankColor}40`,
              }}
            >
              <Crown className="w-5 h-5" style={{ color: currentRankColor }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Прогресс ранга
              </h3>
              <p className="text-xs" style={{ color: currentRankColor }}>
                {currentRank.name}
              </p>
            </div>
          </div>
          
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm"
            style={{ 
              backgroundColor: `${currentRankColor}20`,
              color: currentRankColor,
              border: `1px solid ${currentRankColor}40`,
            }}
          >
            <span>Ур. {level}</span>
          </div>
        </div>
        
        <div className="p-3 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]/50 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-xs text-[var(--muted-foreground)]">{motivationalMessage}</span>
          </div>
          
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-[var(--foreground)]">
                {experience.toLocaleString()} / {nextLevelExp.toLocaleString()} XP
              </span>
            </div>
            <span className="text-xs font-medium" style={{ color: currentRankColor }}>
              {progressPercent.toFixed(0)}%
            </span>
          </div>
          
          <div className="h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out relative"
              style={{ 
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${currentRankColor} 0%, ${currentRankColor}cc 100%)`,
                boxShadow: `0 0 8px ${currentRankColor}50`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
            </div>
          </div>
          
          <p className="text-[10px] text-[var(--muted-foreground)] mt-2 text-right">
            {(nextLevelExp - experience).toLocaleString()} XP до уровня {level + 1}
          </p>
        </div>
        
        
        <button
          type="button"
          onClick={onShowStats}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]/60 hover:border-[var(--primary)]/40 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all duration-300 group"
        >
          <span>Подробная статистика</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
