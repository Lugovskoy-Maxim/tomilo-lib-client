"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  UserX,
} from "lucide-react";
import Image from "next/image";

import { useToast } from "@/hooks/useToast";
import {
  useCleanupSpamCommentsMutation,
  useGetSpamCommentsQuery,
  useGetSpamRestrictedUsersQuery,
  useGetSpamStatsQuery,
  useMarkCommentAsNotSpamMutation,
  useMarkCommentAsSpamMutation,
  useRemoveSpamRestrictionMutation,
} from "@/store/api/adminApi";
import Input from "@/shared/ui/input";
import Button from "@/shared/ui/button";
import { ConfirmModal, AdminModal } from "./ui";
import { SpamComment, SpamRestrictedUser } from "@/types/spam";
import { CommentEntityType } from "@/types/comment";
import { useGetChapterByIdQuery } from "@/store/api/chaptersApi";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { getTitlePath } from "@/lib/title-paths";
import { getCoverUrls } from "@/lib/asset-url";

type SpamSubTab = "comments" | "restricted-users";

const DEFAULT_AVATAR = "/logo/ring_logo.png";

function isValidAvatarUrl(avatar: string | undefined): boolean {
  if (!avatar) return false;
  if (avatar.includes("undefined") || avatar.includes("null")) return false;
  return true;
}

function isStaticAsset(path: string): boolean {
  return path.startsWith("/logo/") || path.startsWith("/images/") || path.startsWith("/icons/");
}

function getUserAvatarFromSpamComment(comment: SpamComment): string {
  if (typeof comment.userId === "string" || comment.userId == null) return DEFAULT_AVATAR;
  const avatar = comment.userId.avatar;
  return isValidAvatarUrl(avatar) ? avatar! : DEFAULT_AVATAR;
}

function normalizeUrl(url: string): string {
  return getCoverUrls(url, "").primary;
}

function CommentEntityLink({ comment }: { comment: SpamComment }) {
  const titleIdFromInfo = comment.titleInfo?._id;
  const slugFromInfo = comment.titleInfo?.slug;

  const { data: titleData } = useGetTitleByIdQuery(
    { id: comment.entityId },
    { skip: comment.entityType !== CommentEntityType.TITLE || !!comment.titleInfo },
  );

  const { data: chapterData } = useGetChapterByIdQuery(comment.entityId, {
    skip: comment.entityType !== CommentEntityType.CHAPTER || !!titleIdFromInfo,
  });

  const resolvedTitleId =
    (titleIdFromInfo ||
      (chapterData?.titleId && typeof chapterData.titleId === "object"
        ? ((chapterData.titleId as { _id: string })._id as string)
        : (chapterData?.titleId as string))) ??
    "";

  const { data: titleDataForChapter } = useGetTitleByIdQuery(
    { id: resolvedTitleId },
    {
      skip: comment.entityType !== CommentEntityType.CHAPTER || !resolvedTitleId || !!slugFromInfo,
    },
  );

  const titleName = comment.titleInfo?.name || titleData?.name;
  const titleSlug = comment.titleInfo?.slug || titleData?.slug;
  const titleId = comment.titleInfo?._id || titleData?._id || comment.entityId;

  if (comment.entityType === CommentEntityType.TITLE && (titleName || titleSlug || titleId)) {
    const href = getTitlePath({ _id: titleId, slug: titleSlug });
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline"
      >
        {titleName || "Открыть тайтл"}
        <ExternalLink className="w-3 h-3" />
      </Link>
    );
  }

  if (comment.entityType === CommentEntityType.CHAPTER) {
    const slug = slugFromInfo ?? titleDataForChapter?.slug;
    const resolvedId = titleIdFromInfo ?? resolvedTitleId;
    const href = resolvedId || slug ? `/titles/${slug || resolvedId}/chapter/${comment.entityId}` : null;
    if (href) {
      return (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline"
        >
          {titleName || titleDataForChapter?.name
            ? `Глава: ${titleName || titleDataForChapter?.name}`
            : "К главе"}
          <ExternalLink className="w-3 h-3" />
        </Link>
      );
    }
    return <span className="text-[var(--muted-foreground)]">ID главы: {comment.entityId}</span>;
  }

  return <span className="text-[var(--muted-foreground)]">—</span>;
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

export function SpamSection() {
  const toast = useToast();

  const [subTab, setSubTab] = useState<SpamSubTab>("comments");

  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsLimit, setCommentsLimit] = useState(20);

  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit, setUsersLimit] = useState(20);

  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [reasonModalMode, setReasonModalMode] = useState<"spam" | "not-spam">("spam");
  const [reasonText, setReasonText] = useState("");
  const [reasonTargetCommentId, setReasonTargetCommentId] = useState<string | null>(null);

  const [cleanupConfirmOpen, setCleanupConfirmOpen] = useState(false);

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useGetSpamStatsQuery();
  const {
    data: spamCommentsData,
    isLoading: spamCommentsLoading,
    isError: spamCommentsError,
    refetch: refetchSpamComments,
  } = useGetSpamCommentsQuery({ page: commentsPage, limit: commentsLimit });

  const {
    data: restrictedUsersData,
    isLoading: restrictedUsersLoading,
    isError: restrictedUsersError,
    refetch: refetchRestrictedUsers,
  } = useGetSpamRestrictedUsersQuery({ page: usersPage, limit: usersLimit });

  const [markAsSpam, { isLoading: isMarkingAsSpam }] = useMarkCommentAsSpamMutation();
  const [markAsNotSpam, { isLoading: isMarkingAsNotSpam }] = useMarkCommentAsNotSpamMutation();
  const [cleanupSpamComments, { isLoading: isCleaningUp }] = useCleanupSpamCommentsMutation();
  const [removeRestriction, { isLoading: isRemovingRestriction }] = useRemoveSpamRestrictionMutation();

  const stats = statsData?.data;

  const spamComments = useMemo(() => spamCommentsData?.data?.comments ?? [], [spamCommentsData]);
  const spamCommentsPagination = spamCommentsData?.data?.pagination;

  const restrictedUsers = useMemo(
    () => restrictedUsersData?.data?.users ?? [],
    [restrictedUsersData],
  );
  const restrictedUsersPagination = restrictedUsersData?.data?.pagination;

  const openReasonModal = useCallback(
    (mode: "spam" | "not-spam", commentId: string) => {
      setReasonModalMode(mode);
      setReasonTargetCommentId(commentId);
      setReasonText(mode === "spam" ? "Помечено администратором" : "Помечено как не спам администратором");
      setReasonModalOpen(true);
    },
    [],
  );

  const closeReasonModal = useCallback(() => {
    setReasonModalOpen(false);
    setReasonTargetCommentId(null);
    setReasonText("");
  }, []);

  const submitReason = useCallback(async () => {
    if (!reasonTargetCommentId) return;
    const reason = reasonText.trim();
    if (!reason) {
      toast.error("Укажите причину");
      return;
    }

    try {
      if (reasonModalMode === "spam") {
        await markAsSpam({ id: reasonTargetCommentId, reason }).unwrap();
        toast.success("Комментарий помечен как спам");
      } else {
        await markAsNotSpam({ id: reasonTargetCommentId, reason }).unwrap();
        toast.success("Комментарий помечен как не спам");
      }
      closeReasonModal();
      refetchStats();
      refetchSpamComments();
    } catch {
      toast.error("Не удалось выполнить действие");
    }
  }, [
    reasonTargetCommentId,
    reasonText,
    reasonModalMode,
    markAsSpam,
    markAsNotSpam,
    toast,
    closeReasonModal,
    refetchStats,
    refetchSpamComments,
  ]);

  const handleCleanup = useCallback(async () => {
    try {
      const res = await cleanupSpamComments().unwrap();
      toast.success(`Очищено: ${res.data?.deletedCount ?? 0}`);
      setCleanupConfirmOpen(false);
      refetchStats();
      refetchSpamComments();
    } catch {
      toast.error("Не удалось очистить спам-комментарии");
    }
  }, [cleanupSpamComments, toast, refetchStats, refetchSpamComments]);

  const handleRemoveRestriction = useCallback(
    async (u: SpamRestrictedUser) => {
      if (!u._id) return;
      try {
        await removeRestriction(u._id).unwrap();
        toast.success("Ограничение снято");
        refetchStats();
        refetchRestrictedUsers();
      } catch {
        toast.error("Не удалось снять ограничение");
      }
    },
    [removeRestriction, toast, refetchStats, refetchRestrictedUsers],
  );

  const handleRefresh = useCallback(async () => {
    if (subTab === "comments") {
      refetchStats();
      refetchSpamComments();
    } else {
      refetchStats();
      refetchRestrictedUsers();
    }
  }, [subTab, refetchSpamComments, refetchRestrictedUsers, refetchStats]);

  return (
    <div className="flex-1 flex flex-col space-y-4 rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] inline-flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[var(--primary)]" />
            Антиспам
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Управление спам-комментариями и временными ограничениями пользователей.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            title="Обновить"
          >
            <RefreshCw className={`w-4 h-4 ${statsLoading ? "animate-spin" : ""}`} />
          </button>
          {subTab === "comments" && (
            <button
              onClick={() => setCleanupConfirmOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
              title="Удалить все комментарии, помеченные как спам"
            >
              <Trash2 className="w-4 h-4" />
              Очистить спам
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatBox label="Спам-комментариев" value={stats?.totalSpamComments ?? "—"} />
        <StatBox label="Ограниченных пользователей" value={stats?.totalRestrictedUsers ?? "—"} />
        <StatBox label="Недавний спам" value={stats?.recentSpamComments ?? "—"} />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setSubTab("comments")}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
            subTab === "comments"
              ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
              : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          }`}
        >
          Спам-комментарии
        </button>
        <button
          onClick={() => setSubTab("restricted-users")}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
            subTab === "restricted-users"
              ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
              : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          }`}
        >
          Ограниченные пользователи
        </button>
      </div>

      {subTab === "comments" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-auto">
              <select
                value={commentsLimit}
                onChange={e => {
                  setCommentsLimit(Number(e.target.value));
                  setCommentsPage(1);
                }}
                className="admin-input"
                title="Комментариев на страницу"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              {spamCommentsPagination
                ? `Страница ${spamCommentsPagination.page} из ${spamCommentsPagination.pages} • Всего: ${spamCommentsPagination.total}`
                : ""}
            </div>
          </div>

          {spamCommentsLoading ? (
            <div className="text-center py-10 text-[var(--muted-foreground)]">Загрузка...</div>
          ) : spamCommentsError ? (
            <div className="text-center py-10 text-red-500">Ошибка загрузки</div>
          ) : spamComments.length === 0 ? (
            <div className="text-center py-10 text-[var(--muted-foreground)]">
              Спам-комментарии не найдены
            </div>
          ) : (
            <div className="grid gap-3">
              {spamComments.map(comment => (
                <article
                  key={comment._id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)]/70 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Image
                        src={
                          isStaticAsset(getUserAvatarFromSpamComment(comment))
                            ? getUserAvatarFromSpamComment(comment)
                            : normalizeUrl(getUserAvatarFromSpamComment(comment))
                        }
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="w-10 h-10 rounded-full object-cover bg-[var(--secondary)]"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">
                          {typeof comment.userId !== "string" ? comment.userId?.username : "Пользователь"}
                        </p>
                        <p className="text-[10px] text-[var(--muted-foreground)] font-mono truncate">
                          {comment._id}
                        </p>
                        <div className="mt-1 text-xs">
                          <span className="text-[var(--muted-foreground)]">К месту: </span>
                          <CommentEntityLink comment={comment} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openReasonModal("not-spam", comment._id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                        disabled={isMarkingAsNotSpam}
                        title="Пометить как не спам"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Не спам
                      </button>
                      <button
                        onClick={() => openReasonModal("spam", comment._id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                        disabled={isMarkingAsSpam}
                        title="Пере-пометить как спам (обновить причину)"
                      >
                        <XCircle className="w-4 h-4" />
                        Спам
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-[var(--foreground)] whitespace-pre-wrap">
                    {comment.content}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
                    <span className="px-2 py-1 rounded-full bg-[var(--secondary)]">
                      score: <strong className="text-[var(--foreground)]">{comment.spamScore ?? 0}</strong>
                    </span>
                    <span className="px-2 py-1 rounded-full bg-[var(--secondary)]">
                      checked:{" "}
                      <strong className="text-[var(--foreground)]">
                        {comment.isSpamChecked ? "да" : "нет"}
                      </strong>
                    </span>
                    <span className="px-2 py-1 rounded-full bg-[var(--secondary)]">
                      detected:{" "}
                      <strong className="text-[var(--foreground)]">
                        {comment.spamDetectedAt ? new Date(comment.spamDetectedAt).toLocaleString("ru-RU") : "—"}
                      </strong>
                    </span>
                    {comment.spamReasons?.length ? (
                      <span className="px-2 py-1 rounded-full bg-[var(--secondary)]">
                        reasons:{" "}
                        <strong className="text-[var(--foreground)]">
                          {comment.spamReasons.join(", ")}
                        </strong>
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}

          {spamCommentsPagination && spamCommentsPagination.pages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommentsPage(p => Math.max(1, p - 1))}
                disabled={commentsPage === 1}
              >
                Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommentsPage(p => Math.min(spamCommentsPagination.pages, p + 1))}
                disabled={commentsPage >= spamCommentsPagination.pages}
              >
                Вперед
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-auto">
              <select
                value={usersLimit}
                onChange={e => {
                  setUsersLimit(Number(e.target.value));
                  setUsersPage(1);
                }}
                className="admin-input"
                title="Пользователей на страницу"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              {restrictedUsersPagination
                ? `Страница ${restrictedUsersPagination.page} из ${restrictedUsersPagination.pages} • Всего: ${restrictedUsersPagination.total}`
                : ""}
            </div>
          </div>

          {restrictedUsersLoading ? (
            <div className="text-center py-10 text-[var(--muted-foreground)]">Загрузка...</div>
          ) : restrictedUsersError ? (
            <div className="text-center py-10 text-red-500">Ошибка загрузки</div>
          ) : restrictedUsers.length === 0 ? (
            <div className="text-center py-10 text-[var(--muted-foreground)]">
              Ограниченных пользователей не найдено
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--secondary)]/60">
                  <tr>
                    <th className="px-3 py-2 text-left">Пользователь</th>
                    <th className="px-3 py-2 text-left">Warnings</th>
                    <th className="px-3 py-2 text-left">Ограничен до</th>
                    <th className="px-3 py-2 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {restrictedUsers.map(u => (
                    <tr key={u._id} className="hover:bg-[var(--accent)]/30">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Image
                            src={
                              isStaticAsset(u.avatar || DEFAULT_AVATAR)
                                ? (isValidAvatarUrl(u.avatar) ? u.avatar! : DEFAULT_AVATAR)
                                : normalizeUrl(isValidAvatarUrl(u.avatar) ? u.avatar! : DEFAULT_AVATAR)
                            }
                            alt=""
                            width={28}
                            height={28}
                            unoptimized
                            className="w-7 h-7 rounded-full object-cover bg-[var(--secondary)]"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-[var(--foreground)] truncate">
                              {u.username || "Пользователь"}
                            </div>
                            {u.email ? (
                              <div className="text-xs text-[var(--muted-foreground)] truncate">{u.email}</div>
                            ) : null}
                            <div className="text-[10px] text-[var(--muted-foreground)] font-mono truncate">
                              {u._id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">{u.spamWarnings ?? 0}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {u.commentRestrictedUntil ? new Date(u.commentRestrictedUntil).toLocaleString("ru-RU") : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleRemoveRestriction(u)}
                          disabled={isRemovingRestriction}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                          title="Снять ограничение"
                        >
                          <UserX className="w-4 h-4" />
                          Снять
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {restrictedUsersPagination && restrictedUsersPagination.pages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                disabled={usersPage === 1}
              >
                Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUsersPage(p => Math.min(restrictedUsersPagination.pages, p + 1))}
                disabled={usersPage >= restrictedUsersPagination.pages}
              >
                Вперед
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={cleanupConfirmOpen}
        onClose={() => setCleanupConfirmOpen(false)}
        onConfirm={handleCleanup}
        title="Очистить спам-комментарии"
        message="Удалить все комментарии, помеченные как спам? Это действие нельзя отменить."
        confirmText={isCleaningUp ? "Очистка..." : "Удалить"}
        isLoading={isCleaningUp}
      />

      <AdminModal
        isOpen={reasonModalOpen}
        onClose={closeReasonModal}
        title={reasonModalMode === "spam" ? "Пометить как спам" : "Пометить как не спам"}
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">
            Причина будет записана в `spamReasons` на сервере.
          </p>
          <Input
            type="text"
            value={reasonText}
            onChange={e => setReasonText(e.target.value)}
            placeholder="Причина..."
          />
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button
              onClick={closeReasonModal}
              className="px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={submitReason}
              disabled={(reasonModalMode === "spam" ? isMarkingAsSpam : isMarkingAsNotSpam) || !reasonText.trim()}
              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Сохранить
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

