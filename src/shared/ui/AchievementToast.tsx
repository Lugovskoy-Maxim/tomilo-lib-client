"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { X, Trophy, BookOpen, Bookmark, Users, Clock, Star, Crown } from "lucide-react";
import { AchievementEvent } from "@/types/progress";
import { AchievementRarity, AchievementType } from "@/types/user";

interface AchievementToastProps {
  event: AchievementEvent;
  onClose: () => void;
  duration?: number;
}

const RARITY_COLORS: Record<AchievementRarity, { 
  bg: string; 
  border: string; 
  text: string; 
  glow: string;
  gradient: string;
}> = {
  common: { 
    bg: "bg-slate-500/15", 
    border: "border-slate-400/40",
    text: "text-slate-400",
    glow: "shadow-slate-400/20",
    gradient: "from-slate-500 to-slate-600",
  },
  uncommon: { 
    bg: "bg-green-500/15", 
    border: "border-green-400/40",
    text: "text-green-400",
    glow: "shadow-green-400/30",
    gradient: "from-green-500 to-emerald-600",
  },
  rare: { 
    bg: "bg-blue-500/15", 
    border: "border-blue-400/40",
    text: "text-blue-400",
    glow: "shadow-blue-400/30",
    gradient: "from-blue-500 to-cyan-600",
  },
  epic: { 
    bg: "bg-purple-500/15", 
    border: "border-purple-400/40",
    text: "text-purple-400",
    glow: "shadow-purple-400/40",
    gradient: "from-purple-500 to-violet-600",
  },
  legendary: { 
    bg: "bg-amber-500/15", 
    border: "border-amber-400/50",
    text: "text-amber-400",
    glow: "shadow-amber-400/50",
    gradient: "from-amber-500 to-orange-600",
  },
};

const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: "Обычное",
  uncommon: "Необычное",
  rare: "Редкое",
  epic: "Эпическое",
  legendary: "Легендарное",
};

const TYPE_ICONS: Record<AchievementType, React.ElementType> = {
  reading: BookOpen,
  collection: Bookmark,
  social: Users,
  veteran: Clock,
  special: Star,
  level: Crown,
};

export default function AchievementToast({ 
  event, 
  onClose, 
  duration = 6000 
}: AchievementToastProps) {
  const { achievement } = event;
  const colors = RARITY_COLORS[achievement.rarity];
  const Icon = TYPE_ICONS[achievement.type] || Trophy;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, event.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`
        relative flex items-start gap-4 p-4 rounded-2xl border 
        bg-[var(--card)] shadow-xl overflow-hidden
        min-w-[320px] max-w-[420px]
        ${colors.border} ${colors.glow}
      `}
    >
      {/* Background gradient */}
      <div 
        className={`absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-r ${colors.gradient}`}
      />

      {/* Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}
      >
        <Icon className={`w-6 h-6 ${colors.text}`} />
        <motion.div
          initial={{ scale: 1.5, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`absolute inset-0 rounded-xl ${colors.bg}`}
        />
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-[10px] font-semibold uppercase tracking-wider ${colors.text}`}
          >
            Достижение получено
          </motion.span>
          <span 
            className={`text-[9px] px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text} ${colors.border} border`}
          >
            {RARITY_LABELS[achievement.rarity]}
          </span>
        </div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-bold text-[var(--foreground)] mb-0.5"
        >
          {achievement.name}
        </motion.p>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-[var(--muted-foreground)] line-clamp-2"
        >
          {achievement.description}
        </motion.p>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
        aria-label="Закрыть"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: "linear" }}
        className={`absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-gradient-to-r ${colors.gradient}`}
      />
    </motion.div>
  );
}
