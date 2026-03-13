"use client";

import { useState, useMemo, useEffect } from "react";
import { Loader2, Star, MessageCircle, LogIn } from "lucide-react";
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

const RATING_VALUES = Array.from({ length: CHAPTER_RATING_MAX }, (_, i) => i + 1) as number[];

export function ChapterReactions({
  chapterId,
  onLoginRequired,
  initialRating,
  initialReactions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- titleId в пропсах для API, не используется в компоненте
  ..._rest
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
    // ALLOWED_EMOJIS_SET стабилен (константа из Set), не добавляем в deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  const {
    data: ratingData,
    error: ratingError,
    isError: isRatingError,
  } = useGetChapterRatingQuery(chapterId, { skip: !chapterId });
  const [setRating, { isLoading: isRatingLoading }] = useSetChapterRatingMutation();

  const {
    data: countData,
    error: countError,
    isError: isCountError,
  } = useGetChapterReactionsCountQuery(chapterId, { skip: !chapterId });

  const ratingUnavailable = isRatingError && (ratingError as { status?: number })?.status === 404;
  const reactionsUnavailable = isCountError && (countError as { status?: number })?.status === 404;
  const apiUnavailable = ratingUnavailable && reactionsUnavailable;

  const [toggleReaction, { isLoading: isReactionLoading }] = useToggleChapterReactionMutation();

  // Приоритет у ответа API (там есть userRating при авторизации), иначе — initialRating из главы
  const rating = ratingData ?? initialRating ?? null;
  const averageRating =
    rating?.averageRating ??
    (rating?.ratingSum != null && (rating?.ratingCount ?? 0) > 0
      ? rating.ratingSum! / (rating.ratingCount ?? 1)
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
          String(userRatingFromApi),
        );
      } catch {
        // ignore
      }
    }
  }, [chapterId, userRatingFromApi]);

  const reactionsList = countData?.data?.reactions ?? initialReactions ?? null;
  const userReactionFromApi =
    countData?.data?.userReaction != null && countData.data.userReaction !== ""
      ? ALLOWED_EMOJIS_SET.has(countData.data.userReaction)
        ? countData.data.userReaction
        : null
      : null;
  const displaySelectedEmoji = userReactionFromApi ?? selectedEmoji;

  useEffect(() => {
    if (userReactionFromApi != null) {
      setSelectedEmoji(userReactionFromApi);
      try {
        sessionStorage.setItem(`${CHAPTER_REACTION_STORAGE_KEY}_${chapterId}`, userReactionFromApi);
      } catch {
        // ignore
      }
    }
  }, [chapterId, userReactionFromApi]);

  const countByEmoji = useMemo(() => {
    const map: Record<string, number> = {};
    reactionsList?.forEach(r => {
      map[r.emoji] = r.count;
    });
    return map;
  }, [reactionsList]);

  const totalReactions = useMemo(
    () => Object.values(countByEmoji).reduce((a, b) => a + b, 0),
    [countByEmoji],
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
      <div className="rounded-2xl border border-[var(--border)]/40 bg-[var(--card)]/80 px-5 py-4 shadow-sm">
        <p className="text-sm text-[var(--muted-foreground)]">
          Оценка и реакции появятся после обновления сервера.
        </p>
      </div>
    );
  }

  const showRatingBlock = ratingAvailable;
  const showReactionsBlock = !reactionsUnavailable;
  const totalFeedback = totalReactions + ratingCount;

  return (
    <section
      className="rounded-2xl border border-[var(--border)]/40 bg-[var(--card)]/80 shadow-sm overflow-hidden"
      aria-label="Оценка и реакции на главу"
    >
      {/* Заголовок блока */}
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[var(--primary)]" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
              Оцените главу
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Ваше мнение помогает другим читателям
            </p>
          </div>
        </div>
        {totalFeedback > 0 && (
          <span className="flex-shrink-0 text-xs font-medium text-[var(--muted-foreground)] bg-[var(--secondary)]/80 px-2.5 py-1 rounded-full tabular-nums">
            {totalFeedback}{" "}
            {totalFeedback === 1 ? "отзыв" : totalFeedback < 5 ? "отзыва" : "отзывов"}
          </span>
        )}
      </div>

      <div className="px-5 pb-5 pt-4 space-y-5">
        {/* CTA для неавторизованных — рендерим только после mount, чтобы избежать hydration mismatch (isAuthenticated разный на сервере и клиенте) */}
        {!mounted ? (
          <div className="flex items-center gap-3 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/30 px-4 py-3">
            <div className="w-5 h-5 shrink-0 rounded bg-[var(--muted)]/30" aria-hidden />
            <div className="h-4 flex-1 max-w-[200px] rounded bg-[var(--muted)]/20" />
          </div>
        ) : !isAuthenticated ? (
          <div className="flex items-center gap-3 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/30 px-4 py-3">
            <LogIn className="w-5 h-5 text-[var(--muted-foreground)] shrink-0" aria-hidden />
            <p className="text-sm text-[var(--muted-foreground)]">
              Войдите, чтобы поставить оценку и реакцию — это займёт пару секунд.
            </p>
          </div>
        ) : null}

        {/* Рейтинг звёздами */}
        {showRatingBlock && mounted && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                Рейтинг
              </span>
              {averageRating != null && ratingCount > 0 && (
                <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
                  {averageRating.toFixed(1)} из {CHAPTER_RATING_MAX} · {ratingCount}{" "}
                  {ratingCount === 1 ? "оценка" : ratingCount < 5 ? "оценки" : "оценок"}
                </span>
              )}
            </div>
            <div
              className="w-full max-w-[500px] min-w-0 sm:min-w-[355px] mx-auto flex flex-nowrap items-center justify-between gap-0.5 sm:gap-1"
              role="group"
              aria-label={`Рейтинг от 1 до ${CHAPTER_RATING_MAX}`}
            >
              {RATING_VALUES.map(value => {
                const current = userRating ?? 0;
                const isSelected = value <= current;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!mounted || !isAuthenticated || isRatingLoading}
                    onClick={() => handleRating(value)}
                    className={`flex-shrink-0 flex items-center justify-center min-w-[28px] w-7 h-7 sm:min-w-[32px] sm:w-8 sm:h-8 md:min-w-0 md:w-auto md:min-h-[44px] md:p-2 rounded-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--secondary)]/60 ${
                      isSelected
                        ? "text-[var(--primary)]"
                        : "text-[var(--muted-foreground)]/50 hover:text-[var(--muted-foreground)]"
                    }`}
                    title={`${value} из ${CHAPTER_RATING_MAX}`}
                  >
                    <Star
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"
                      fill={isSelected ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </div>
            {hasUserRating && (
              <p className="text-xs text-[var(--muted-foreground)]">
                Ваша оценка:{" "}
                <span className="font-semibold text-[var(--foreground)] tabular-nums">
                  {Number(userRating)} из {CHAPTER_RATING_MAX}
                </span>
              </p>
            )}
          </div>
        )}

        {ratingUnavailable && !reactionsUnavailable && mounted && (
          <p className="text-xs text-[var(--muted-foreground)]">Рейтинг временно недоступен.</p>
        )}

        {/* Реакции — эмодзи-кнопки с счётчиками */}
        {showReactionsBlock && mounted && (
          <div className="space-y-3">
            <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Реакции
            </span>
            <div className="w-full max-w-[500px] min-w-0 sm:min-w-[355px] mx-auto flex flex-wrap gap-2 sm:gap-2">
              {CHAPTER_ALLOWED_REACTION_EMOJIS.map(emoji => {
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
                    className={`flex items-center gap-1 sm:gap-2 min-h-[44px] h-11 pl-3 pr-2.5 sm:h-10 sm:min-h-0 sm:pl-3 sm:pr-2.5 rounded-xl border transition-all duration-150 active:scale-[0.98] disabled:opacity-50 ${
                      isSelected
                        ? "bg-[var(--primary)]/15 border-[var(--primary)]/30 text-[var(--foreground)] shadow-sm"
                        : "border-[var(--border)]/50 bg-[var(--background)]/50 text-[var(--muted-foreground)] hover:border-[var(--border)] hover:bg-[var(--secondary)]/60 hover:text-[var(--foreground)]"
                    } ${isAnimating ? "scale-105 ring-2 ring-[var(--primary)]/20" : ""}`}
                  >
                    {isLoading && animatingEmoji === emoji ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 animate-spin" />
                    ) : (
                      <span className="text-base sm:text-lg leading-none select-none">{emoji}</span>
                    )}
                    {count > 0 && (
                      <span
                        className={`text-[10px] sm:text-xs font-medium tabular-nums min-w-[1rem] sm:min-w-[1.25rem] text-center ${
                          isSelected ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {reactionsUnavailable && ratingAvailable && mounted && (
          <p className="text-xs text-[var(--muted-foreground)]">Реакции временно недоступны.</p>
        )}
      </div>
    </section>
  );
}
