"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useGetPendingCharactersForModerationQuery,
  useApproveCharacterMutation,
  useRejectCharacterMutation,
} from "@/store/api/charactersApi";
import { useToast } from "@/hooks/useToast";
import { User, Loader2, Check, X, ExternalLink } from "lucide-react";
import { normalizeAssetUrl } from "@/lib/asset-url";
import { characterRoleLabels, characterRoleColors } from "@/types/character";

export function CharacterModerationSection() {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useGetPendingCharactersForModerationQuery();
  const [approveCharacter, { isLoading: isApproving }] = useApproveCharacterMutation();
  const [rejectCharacter, { isLoading: isRejecting }] = useRejectCharacterMutation();
  const [actingId, setActingId] = useState<string | null>(null);

  const characters = data?.characters ?? [];
  const total = data?.total ?? 0;

  const handleApprove = async (id: string) => {
    setActingId(id);
    try {
      await approveCharacter(id).unwrap();
      toast.success("Персонаж одобрен");
    } catch {
      toast.error("Не удалось одобрить");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActingId(id);
    try {
      await rejectCharacter(id).unwrap();
      toast.success("Заявка отклонена");
    } catch {
      toast.error("Не удалось отклонить");
    } finally {
      setActingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
          <Loader2 className="w-5 h-5 animate-spin" />
          Загрузка...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 p-6 text-center">
        <p className="font-semibold text-[var(--destructive)]">Ошибка загрузки заявок</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-sm text-[var(--primary)] hover:underline"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Персонажи на модерации
          </h2>
          <span className="text-sm text-[var(--muted-foreground)] bg-[var(--background)]/50 px-2 py-0.5 rounded-full">
            {total}
          </span>
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <User className="w-12 h-12 mx-auto text-[var(--muted-foreground)]/50 mb-3" />
          <p className="text-[var(--muted-foreground)]">Нет заявок на модерацию</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <ul className="divide-y divide-[var(--border)]">
            {characters.map(char => {
              const doc = char as typeof char & { status?: string; pendingUpdate?: unknown; pendingImage?: string };
              const isNew = doc.status === "pending" && !doc.pendingUpdate && !doc.pendingImage;
              const hasRevisions = !!doc.pendingUpdate || !!doc.pendingImage;
              const acting = actingId === char._id;

              return (
                <li
                  key={char._id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-[var(--secondary)]/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[var(--secondary)] flex-shrink-0">
                      {(char.image || doc.pendingImage) && (
                        <Image
                          src={normalizeAssetUrl((doc.pendingImage as string) || char.image || "")}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                      {!char.image && !doc.pendingImage && (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-[var(--muted-foreground)]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[var(--foreground)] truncate">
                          {char.name}
                        </span>
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs rounded-full border ${characterRoleColors[char.role]}`}
                        >
                          {characterRoleLabels[char.role]}
                        </span>
                        {isNew && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Новый
                          </span>
                        )}
                        {hasRevisions && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                            Правки
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        Тайтл ID: {char.titleId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/characters/${char._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Открыть
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleApprove(char._id)}
                      disabled={acting || isApproving || isRejecting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {acting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Одобрить
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(char._id)}
                      disabled={acting || isApproving || isRejecting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/50 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Отклонить
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
