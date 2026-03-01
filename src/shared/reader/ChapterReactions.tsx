"use client";

import { useState, useEffect } from "react";
import { Heart, ThumbsUp, ThumbsDown, Flame, Sparkles, Skull, Laugh, Loader2, Star } from "lucide-react";
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
  emoji: string;
  activeColor: string;
  bgColor: string;
  glowColor: string;
}

const reactions: ReactionConfig[] = [
  { type: "like", icon: ThumbsUp, label: "Нравится", emoji: "👍", activeColor: "text-blue-400", bgColor: "bg-blue-500/15", glowColor: "shadow-blue-500/30" },
  { type: "fire", icon: Flame, label: "Огонь", emoji: "🔥", activeColor: "text-orange-400", bgColor: "bg-orange-500/15", glowColor: "shadow-orange-500/30" },
  { type: "sparkle", icon: Sparkles, label: "Круто", emoji: "✨", activeColor: "text-yellow-400", bgColor: "bg-yellow-500/15", glowColor: "shadow-yellow-500/30" },
  { type: "laugh", icon: Laugh, label: "Смешно", emoji: "😂", activeColor: "text-green-400", bgColor: "bg-green-500/15", glowColor: "shadow-green-500/30" },
  { type: "skull", icon: Skull, label: "RIP", emoji: "💀", activeColor: "text-purple-400", bgColor: "bg-purple-500/15", glowColor: "shadow-purple-500/30" },
  { type: "dislike", icon: ThumbsDown, label: "Не нравится", emoji: "👎", activeColor: "text-red-400", bgColor: "bg-red-500/15", glowColor: "shadow-red-500/30" },
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
  const [animatingReaction, setAnimatingReaction] = useState<ReactionType | null>(null);

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
    setAnimatingReaction(type);
    
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
      setTimeout(() => setAnimatingReaction(null), 300);
    }
  };

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);
  const primaryReactions = reactions.slice(0, 3);
  const secondaryReactions = reactions.slice(3);

  return (
    <div className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent)]/5 rounded-2xl" />
      
      <div className="relative bg-[var(--card)]/80 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-[var(--border)]/40 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/60 flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                <Star className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              {selectedReaction && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--card)] border-2 border-[var(--border)] flex items-center justify-center text-xs">
                  {reactions.find(r => r.type === selectedReaction)?.emoji}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">Оцените главу</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Ваша реакция важна для автора</p>
            </div>
          </div>
          
          {totalReactions > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent)]/10 rounded-full border border-[var(--primary)]/20">
              <Heart className="w-3.5 h-3.5 text-[var(--primary)]" fill="currentColor" />
              <span className="text-sm font-bold text-[var(--primary)]">{totalReactions}</span>
            </div>
          )}
        </div>

        {/* Primary Reactions */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {primaryReactions.map(reaction => {
            const Icon = reaction.icon;
            const isSelected = selectedReaction === reaction.type;
            const count = reactionCounts[reaction.type];
            const isAnimating = animatingReaction === reaction.type;

            return (
              <button
                key={reaction.type}
                onClick={() => handleReaction(reaction.type)}
                disabled={isLoading}
                className={`group relative flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl transition-all duration-300 active:scale-95 ${
                  isSelected
                    ? `${reaction.bgColor} ${reaction.activeColor} ring-2 ring-current shadow-lg ${reaction.glowColor}`
                    : "bg-[var(--secondary)]/80 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] hover:shadow-md"
                } ${isAnimating ? 'scale-110' : ''}`}
                title={reaction.label}
              >
                {isLoading && selectedReaction === reaction.type ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className={`text-lg sm:text-xl transition-transform duration-300 ${isSelected ? "scale-110" : "group-hover:scale-110"}`}>
                    {reaction.emoji}
                  </span>
                )}
                <span className="text-sm font-medium hidden sm:inline">{reaction.label}</span>
                {count > 0 && (
                  <span className={`text-xs sm:text-sm font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20' : 'bg-[var(--muted)]/50'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowAllReactions(!showAllReactions)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-[var(--secondary)]/80 hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all duration-200 active:scale-95 ${
              showAllReactions ? "ring-2 ring-[var(--primary)]/30 bg-[var(--primary)]/5" : ""
            }`}
          >
            <span className="text-sm font-medium">Ещё</span>
            <span className="flex -space-x-1">
              {secondaryReactions.slice(0, 3).map(r => (
                <span key={r.type} className="text-sm">{r.emoji}</span>
              ))}
            </span>
          </button>
        </div>

        {/* Secondary Reactions */}
        {showAllReactions && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]/30 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-wrap gap-2">
              {secondaryReactions.map(reaction => {
                const Icon = reaction.icon;
                const isSelected = selectedReaction === reaction.type;
                const count = reactionCounts[reaction.type];
                const isAnimating = animatingReaction === reaction.type;

                return (
                  <button
                    key={reaction.type}
                    onClick={() => handleReaction(reaction.type)}
                    disabled={isLoading}
                    className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 active:scale-95 ${
                      isSelected
                        ? `${reaction.bgColor} ${reaction.activeColor} ring-2 ring-current shadow-md ${reaction.glowColor}`
                        : "bg-[var(--secondary)]/60 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                    } ${isAnimating ? 'scale-110' : ''}`}
                    title={reaction.label}
                  >
                    {isLoading && selectedReaction === reaction.type ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className={`text-base transition-transform duration-200 ${isSelected ? "scale-110" : "group-hover:scale-110"}`}>
                        {reaction.emoji}
                      </span>
                    )}
                    <span className="text-xs font-medium">{reaction.label}</span>
                    {count > 0 && (
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/20' : 'bg-[var(--muted)]/50'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected reaction indicator */}
        {selectedReaction && (
          <div className="mt-4 pt-3 border-t border-[var(--border)]/30">
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
              <span>Ваша оценка:</span>
              <span className="flex items-center gap-1.5 px-2 py-1 bg-[var(--secondary)] rounded-full">
                <span>{reactions.find(r => r.type === selectedReaction)?.emoji}</span>
                <span className="font-medium text-[var(--foreground)]">
                  {reactions.find(r => r.type === selectedReaction)?.label}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
