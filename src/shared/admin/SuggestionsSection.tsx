"use client";

import React, { useMemo, useState } from "react";
import { Trash2, Image as ImageIcon, ThumbsUp, Lightbulb, Check, Trophy } from "lucide-react";
import {
  useGetSuggestionsQuery,
  useDeleteSuggestionMutation,
  useUpdateSuggestionMutation,
  useAcceptSuggestionMutation,
  useAcceptWeeklyWinnersMutation,
  type SuggestedDecoration,
} from "@/store/api/shopApi";
import { getDecorationImageUrls } from "@/api/shop";
import { SUGGESTION_TYPES } from "@/lib/suggestions";
import OptimizedImage from "@/shared/optimized-image/OptimizedImage";
import { AdminCard } from "./ui";
import { ConfirmModal } from "./ui";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ErrorState as SharedErrorState } from "@/shared/error-state";

type StatusFilter = "all" | "pending" | "accepted" | "rejected";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "pending", label: "На голосовании" },
  { value: "accepted", label: "Принято" },
  { value: "rejected", label: "Отклонено" },
];

function statusLabel(status: SuggestedDecoration["status"]): string {
  switch (status) {
    case "accepted":
      return "Принято";
    case "rejected":
      return "Отклонено";
    default:
      return "На голосовании";
  }
}

function typeLabel(type: SuggestedDecoration["type"]): string {
  return SUGGESTION_TYPES.find((t) => t.id === type)?.label ?? type;
}

export function SuggestionsSection() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<SuggestedDecoration | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingVotesId, setEditingVotesId] = useState<string | null>(null);
  const [editingVotesValue, setEditingVotesValue] = useState<string>("");

  const { data: suggestions = [], isLoading, error, refetch } = useGetSuggestionsQuery(
    statusFilter === "pending"
      ? undefined
      : { status: statusFilter },
  );
  const [deleteSuggestion] = useDeleteSuggestionMutation();
  const [updateSuggestion, { isLoading: updatingVotes }] = useUpdateSuggestionMutation();
  const [acceptSuggestion, { isLoading: acceptingSuggestion }] = useAcceptSuggestionMutation();
  const [acceptWeeklyWinners, { isLoading: acceptingWeeklyWinners }] = useAcceptWeeklyWinnersMutation();

  const filtered = useMemo(() => {
    if (statusFilter === "all") return suggestions;
    return suggestions.filter((s) => s.status === statusFilter);
  }, [suggestions, statusFilter]);

  const handleSetVotes = async (id: string, value: number) => {
    const num = Math.max(0, Math.floor(value));
    try {
      await updateSuggestion({ id, votesCount: num }).unwrap();
      toast.success("Голоса обновлены");
      setEditingVotesId(null);
      refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Ошибка")
          : "Не удалось обновить голоса";
      toast.error(msg);
    }
  };

  const startEditVotes = (s: SuggestedDecoration) => {
    setEditingVotesId(s.id);
    setEditingVotesValue(String(s.votesCount));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteSuggestion(deleteTarget.id).unwrap();
      toast.success("Предложение удалено");
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Ошибка")
          : "Не удалось удалить";
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAcceptSuggestion = async (id: string, name: string) => {
    try {
      await acceptSuggestion(id).unwrap();
      toast.success(`Предложение «${name}» принято и добавлено в магазин`);
      refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Ошибка")
          : "Не удалось принять предложение";
      toast.error(msg);
    }
  };

  const handleAcceptWeeklyWinners = async () => {
    try {
      const result = await acceptWeeklyWinners().unwrap();
      toast.success(result.message || "Победители недели приняты");
      refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message ?? "Ошибка")
          : "Не удалось запустить отбор победителей";
      toast.error(msg);
    }
  };

  if (error) {
    const err = error as { status?: number; data?: { message?: string } };
    const msg =
      err?.status === 401 || err?.status === 403
        ? "Доступ запрещён"
        : typeof err?.data?.message === "string"
          ? err.data.message
          : "Не удалось загрузить предложения";
    return (
      <AdminCard className="p-4 sm:p-6">
        <SharedErrorState title="Ошибка загрузки" message={msg} />
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
          >
            Повторить попытку
          </button>
        </div>
      </AdminCard>
    );
  }

  return (
    <AdminCard className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" aria-hidden />
            Предложенные декорации
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Список предложений пользователей: голосование, принятые и отклонённые
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAcceptWeeklyWinners}
            disabled={acceptingWeeklyWinners}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trophy className="w-4 h-4" />
            {acceptingWeeklyWinners ? "Запуск..." : "Запустить отбор победителей"}
          </button>
          <Link
            href="/tomilo-shop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] border border-[var(--border)] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Магазин (блок предложений)
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === value
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)]">
          {suggestions.length === 0
            ? "Нет предложений от пользователей."
            : "Нет предложений с выбранным статусом."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">
                  Изображение
                </th>
                <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">
                  Название / Тип
                </th>
                <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">
                  Автор
                </th>
                <th className="text-center py-3 px-2 font-medium text-[var(--muted-foreground)]">
                  Голоса
                </th>
                <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">
                  Статус
                </th>
                <th className="text-right py-3 px-2 font-medium text-[var(--muted-foreground)]">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const urls = getDecorationImageUrls(s.imageUrl);
                return (
                  <tr
                    key={s.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--accent)]/30"
                  >
                    <td className="py-2 px-2">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--muted)] flex items-center justify-center">
                        {s.imageUrl ? (
                          <OptimizedImage
                            src={urls.primary}
                            fallbackSrc={urls.fallback}
                            alt=""
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-[var(--muted-foreground)]" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <span className="font-medium text-[var(--foreground)]">{s.name}</span>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        {typeLabel(s.type)}
                      </p>
                      {s.description && (
                        <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mt-0.5">
                          {s.description}
                        </p>
                      )}
                    </td>
                    <td className="py-2 px-2 text-[var(--muted-foreground)]">
                      {s.authorUsername
                        ? `${s.authorUsername}${s.authorLevel != null ? ` · ур. ${s.authorLevel}` : ""}`
                        : s.authorId
                          ? "ID автора"
                          : "—"}
                    </td>
                    <td className="py-2 px-2">
                      {editingVotesId === s.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={editingVotesValue}
                            onChange={(e) => setEditingVotesValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const v = parseInt(editingVotesValue, 10);
                                if (!Number.isNaN(v)) handleSetVotes(s.id, v);
                              }
                              if (e.key === "Escape") {
                                setEditingVotesId(null);
                                setEditingVotesValue(String(s.votesCount));
                              }
                            }}
                            className="w-14 px-1.5 py-1 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const v = parseInt(editingVotesValue, 10);
                              if (!Number.isNaN(v)) handleSetVotes(s.id, v);
                            }}
                            disabled={updatingVotes}
                            className="px-2 py-1 rounded text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVotesId(null);
                              setEditingVotesValue(String(s.votesCount));
                            }}
                            className="px-2 py-1 rounded text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditVotes(s)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--accent)] text-[var(--foreground)]"
                          title="Изменить голоса"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                          {s.votesCount}
                        </button>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                          s.status === "accepted"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : s.status === "rejected"
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}
                      >
                        {statusLabel(s.status)}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {s.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleAcceptSuggestion(s.id, s.name)}
                            disabled={acceptingSuggestion}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 disabled:opacity-50"
                            title="Принять предложение"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(s)}
                          className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
                          title="Удалить предложение"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Удалить предложение?"
        message={
          deleteTarget
            ? `Предложение «${deleteTarget.name}» будет удалено. Действие нельзя отменить.`
            : ""
        }
        confirmText="Удалить"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />
    </AdminCard>
  );
}
