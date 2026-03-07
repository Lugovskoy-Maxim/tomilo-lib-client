"use client";

import React, { useState } from "react";
import { Bot, RefreshCw, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { adminApi } from "@/store/api/adminApi";
import { useToast } from "@/hooks/useToast";
import type { AdminUserDetails } from "@/types/admin";
import Link from "next/link";

const PAGE_SIZE = 20;

// Fallbacks when RTK Query hooks are missing (e.g. Turbopack chunk loading)
function useEmptyBotStats() {
  return { data: undefined };
}
function useEmptySuspiciousUsers(_opts: { page: number; limit: number }) {
  return { data: undefined, isLoading: false, refetch: () => {} };
}
function useEmptyResetBotStatus(): [(id: string) => Promise<{ unwrap: () => Promise<unknown> }>, { isLoading: boolean }] {
  return [async () => ({ unwrap: async () => {} }), { isLoading: false }];
}

const useGetBotStatsQuerySafe = typeof adminApi.useGetBotStatsQuery === "function" ? adminApi.useGetBotStatsQuery : useEmptyBotStats;
const useGetSuspiciousUsersQuerySafe = typeof adminApi.useGetSuspiciousUsersQuery === "function" ? adminApi.useGetSuspiciousUsersQuery : useEmptySuspiciousUsers;
const useResetBotStatusMutationSafe = typeof adminApi.useResetBotStatusMutation === "function" ? adminApi.useResetBotStatusMutation : useEmptyResetBotStatus;

export function BotDetectionSection() {
  const [page, setPage] = useState(1);
  const { data: statsData } = useGetBotStatsQuerySafe();
  const { data: usersData, isLoading, refetch } = useGetSuspiciousUsersQuerySafe({ page, limit: PAGE_SIZE });
  const [resetBotStatus, { isLoading: isResetting }] = useResetBotStatusMutationSafe();
  const toast = useToast();

  const stats = statsData?.data;
  const users: AdminUserDetails[] = usersData?.data?.users ?? [];
  const total = usersData?.data?.total ?? users.length;

  const handleReset = async (userId: string) => {
    try {
      await resetBotStatus(userId).unwrap();
      toast.success("Статус бота сброшен");
      refetch();
    } catch (e: unknown) {
      const msg = (e as { data?: { message?: string } })?.data?.message ?? "Не удалось сбросить статус";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Сводка */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {typeof stats.suspicious === "number" && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Подозрительных</p>
                <p className="text-xl font-semibold text-[var(--foreground)]">{stats.suspicious}</p>
              </div>
            </div>
          )}
          {typeof stats.total === "number" && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
                <Bot className="w-5 h-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Всего проверено</p>
                <p className="text-xl font-semibold text-[var(--foreground)]">{stats.total}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Список */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Подозрительные пользователи</h2>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] hover:bg-[var(--accent)] transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden />
            Обновить
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--muted-foreground)]" aria-hidden />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <ShieldCheck className="w-12 h-12 text-[var(--muted-foreground)]/50 mb-3" aria-hidden />
            <p className="text-[var(--muted-foreground)] font-medium">Нет подозрительных пользователей</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Пользователи, помеченные системой как подозрительные, появятся здесь.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="text-left py-3 px-4 font-medium text-[var(--foreground)]">Пользователь</th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--foreground)] hidden sm:table-cell">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--foreground)] hidden md:table-cell">Создан</th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--foreground)]">Действие</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]/20">
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin?tab=users`}
                        className="text-[var(--primary)] hover:underline font-medium"
                      >
                        {user.username ?? user._id}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-[var(--muted-foreground)] hidden sm:table-cell truncate max-w-[200px]">
                      {(user as AdminUserDetails & { email?: string }).email ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[var(--muted-foreground)] hidden md:table-cell">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleReset(user._id)}
                        disabled={isResetting}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-60"
                      >
                        {isResetting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
                        )}
                        Сбросить статус
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-4 p-4 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--muted-foreground)]">
              Показано {users.length} из {total}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--background)] disabled:opacity-50"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={users.length < PAGE_SIZE}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--background)] disabled:opacity-50"
              >
                Вперёд
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
