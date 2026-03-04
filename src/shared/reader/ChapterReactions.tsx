"use client";

import { useState, useMemo, useEffect } from "react";
import { Loader2, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CHAPTER_ALLOWED_REACTION_EMOJIS } from "@/types/chapter";
import {
  useGetChapterRatingQuery,
  useSetChapterRatingMutation,
  useGetChapterReactionsCountQuery,
  useToggleChapterReactionMutation,
} from "@/store/api/chaptersApi";

const EMOJI_LABELS: Record<string, string> = {
  "👍": "Нравится",
  "👎": "Не нравится",
  "❤️": "Сердце",
  "🔥": "Огонь",
  "😂": "Смешно",
  "😮": "Вау",
  "😢": "Грустно",
  "🎉": "Праздник",
  "👏": "Аплодисменты",
};

interface ChapterReactionsProps {
  chapterId: string;
  titleId: string;
  onLoginRequired?: () => void;
}

export function ChapterReactions({
  chapterId,
  titleId: _titleId,
  onLoginRequired,
}: ChapterReactionsProps) {
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [animatingEmoji, setAnimatingEmoji] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const { data: ratingData, error: ratingError, isError: isRatingError } = useGetChapterRatingQuery(
    chapterId,
    { skip: !chapterId }
  );
  const [setRating, { isLoading: isRatingLoading }] = useSetChapterRatingMutation();

  const { data: countData, error: countError, isError: isCountError } =
    useGetChapterReactionsCountQuery(chapterId, { skip: !chapterId });

  const ratingUnavailable = isRatingError && (ratingError as { status?: number })?.status === 404;
  const reactionsUnavailable = isCountError && (countError as { status?: number })?.status === 404;
  const apiUnavailable = ratingUnavailable && reactionsUnavailable;

  const [toggleReaction, { isLoading: isReactionLoading }] =
    useToggleChapterReactionMutation();

  const rating = ratingData ?? null;
  const averageRating = rating?.averageRating ?? (rating?.ratingSum != null && (rating?.ratingCount ?? 0) > 0
    ? (rating.ratingSum! / (rating.ratingCount ?? 1))
    : null);
  const ratingCount = rating?.ratingCount ?? 0;
  const userRating = rating?.userRating ?? null;
  const ratingAvailable = !ratingUnavailable;

  const countByEmoji = useMemo(() => {
    const map: Record<string, number> = {};
    countData?.data?.reactions?.forEach((r) => {
      map[r.emoji] = r.count;
    });
    return map;
  }, [countData?.data?.reactions]);

  const totalReactions = useMemo(
    () => Object.values(countByEmoji).reduce((a, b) => a + b, 0),
    [countByEmoji]
  );

  const handleReaction = async (emoji: string) => {
    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }
    setAnimatingEmoji(emoji);
    try {
      await toggleReaction({ chapterId, body: { emoji } }).unwrap();
      setSelectedEmoji((prev) => (prev === emoji ? null : emoji));
    } catch (e) {
      const err = e as { status?: number };
      if (err?.status === 404) return; // эндпоинт ещё не реализован на бэкенде
      console.error("Reaction error:", e);
    } finally {
      setAnimatingEmoji(null);
    }
  };

  const handleRating = async (value: number) => {
    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }
    try {
      await setRating({ chapterId, body: { value } }).unwrap();
    } catch (e) {
      const err = e as { status?: number };
      if (err?.status === 404) return; // эндпоинт ещё не реализован на бэкенде
      console.error("Rating error:", e);
    }
  };

  const isLoading = isReactionLoading || isRatingLoading;

  if (apiUnavailable) {
    return (
      <div className="rounded-xl border border-[var(--border)]/30 bg-[var(--card)]/60 px-4 py-3">
        <p className="text-sm text-[var(--muted-foreground)]">
          Оценка и реакции появятся после обновления сервера.
        </p>
      </div>
    );
  }

  const showRatingBlock = ratingAvailable;
  const showReactionsBlock = !reactionsUnavailable;

  return (
    <div className="rounded-xl border border-[var(--border)]/30 bg-[var(--card)]/60 px-4 py-4 sm:px-5 sm:py-4">
      {/* Compact header: one line with label + optional total */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-sm text-[var(--muted-foreground)]">Оцените главу</span>
        {(totalReactions > 0 || ratingCount > 0) && (
          <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
            {totalReactions + ratingCount} отзывов
          </span>
        )}
      </div>

      {/* Star rating — компактная строка */}
      {showRatingBlock && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-0.5" role="group" aria-label="Рейтинг от 1 до 5">
            {[1, 2, 3, 4, 5].map((value) => {
              const current = userRating ?? 0;
              const isSelected = value <= current;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!mounted || !isAuthenticated || isRatingLoading}
                  onClick={() => handleRating(value)}
                  className={`p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected
                      ? "text-amber-500"
                      : "text-[var(--muted-foreground)]/60 hover:text-amber-500/70"
                  }`}
                  title={`${value} из 5`}
                >
                  <Star
                    className="w-5 h-5"
                    fill={isSelected ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={1.5}
                  />
                </button>
              );
            })}
          </div>
          {averageRating != null && ratingCount > 0 && (
            <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
              {averageRating.toFixed(1)} · {ratingCount}
            </span>
          )}
        </div>
      )}

      {ratingUnavailable && !reactionsUnavailable && (
        <p className="text-xs text-[var(--muted-foreground)] mb-3">Рейтинг временно недоступен.</p>
      )}

      {/* Reactions — только эмодзи + счётчик, без подписей */}
      {showReactionsBlock && (
        <div className="flex flex-wrap gap-1.5">
          {CHAPTER_ALLOWED_REACTION_EMOJIS.map((emoji) => {
            const isSelected = selectedEmoji === emoji;
            const count = countByEmoji[emoji] ?? 0;
            const isAnimating = animatingEmoji === emoji;

            return (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReaction(emoji)}
                disabled={isLoading}
                title={EMOJI_LABELS[emoji] ?? emoji}
                className={`flex items-center gap-1.5 min-w-[2.25rem] h-9 px-2 rounded-lg transition-colors active:scale-95 disabled:opacity-50 ${
                  isSelected
                    ? "bg-[var(--primary)]/15 text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)]/80 hover:text-[var(--foreground)]"
                } ${isAnimating ? "scale-105" : ""}`}
              >
                {isLoading && animatingEmoji === emoji ? (
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                ) : (
                  <span className="text-base leading-none">{emoji}</span>
                )}
                {count > 0 && (
                  <span className="text-xs text-[var(--muted-foreground)] tabular-nums min-w-[1rem] text-right">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {reactionsUnavailable && ratingAvailable && (
        <p className="text-xs text-[var(--muted-foreground)]">Реакции временно недоступны.</p>
      )}

      {selectedEmoji && (
        <p className="mt-3 pt-3 border-t border-[var(--border)]/20 text-xs text-[var(--muted-foreground)]">
          Ваша реакция: {selectedEmoji} {EMOJI_LABELS[selectedEmoji] ?? selectedEmoji}
        </p>
      )}
    </div>
  );
}
