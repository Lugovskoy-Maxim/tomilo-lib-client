"use client";

import { useState, useMemo, useEffect } from "react";
import { Loader2, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  CHAPTER_ALLOWED_REACTION_EMOJIS,
  CHAPTER_RATING_MAX,
  type ChapterReactionCount,
} from "@/types/chapter";
import type { ChapterRatingResponse } from "@/types/chapter";
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
  /** Рейтинг из основной информации о главе (если бэкенд вернул в ответе главы) */
  initialRating?: ChapterRatingResponse | null;
  /** Реакции из основной информации о главе (если бэкенд вернул в ответе главы) */
  initialReactions?: ChapterReactionCount[] | null;
}

const RATING_VALUES = Array.from(
  { length: CHAPTER_RATING_MAX },
  (_, i) => i + 1
) as number[];

export function ChapterReactions({
  chapterId,
  titleId: _titleId,
  onLoginRequired,
  initialRating,
  initialReactions,
}: ChapterReactionsProps) {
  const CHAPTER_RATING_STORAGE_KEY = "chapter_user_rating";
  const CHAPTER_REACTION_STORAGE_KEY = "chapter_user_reaction";
  const ALLOWED_EMOJIS_SET = new Set<string>(CHAPTER_ALLOWED_REACTION_EMOJIS);

  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(() => {
    if (typeof window === "undefined" || !chapterId) return null;
    try {
      const raw = sessionStorage.getItem(`${CHAPTER_REACTION_STORAGE_KEY}_${chapterId}`);
      return raw && ALLOWED_EMOJIS_SET.has(raw) ? raw : null;
    } catch {
      return null;
    }
  });
  const [animatingEmoji, setAnimatingEmoji] = useState<string | null>(null);
  const [localUserRating, setLocalUserRating] = useState<number | null>(() => {
    if (typeof window === "undefined" || !chapterId) return null;
    try {
      const raw = sessionStorage.getItem(`${CHAPTER_RATING_STORAGE_KEY}_${chapterId}`);
      if (raw === null) return null;
      const n = Number(raw);
      return n >= 1 && n <= CHAPTER_RATING_MAX ? n : null;
    } catch {
      return null;
    }
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!chapterId) return;
    try {
      const raw = sessionStorage.getItem(`${CHAPTER_RATING_STORAGE_KEY}_${chapterId}`);
      if (raw !== null) {
        const n = Number(raw);
        if (n >= 1 && n <= CHAPTER_RATING_MAX) setLocalUserRating(n);
      }
      const emoji = sessionStorage.getItem(`${CHAPTER_REACTION_STORAGE_KEY}_${chapterId}`);
      setSelectedEmoji(emoji && ALLOWED_EMOJIS_SET.has(emoji) ? emoji : null);
    } catch {
      // ignore
    }
  }, [chapterId]);

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

  // Приоритет у ответа API (там есть userRating при авторизации), иначе — initialRating из главы
  const rating = ratingData ?? initialRating ?? null;
  const averageRating = rating?.averageRating ?? (rating?.ratingSum != null && (rating?.ratingCount ?? 0) > 0
    ? (rating.ratingSum! / (rating.ratingCount ?? 1))
    : null);
  const ratingCount = rating?.ratingCount ?? 0;
  const userRatingFromApi = rating?.userRating != null ? Number(rating.userRating) : null;
  const ratingAvailable = !ratingUnavailable;
  const userRating = userRatingFromApi ?? localUserRating;
  const hasUserRating = userRating != null && userRating >= 1;

  useEffect(() => {
    if (userRatingFromApi != null) {
      setLocalUserRating(userRatingFromApi);
      try {
        sessionStorage.setItem(
          `${CHAPTER_RATING_STORAGE_KEY}_${chapterId}`,
          String(userRatingFromApi)
        );
      } catch {
        // ignore
      }
    }
  }, [chapterId, userRatingFromApi]);

  const reactionsList = countData?.data?.reactions ?? initialReactions ?? null;
  const userReactionFromApi =
    countData?.data?.userReaction != null && countData.data.userReaction !== ""
      ? (ALLOWED_EMOJIS_SET.has(countData.data.userReaction) ? countData.data.userReaction : null)
      : null;
  const displaySelectedEmoji = userReactionFromApi ?? selectedEmoji;

  useEffect(() => {
    if (userReactionFromApi != null) {
      setSelectedEmoji(userReactionFromApi);
      try {
        sessionStorage.setItem(
          `${CHAPTER_REACTION_STORAGE_KEY}_${chapterId}`,
          userReactionFromApi
        );
      } catch {
        // ignore
      }
    }
  }, [chapterId, userReactionFromApi]);

  const countByEmoji = useMemo(() => {
    const map: Record<string, number> = {};
    reactionsList?.forEach((r) => {
      map[r.emoji] = r.count;
    });
    return map;
  }, [reactionsList]);

  const totalReactions = useMemo(
    () => Object.values(countByEmoji).reduce((a, b) => a + b, 0),
    [countByEmoji]
  );

  const handleReaction = async (emoji: string) => {
    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }
    const prev = displaySelectedEmoji;
    setAnimatingEmoji(emoji);
    const next = prev === emoji ? null : emoji;
    setSelectedEmoji(next);
    try {
      if (next) {
        sessionStorage.setItem(`${CHAPTER_REACTION_STORAGE_KEY}_${chapterId}`, next);
      } else {
        sessionStorage.removeItem(`${CHAPTER_REACTION_STORAGE_KEY}_${chapterId}`);
      }
    } catch {
      // ignore
    }
    try {
      await toggleReaction({ chapterId, body: { emoji } }).unwrap();
    } catch (e) {
      const err = e as { status?: number };
      setSelectedEmoji(prev);
      try {
        if (prev) {
          sessionStorage.setItem(`${CHAPTER_REACTION_STORAGE_KEY}_${chapterId}`, prev);
        } else {
          sessionStorage.removeItem(`${CHAPTER_REACTION_STORAGE_KEY}_${chapterId}`);
        }
      } catch {
        // ignore
      }
      if (err?.status === 404) return;
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
    setLocalUserRating(value);
    try {
      sessionStorage.setItem(`${CHAPTER_RATING_STORAGE_KEY}_${chapterId}`, String(value));
    } catch {
      // ignore
    }
    try {
      await setRating({ chapterId, body: { value } }).unwrap();
    } catch (e) {
      const err = e as { status?: number };
      if (err?.status === 404) return;
      setLocalUserRating(null);
      try {
        sessionStorage.removeItem(`${CHAPTER_RATING_STORAGE_KEY}_${chapterId}`);
      } catch {
        // ignore
      }
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
      {/* Заголовок и подсказка для неавторизованных */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-sm text-[var(--muted-foreground)]">Оцените главу</span>
        {(totalReactions > 0 || ratingCount > 0) && (
          <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
            {totalReactions + ratingCount} отзывов
          </span>
        )}
      </div>
      {!isAuthenticated && (
        <p className="text-xs text-[var(--muted-foreground)] mb-3">
          Войдите, чтобы поставить оценку и реакцию.
        </p>
      )}

      {/* Рейтинг 1–10: звёзды и явно "Ваша оценка" */}
      {showRatingBlock && (
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-0.5" role="group" aria-label={`Рейтинг от 1 до ${CHAPTER_RATING_MAX}`}>
              {RATING_VALUES.map((value) => {
                const current = userRating ?? 0;
                const isSelected = value <= current;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!mounted || !isAuthenticated || isRatingLoading}
                    onClick={() => handleRating(value)}
                    className={`p-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? "text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)]/70"
                    }`}
                    title={`${value} из ${CHAPTER_RATING_MAX}`}
                  >
                    <Star
                      className="w-4 h-4"
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
          {hasUserRating && (
            <p className="text-xs text-[var(--muted-foreground)] mt-1.5">
              Ваша оценка: <span className="font-medium text-[var(--foreground)] tabular-nums">{Number(userRating)} из {CHAPTER_RATING_MAX}</span>
            </p>
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
            const isSelected = displaySelectedEmoji === emoji;
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

      {displaySelectedEmoji && (
        <p className="mt-3 pt-3 border-t border-[var(--border)]/20 text-xs text-[var(--muted-foreground)]">
          Ваша реакция: {displaySelectedEmoji} {EMOJI_LABELS[displaySelectedEmoji] ?? displaySelectedEmoji}
        </p>
      )}
    </div>
  );
}
