"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
  ArrowUpDown,
  LayoutList,
  Grid3X3,
  ExternalLink,
  EyeOff,
  Eye,
  CheckSquare,
  Square,
  X,
  Download,
  RefreshCw,
  Edit,
  UserCircle,
  Save,
  Clock,
} from "lucide-react";
import Input from "@/shared/ui/input";
import Button from "@/shared/ui/button";
import { useToast } from "@/hooks/useToast";
import { useGetCommentsQuery, useUpdateCommentMutation } from "@/store/api/commentsApi";
import { useGetChapterByIdQuery } from "@/store/api/chaptersApi";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import {
  useGetCommentsStatsQuery,
  useBulkDeleteCommentsMutation,
  useDeleteCommentMutation,
} from "@/store/api/adminApi";
import { getTitlePath } from "@/lib/title-paths";
import { Comment, CommentEntityType, CommentReactionCount } from "@/types/comment";
import { ConfirmModal, AdminModal } from "./ui";
import Image from "next/image";
import { getCoverUrls } from "@/lib/asset-url";
import { formatUsernameDisplay } from "@/lib/username-display";

function displayCommentAuthor(username: string | undefined): string {
  return username ? formatUsernameDisplay(username) : "Пользователь";
}

type CommentsViewMode = "cards" | "list";
type SortMode = "newest" | "oldest" | "popular" | "controversial";
type VisibilityFilter = "all" | "visible" | "hidden";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн назад`;

  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

const DEFAULT_AVATAR = "/logo/ring_logo.png";

function isValidAvatarUrl(avatar: string | undefined): boolean {
  if (!avatar) return false;
  if (avatar.includes("undefined") || avatar.includes("null")) return false;
  return true;
}

function isStaticAsset(path: string): boolean {
  return path.startsWith("/logo/") || path.startsWith("/images/") || path.startsWith("/icons/");
}

function getUserAvatar(comment: Comment): string {
  if (typeof comment.userId === "string" || comment.userId == null) return DEFAULT_AVATAR;
  const avatar = comment.userId.avatar;
  return isValidAvatarUrl(avatar) ? avatar! : DEFAULT_AVATAR;
}

function getReactionsDisplay(reactions?: CommentReactionCount[]): string {
  if (!reactions || reactions.length === 0) return "";
  return reactions.map(r => `${r.emoji}${r.count}`).join(" ");
}

function CommentEntityLink({ comment }: { comment: Comment }) {
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
        ? (chapterData.titleId as { _id: string })._id
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
    const href =
      resolvedId || slug ? `/titles/${slug || resolvedId}/chapter/${comment.entityId}` : null;
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

  return null;
}

export function CommentsSection() {
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entityType, setEntityType] = useState<CommentEntityType | "all">("all");
  const [viewMode, setViewMode] = useState<CommentsViewMode>("cards");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [limit, setLimit] = useState(20);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Detail modal state
  const [detailComment, setDetailComment] = useState<Comment | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isEditSaving, setIsEditSaving] = useState(false);

  // Bulk hide modal
  const [bulkHideOpen, setBulkHideOpen] = useState(false);
  const [isBulkHiding, setIsBulkHiding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryParams = {
    entityId: "all" as const,
    page: currentPage,
    limit,
    includeReplies: true,
  };

  const titleQuery = useGetCommentsQuery(
    {
      ...queryParams,
      entityType: CommentEntityType.TITLE,
    },
    { skip: entityType === CommentEntityType.CHAPTER },
  );

  const chapterQuery = useGetCommentsQuery(
    {
      ...queryParams,
      entityType: CommentEntityType.CHAPTER,
    },
    { skip: entityType === CommentEntityType.TITLE },
  );

  const isLoading =
    entityType === CommentEntityType.CHAPTER
      ? chapterQuery.isLoading
      : entityType === CommentEntityType.TITLE
        ? titleQuery.isLoading
        : titleQuery.isLoading || chapterQuery.isLoading;
  const isError =
    entityType === CommentEntityType.CHAPTER
      ? chapterQuery.isError
      : entityType === CommentEntityType.TITLE
        ? titleQuery.isError
        : titleQuery.isError || chapterQuery.isError;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch от RTK, не оборачиваем в useCallback
  const refetch = () => {
    titleQuery.refetch();
    chapterQuery.refetch();
  };

  const paginationData = useMemo(() => {
    if (entityType === CommentEntityType.TITLE && titleQuery.data?.data) {
      return titleQuery.data.data;
    }
    if (entityType === CommentEntityType.CHAPTER && chapterQuery.data?.data) {
      return chapterQuery.data.data;
    }
    if (entityType === "all" && (titleQuery.data?.data || chapterQuery.data?.data)) {
      const t = titleQuery.data?.data;
      const c = chapterQuery.data?.data;
      const total = (t?.total ?? 0) + (c?.total ?? 0);
      const totalPages = Math.max(t?.totalPages ?? 0, c?.totalPages ?? 0);
      return { page: currentPage, limit, total, totalPages, comments: [] };
    }
    return null;
  }, [entityType, currentPage, limit, titleQuery.data, chapterQuery.data]);

  const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation();
  const [updateComment] = useUpdateCommentMutation();
  const [bulkDeleteComments] = useBulkDeleteCommentsMutation();

  // Статистика комментариев с нового API
  const { data: commentsStatsData } = useGetCommentsStatsQuery();
  const serverStats = commentsStatsData?.data;
  const comments = useMemo(() => {
    if (entityType === CommentEntityType.TITLE) {
      return titleQuery.data?.data?.comments || [];
    }
    if (entityType === CommentEntityType.CHAPTER) {
      return chapterQuery.data?.data?.comments || [];
    }
    const titleComments = titleQuery.data?.data?.comments || [];
    const chapterComments = chapterQuery.data?.data?.comments || [];
    return [...titleComments, ...chapterComments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [entityType, titleQuery.data, chapterQuery.data]);

  const processedComments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = comments.filter(comment => {
      const byType = entityType === "all" || comment.entityType === entityType;
      if (!byType) return false;

      if (visibilityFilter === "visible" && !comment.isVisible) return false;
      if (visibilityFilter === "hidden" && comment.isVisible) return false;

      if (!normalizedSearch) return true;

      const author = typeof comment.userId === "string" ? "" : (comment.userId?.username ?? "");
      const haystack = [comment.content, author, comment.entityId].join(" ").toLowerCase();
      return haystack.includes(normalizedSearch);
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortMode === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortMode === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortMode === "popular") {
        return (b.likes || 0) - (a.likes || 0);
      }
      return (b.dislikes || 0) + (b.likes || 0) - ((a.dislikes || 0) + (a.likes || 0));
    });

    return sorted;
  }, [comments, entityType, searchTerm, sortMode, visibilityFilter]);

  const stats = useMemo(
    () => ({
      total: processedComments.length,
      titleComments: processedComments.filter(c => c.entityType === CommentEntityType.TITLE).length,
      chapterComments: processedComments.filter(c => c.entityType === CommentEntityType.CHAPTER)
        .length,
      hidden: processedComments.filter(c => !c.isVisible).length,
    }),
    [processedComments],
  );

  const handleDeleteComment = async (id: string) => {
    const confirmed = confirm("Удалить комментарий? Это действие нельзя отменить.");
    if (!confirmed) return;

    try {
      await deleteComment(id).unwrap();
      toast.success("Комментарий удален");
      refetch();
    } catch {
      toast.error("Не удалось удалить комментарий");
    }
  };

  const handleToggleVisibility = async (comment: Comment) => {
    try {
      await updateComment({ id: comment._id, data: { isVisible: !comment.isVisible } }).unwrap();
      toast.success(comment.isVisible ? "Комментарий скрыт" : "Комментарий показан");
      refetch();
    } catch {
      toast.error("Не удалось изменить видимость");
    }
  };

  const handleSelectComment = useCallback((id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === processedComments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processedComments.map(c => c._id));
    }
  }, [selectedIds.length, processedComments]);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      // Используем новый API для массового удаления
      const result = await bulkDeleteComments(selectedIds).unwrap();
      const deletedCount = result.data?.deletedCount ?? selectedIds.length;
      toast.success(`Удалено ${deletedCount} комментариев`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      refetch();
    } catch {
      // Fallback на старый метод при ошибке
      try {
        const results = await Promise.allSettled(selectedIds.map(id => deleteComment(id).unwrap()));
        const failed = results.filter(r => r.status === "rejected").length;
        const success = results.length - failed;
        if (failed === 0) {
          toast.success(`Удалено ${success} комментариев`);
        } else {
          toast.error(`Удалено: ${success}, ошибок: ${failed}`);
        }
        setSelectedIds([]);
        setBulkDeleteOpen(false);
        refetch();
      } catch {
        toast.error("Ошибка при массовом удалении");
      }
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExportCSV = useCallback(() => {
    const headers = ["ID", "Автор", "Комментарий", "Тип", "Лайки", "Дизлайки", "Скрыт", "Дата"];
    const rows = processedComments.map(c => [
      c._id,
      typeof c.userId !== "string" ? displayCommentAuthor(c.userId?.username) : "Пользователь",
      c.content.substring(0, 100),
      c.entityType,
      c.likes || 0,
      c.dislikes || 0,
      c.isVisible ? "Нет" : "Да",
      new Date(c.createdAt).toLocaleDateString("ru-RU"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `comments_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Экспорт завершён");
  }, [processedComments, toast]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const openDetailModal = useCallback((comment: Comment) => {
    setDetailComment(comment);
    setIsEditMode(false);
    setEditContent(comment.content);
  }, []);

  const closeDetailModal = useCallback(() => {
    setDetailComment(null);
    setIsEditMode(false);
    setEditContent("");
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!detailComment || !editContent.trim()) return;

    setIsEditSaving(true);
    try {
      await updateComment({
        id: detailComment._id,
        data: { content: editContent.trim() },
      }).unwrap();
      toast.success("Комментарий обновлён");
      setIsEditMode(false);
      refetch();
      closeDetailModal();
    } catch {
      toast.error("Ошибка при сохранении");
    } finally {
      setIsEditSaving(false);
    }
  }, [detailComment, editContent, updateComment, toast, refetch, closeDetailModal]);

  const handleBulkHide = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setIsBulkHiding(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map(id => updateComment({ id, data: { isVisible: false } as never }).unwrap()),
      );
      const failed = results.filter(r => r.status === "rejected").length;
      const success = results.length - failed;
      if (failed === 0) {
        toast.success(`Скрыто ${success} комментариев`);
      } else {
        toast.error(`Скрыто: ${success}, ошибок: ${failed}`);
      }
      setSelectedIds([]);
      setBulkHideOpen(false);
      refetch();
    } catch {
      toast.error("Ошибка при массовом скрытии");
    } finally {
      setIsBulkHiding(false);
    }
  }, [selectedIds, updateComment, toast, refetch]);

  const handleViewUserProfile = useCallback((userId: string) => {
    window.open(`/user/${userId}`, "_blank");
  }, []);

  const normalizeUrl = useCallback((url: string) => {
    return getCoverUrls(url, "").primary;
  }, []);

  if (isLoading) {
    return <div className="text-center py-8">Загрузка комментариев...</div>;
  }

  if (isError) {
    return <div className="text-center py-8 text-red-500">Ошибка загрузки комментариев</div>;
  }

  return (
    <div className="flex-1 flex flex-col space-y-4 rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatBox label="Всего на сервере" value={serverStats?.total ?? "—"} />
        <StatBox label="После фильтров" value={stats.total} />
        <StatBox label="По тайтлам" value={stats.titleComments} />
        <StatBox label="По главам" value={stats.chapterComments} />
        <StatBox label="Скрытые" value={serverStats?.hidden ?? stats.hidden} />
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
          <Input
            type="text"
            placeholder="Поиск по тексту, автору или ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>

        <select
          value={entityType}
          onChange={e => setEntityType(e.target.value as CommentEntityType | "all")}
          className="admin-input"
        >
          <option value="all">Все типы</option>
          <option value={CommentEntityType.TITLE}>Тайтлы</option>
          <option value={CommentEntityType.CHAPTER}>Главы</option>
        </select>

        <select
          value={sortMode}
          onChange={e => setSortMode(e.target.value as SortMode)}
          className="admin-input"
        >
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
          <option value="popular">По лайкам</option>
          <option value="controversial">По активности</option>
        </select>

        <div className="flex items-center gap-2">
          <select
            value={visibilityFilter}
            onChange={e => setVisibilityFilter(e.target.value as VisibilityFilter)}
            className="admin-input"
            title="Видимость"
          >
            <option value="all">Все</option>
            <option value="visible">Видимые</option>
            <option value="hidden">Скрытые</option>
          </select>
          <select
            value={limit}
            onChange={e => {
              setLimit(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="admin-input"
            title="Комментариев на страницу"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            title="Экспорт CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
            title="Обновить"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <div className="flex items-center rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--secondary)] p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded ${viewMode === "cards" ? "bg-[var(--card)] text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}
              title="Карточки"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${viewMode === "list" ? "bg-[var(--card)] text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}
              title="Список"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30">
          <span className="text-sm font-medium text-[var(--primary)]">
            Выбрано: {selectedIds.length}
          </span>
          <button
            onClick={handleSelectAll}
            className="text-xs sm:text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            {selectedIds.length === processedComments.length ? "Снять все" : "Выбрать все"}
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setBulkHideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-yellow-600 hover:bg-yellow-500/10 rounded-lg transition-colors"
          >
            <EyeOff className="w-4 h-4" />
            <span className="hidden sm:inline">Скрыть</span>
          </button>
          <button
            onClick={() => setBulkDeleteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Удалить</span>
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {processedComments.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[var(--muted-foreground)]">
          Комментарии не найдены
        </div>
      ) : viewMode === "cards" ? (
        <div className="flex-1 grid gap-3 content-start">
          {processedComments.map(comment => (
            <article
              key={comment._id}
              className={`rounded-xl border p-4 transition-all hover:shadow-md ${
                !comment.isVisible
                  ? "border-yellow-500/30 bg-yellow-500/5"
                  : selectedIds.includes(comment._id)
                    ? "border-[var(--primary)]/50 bg-[var(--primary)]/5"
                    : "border-[var(--border)] bg-[var(--background)]/70 hover:border-[var(--border)]/80"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => handleSelectComment(comment._id)}
                    className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex-shrink-0 mt-0.5"
                  >
                    {selectedIds.includes(comment._id) ? (
                      <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Image
                      src={
                        isStaticAsset(getUserAvatar(comment))
                          ? getUserAvatar(comment)
                          : normalizeUrl(getUserAvatar(comment))
                      }
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      className="w-10 h-10 rounded-full object-cover bg-[var(--secondary)]"
                    />
                    {typeof comment.userId !== "string" && comment.userId?.role === "admin" && (
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"
                        title="Админ"
                      >
                        <span className="text-[8px] text-white font-bold">A</span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() =>
                          typeof comment.userId !== "string" &&
                          comment.userId?._id &&
                          handleViewUserProfile(comment.userId._id)
                        }
                        className="font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors flex items-center gap-1.5"
                        disabled={typeof comment.userId === "string"}
                      >
                        {typeof comment.userId !== "string"
                          ? displayCommentAuthor(comment.userId?.username)
                          : "Пользователь"}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </button>
                      {!comment.isVisible && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-600 font-medium">
                          скрыт
                        </span>
                      )}
                      {comment.isEdited && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-600 font-medium">
                          изменён
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--muted-foreground)] font-mono truncate max-w-[200px]">
                      {comment._id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openDetailModal(comment)}
                    className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] transition-colors"
                    title="Подробнее"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDetailComment(comment);
                      setIsEditMode(true);
                      setEditContent(comment.content);
                    }}
                    className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                    title="Редактировать"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleVisibility(comment)}
                    className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors"
                    title={comment.isVisible ? "Скрыть" : "Показать"}
                  >
                    {comment.isVisible ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="mt-3 text-sm text-[var(--foreground)] whitespace-pre-wrap line-clamp-4">
                {comment.content}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTimeAgo(comment.createdAt)}
                </span>
                {comment.reactions && comment.reactions.length > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--secondary)]">
                    {getReactionsDisplay(comment.reactions)}
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5" /> {comment.likes}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ThumbsDown className="w-3.5 h-3.5" /> {comment.dislikes}
                    </span>
                  </>
                )}
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {comment.entityType === CommentEntityType.TITLE ? "тайтл" : "глава"}
                  {comment.replies?.length ? ` · ${comment.replies.length} ответов` : ""}
                </span>
              </div>

              <div className="mt-2 text-xs">
                <span className="text-[var(--muted-foreground)]">К месту: </span>
                <CommentEntityLink comment={comment} />
              </div>

              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 pl-4 border-l-2 border-[var(--border)] space-y-3">
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">
                    Ответы ({comment.replies.length})
                  </p>
                  {comment.replies.map(reply => (
                    <div
                      key={reply._id}
                      className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-medium text-[var(--foreground)] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                          {typeof reply.userId !== "string"
                            ? displayCommentAuthor(reply.userId?.username)
                            : "Пользователь"}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => handleDeleteComment(reply._id)}
                          className="text-red-500 hover:text-red-700 h-7 px-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <p className="mt-1.5 text-sm text-[var(--foreground)] whitespace-pre-wrap">
                        {reply.content}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {new Date(reply.createdAt).toLocaleString("ru-RU")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--secondary)]/60">
              <tr>
                <th className="px-3 py-2 text-left w-10">
                  <button
                    onClick={handleSelectAll}
                    className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {selectedIds.length === processedComments.length &&
                    processedComments.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-left">Пользователь</th>
                <th className="px-3 py-2 text-left">Комментарий</th>
                <th className="px-3 py-2 text-left">
                  <span className="inline-flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    Тип
                  </span>
                </th>
                <th className="px-3 py-2 text-left">Дата</th>
                <th className="px-3 py-2 text-left">К месту</th>
                <th className="px-3 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {processedComments.map(comment => (
                <tr
                  key={comment._id}
                  className={`hover:bg-[var(--accent)]/30 ${
                    !comment.isVisible
                      ? "bg-yellow-500/5"
                      : selectedIds.includes(comment._id)
                        ? "bg-[var(--primary)]/5"
                        : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleSelectComment(comment._id)}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      {selectedIds.includes(comment._id) ? (
                        <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1.5">
                      {typeof comment.userId !== "string"
                        ? displayCommentAuthor(comment.userId?.username)
                        : "Пользователь"}
                      {!comment.isVisible && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-600">
                          скрыт
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2 max-w-[320px]" title={comment.content}>
                    <span className="truncate block">{comment.content}</span>
                    {comment.replies?.length ? (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        +{comment.replies.length} ответов
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{comment.entityType}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(comment.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-3 py-2">
                    <CommentEntityLink comment={comment} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVisibility(comment)}
                        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        title={comment.isVisible ? "Скрыть" : "Показать"}
                      >
                        {comment.isVisible ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginationData && paginationData.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--muted-foreground)]">
            Страница {paginationData.page} из {paginationData.totalPages} • Всего:{" "}
            {paginationData.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(paginationData.totalPages, prev + 1))}
              disabled={currentPage >= paginationData.totalPages}
            >
              Вперед
            </Button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Удалить комментарии"
        message={`Вы уверены, что хотите удалить ${selectedIds.length} комментариев? Это действие нельзя отменить.`}
        confirmText={isBulkDeleting ? "Удаление..." : "Удалить"}
        isLoading={isBulkDeleting}
      />

      <ConfirmModal
        isOpen={bulkHideOpen}
        onClose={() => setBulkHideOpen(false)}
        onConfirm={handleBulkHide}
        title="Скрыть комментарии"
        message={`Вы уверены, что хотите скрыть ${selectedIds.length} комментариев? Они не будут видны пользователям.`}
        confirmText={isBulkHiding ? "Скрытие..." : "Скрыть"}
        confirmVariant="primary"
        isLoading={isBulkHiding}
      />

      {/* Comment Detail Modal */}
      <AdminModal
        isOpen={!!detailComment}
        onClose={closeDetailModal}
        title={isEditMode ? "Редактирование комментария" : "Детали комментария"}
        size="lg"
      >
        {detailComment && (
          <div className="space-y-4">
            {/* Author info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--secondary)]/50">
              <Image
                src={
                  isStaticAsset(getUserAvatar(detailComment))
                    ? getUserAvatar(detailComment)
                    : normalizeUrl(getUserAvatar(detailComment))
                }
                alt=""
                width={48}
                height={48}
                unoptimized
                className="w-12 h-12 rounded-full object-cover bg-[var(--secondary)]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--foreground)]">
                    {typeof detailComment.userId !== "string"
                      ? displayCommentAuthor(detailComment.userId?.username)
                      : "Пользователь"}
                  </span>
                  {typeof detailComment.userId !== "string" && detailComment.userId?.role && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        detailComment.userId.role === "admin"
                          ? "bg-red-500/20 text-red-600"
                          : detailComment.userId.role === "moderator"
                            ? "bg-blue-500/20 text-blue-600"
                            : "bg-gray-500/20 text-gray-600"
                      }`}
                    >
                      {detailComment.userId.role === "admin"
                        ? "Админ"
                        : detailComment.userId.role === "moderator"
                          ? "Модератор"
                          : "Пользователь"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted-foreground)] font-mono truncate">
                  {detailComment._id}
                </p>
              </div>
              {typeof detailComment.userId !== "string" && (
                <button
                  onClick={() =>
                    detailComment.userId &&
                    typeof detailComment.userId !== "string" &&
                    detailComment.userId._id &&
                    handleViewUserProfile(detailComment.userId._id)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-sm hover:bg-[var(--primary)]/20 transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  Профиль
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                <p className="text-xs text-[var(--muted-foreground)]">Создан</p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {new Date(detailComment.createdAt).toLocaleDateString("ru-RU")}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                <p className="text-xs text-[var(--muted-foreground)]">Тип</p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {detailComment.entityType === CommentEntityType.TITLE ? "Тайтл" : "Глава"}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                <p className="text-xs text-[var(--muted-foreground)]">Статус</p>
                <p
                  className={`text-sm font-medium ${detailComment.isVisible ? "text-green-600" : "text-yellow-600"}`}
                >
                  {detailComment.isVisible ? "Виден" : "Скрыт"}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                <p className="text-xs text-[var(--muted-foreground)]">Ответов</p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {detailComment.replies?.length || 0}
                </p>
              </div>
            </div>

            {/* Reactions */}
            {detailComment.reactions && detailComment.reactions.length > 0 && (
              <div className="rounded-lg border border-[var(--border)] p-3">
                <p className="text-xs text-[var(--muted-foreground)] mb-2">Реакции</p>
                <div className="flex flex-wrap gap-2">
                  {detailComment.reactions.map((r, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--secondary)] text-sm"
                    >
                      {r.emoji} <span className="font-medium">{r.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Content or Edit */}
            {isEditMode ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="admin-input w-full resize-y min-h-[120px]"
                  placeholder="Текст комментария..."
                  disabled={isEditSaving}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={isEditSaving || !editContent.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isEditSaving ? "Сохранение..." : "Сохранить"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setEditContent(detailComment.content);
                    }}
                    disabled={isEditSaving}
                    className="px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-[var(--border)] p-4">
                <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                  {detailComment.content}
                </p>
                {detailComment.isEdited && (
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    Изменён: {new Date(detailComment.updatedAt).toLocaleString("ru-RU")}
                  </p>
                )}
              </div>
            )}

            {/* Link to entity */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--secondary)]/50">
              <span className="text-sm text-[var(--muted-foreground)]">Источник:</span>
              <CommentEntityLink comment={detailComment} />
            </div>

            {/* Actions */}
            {!isEditMode && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  onClick={() => {
                    setIsEditMode(true);
                    setEditContent(detailComment.content);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Редактировать
                </button>
                <button
                  onClick={() => {
                    handleToggleVisibility(detailComment);
                    closeDetailModal();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition-colors"
                >
                  {detailComment.isVisible ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  {detailComment.isVisible ? "Скрыть" : "Показать"}
                </button>
                <button
                  onClick={() => {
                    handleDeleteComment(detailComment._id);
                    closeDetailModal();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить
                </button>
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
