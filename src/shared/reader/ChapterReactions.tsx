"use client";

import { useState, useEffect } from "react";
import { Heart, ThumbsUp, ThumbsDown, Flame, Sparkles, Skull, Laugh, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ChapterReactionsProps {
  chapterId: string;
  titleId: string;
  initialLikes?: number;
  initialDislikes?: number;
  onLoginRequired?: () => void;
}

type ReactionType = "like" | "dislike" | "fire" | "sparkle" | "skull" | "laugh";

interface ReactionConfig {
  type: ReactionType;
  icon: React.ElementType;
  label: string;
  activeColor: string;
  bgColor: string;
}

const reactions: ReactionConfig[] = [
  { type: "like", icon: ThumbsUp, label: "Нравится", activeColor: "text-blue-400", bgColor: "bg-blue-500/10" },
  { type: "fire", icon: Flame, label: "Огонь", activeColor: "text-orange-400", bgColor: "bg-orange-500/10" },
  { type: "sparkle", icon: Sparkles, label: "Круто", activeColor: "text-yellow-400", bgColor: "bg-yellow-500/10" },
  { type: "laugh", icon: Laugh, label: "Смешно", activeColor: "text-green-400", bgColor: "bg-green-500/10" },
  { type: "skull", icon: Skull, label: "RIP", activeColor: "text-purple-400", bgColor: "bg-purple-500/10" },
  { type: "dislike", icon: ThumbsDown, label: "Не нравится", activeColor: "text-red-400", bgColor: "bg-red-500/10" },
];

export function ChapterReactions({
  chapterId,
  titleId,
  initialLikes = 0,
  initialDislikes = 0,
  onLoginRequired,
}: ChapterReactionsProps) {
  const { user, isAuthenticated } = useAuth();
  const [selectedReaction, setSelectedReaction] = useState<ReactionType | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    like: initialLikes,
    dislike: initialDislikes,
    fire: 0,
    sparkle: 0,
    skull: 0,
    laugh: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showAllReactions, setShowAllReactions] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedReaction = localStorage.getItem(`chapter-reaction-${chapterId}`);
      if (savedReaction) {
        setSelectedReaction(savedReaction as ReactionType);
      }
    }
  }, [chapterId]);

  const handleReaction = async (type: ReactionType) => {
    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }

    setIsLoading(true);
    
    try {
      const previousReaction = selectedReaction;
      
      if (selectedReaction === type) {
        setSelectedReaction(null);
        setReactionCounts(prev => ({
          ...prev,
          [type]: Math.max(0, prev[type] - 1),
        }));
        localStorage.removeItem(`chapter-reaction-${chapterId}`);
      } else {
        if (previousReaction) {
          setReactionCounts(prev => ({
            ...prev,
            [previousReaction]: Math.max(0, prev[previousReaction] - 1),
          }));
        }
        
        setSelectedReaction(type);
        setReactionCounts(prev => ({
          ...prev,
          [type]: prev[type] + 1,
        }));
        localStorage.setItem(`chapter-reaction-${chapterId}`, type);
      }
    } catch (error) {
      console.error("Reaction error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  const primaryReactions = reactions.slice(0, 3);
  const secondaryReactions = reactions.slice(3);

  return (
    <div className="bg-gradient-to-br from-[var(--secondary)]/60 to-[var(--card)]/40 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-[var(--border)]/30 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
            <Heart className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--foreground)]">Оцените главу</span>
            <p className="text-xs text-[var(--muted-foreground)] hidden sm:block">Ваша реакция важна для переводчика</p>
          </div>
        </div>
        {totalReactions > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--primary)]/10 rounded-full">
            <span className="text-xs font-medium text-[var(--primary)]">
              {totalReactions}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {totalReactions === 1 ? "реакция" : totalReactions < 5 ? "реакции" : "реакций"}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {primaryReactions.map(reaction => {
          const Icon = reaction.icon;
          const isSelected = selectedReaction === reaction.type;
          const count = reactionCounts[reaction.type];

          return (
            <button
              key={reaction.type}
              onClick={() => handleReaction(reaction.type)}
              disabled={isLoading}
              className={`group flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
                isSelected
                  ? `${reaction.bgColor} ${reaction.activeColor} ring-2 ring-current shadow-sm`
                  : "bg-[var(--background)]/60 text-[var(--muted-foreground)] hover:bg-[var(--background)]/90 hover:text-[var(--foreground)] hover:shadow-sm"
              }`}
              title={reaction.label}
            >
              {isLoading && selectedReaction === reaction.type ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${isSelected ? "scale-110 animate-bounce-once" : "group-hover:scale-110"}`} />
              )}
              {count > 0 && (
                <span className={`text-xs sm:text-sm font-semibold ${isSelected ? "" : "text-[var(--foreground)]"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => setShowAllReactions(!showAllReactions)}
          className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[var(--background)]/60 text-[var(--muted-foreground)] hover:bg-[var(--background)]/90 hover:text-[var(--foreground)] transition-all active:scale-95 ${showAllReactions ? "ring-2 ring-[var(--primary)]/30" : ""}`}
        >
          <span className="text-xs font-medium">+{secondaryReactions.length}</span>
        </button>
      </div>

      {showAllReactions && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--border)]/30 animate-in fade-in slide-in-from-top-2 duration-300">
          {secondaryReactions.map(reaction => {
            const Icon = reaction.icon;
            const isSelected = selectedReaction === reaction.type;
            const count = reactionCounts[reaction.type];

            return (
              <button
                key={reaction.type}
                onClick={() => handleReaction(reaction.type)}
                disabled={isLoading}
                className={`group flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? `${reaction.bgColor} ${reaction.activeColor} ring-2 ring-current shadow-sm`
                    : "bg-[var(--background)]/60 text-[var(--muted-foreground)] hover:bg-[var(--background)]/90 hover:text-[var(--foreground)]"
                }`}
                title={reaction.label}
              >
                {isLoading && selectedReaction === reaction.type ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isSelected ? "scale-110" : "group-hover:scale-110"}`} />
                )}
                <span className="text-xs font-medium">{reaction.label}</span>
                {count > 0 && <span className="text-xs font-semibold ml-0.5">({count})</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
