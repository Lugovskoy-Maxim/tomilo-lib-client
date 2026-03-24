"use client";

import { useEffect, useRef } from "react";
import { useGetDailyQuestsQuery } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

type QuestSnap = { progress: number; target: number; claimed: boolean };

/**
 * Тост, когда ежедневное задание впервые достигло цели (награда ещё не забрана).
 * Слушает кеш RTK Query; срабатывает после любого refetch / инвалидации DailyQuests.
 */
export default function DailyQuestCompletionToasts() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const { data: response } = useGetDailyQuestsQuery(undefined, {
    skip: typeof window === "undefined" || !isAuthenticated,
  });

  const prevDateRef = useRef<string | null>(null);
  const prevByIdRef = useRef<Map<string, QuestSnap>>(new Map());

  useEffect(() => {
    if (!isAuthenticated) {
      prevDateRef.current = null;
      prevByIdRef.current = new Map();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!response?.success || response.data == null) return;

    const { date, quests } = response.data;
    if (!date) return;

    const list = quests ?? [];

    if (prevDateRef.current !== date) {
      prevDateRef.current = date;
      prevByIdRef.current = new Map(
        list.map(q => [
          q.id,
          { progress: q.progress, target: q.target, claimed: Boolean(q.claimedAt) },
        ]),
      );
      return;
    }

    const prev = prevByIdRef.current;

    for (const q of list) {
      const was = prev.get(q.id);
      const nowDone = q.progress >= q.target && !q.claimedAt;
      if (!was || !nowDone) continue;
      const wasDone = was.progress >= was.target && !was.claimed;
      if (!wasDone) {
        toast.success(
          `Ежедневное задание выполнено: «${q.name}». Заберите награду в профиле или в разделе «Игры».`,
        );
      }
    }

    prevByIdRef.current = new Map(
      list.map(q => [
        q.id,
        { progress: q.progress, target: q.target, claimed: Boolean(q.claimedAt) },
      ]),
    );
  }, [isAuthenticated, response, toast]);

  return null;
}
