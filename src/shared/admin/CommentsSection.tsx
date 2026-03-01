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
  CalendarClock,
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
} from "lucide-react";
import Input from "@/shared/ui/input";
import Button from "@/shared/ui/button";
import { useToast } from "@/hooks/useToast";
import { useGetCommentsQuery, useDeleteCommentMutation, useUpdateCommentMutation } from "@/store/api/commentsApi";
import { useGetChapterByIdQuery } from "@/store/api/chaptersApi";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { getTitlePath } from "@/lib/title-paths";
import { Comment, CommentEntityType } from "@/types/comment";
import { ConfirmModal } from "./ui";

type CommentsViewMode = "cards" | "list";
type SortMode = "newest" | "oldest" | "popular" | "controversial";
type VisibilityFilter = "all" | "visible" | "hidden";

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
        : (chapterData?.titleId as string))) ?? "";

  const { data: titleDataForChapter } = useGetTitleByIdQuery(
    { id: resolvedTitleId },
    {
      skip:
        comment.entityType !== CommentEntityType.CHAPTER ||
        !resolvedTitleId ||
        !!slugFromInfo,
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
      resolvedId || slug
        ? `/titles/${slug || resolvedId}/chapter/${comment.entityId}`
        : null;
    if (href) {
      return (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline"
        >
          {titleName || titleDataForChapter?.name ? `Глава: ${titleName || titleDataForChapter?.name}` : "К главе"}
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

  const queryParams = {
    entityId: "all" as const,
    page: currentPage,
    limit,
    includeReplies: true,
  };

  const titleQuery = useGetCommentsQuery({
    ...queryParams,
    entityType: CommentEntityType.TITLE,
  }, { skip: entityType === CommentEntityType.CHAPTER });

  const chapterQuery = useGetCommentsQuery({
    ...queryParams,
    entityType: CommentEntityType.CHAPTER,
  }, { skip: entityType === CommentEntityType.TITLE });

  const isLoading = entityType === CommentEntityType.CHAPTER ? chapterQuery.isLoading : entityType === CommentEntityType.TITLE ? titleQuery.isLoading : (titleQuery.isLoading || chapterQuery.isLoading);
  const isError = entityType === CommentEntityType.CHAPTER ? chapterQuery.isError : entityType === CommentEntityType.TITLE ? titleQuery.isError : (titleQuery.isError || chapterQuery.isError);
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
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

      const author = typeof comment.userId === "string" ? "" : comment.userId.username;
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
      chapterComments: processedComments.filter(c => c.entityType === CommentEntityType.CHAPTER).length,
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
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExportCSV = useCallback(() => {
    const headers = ["ID", "Автор", "Комментарий", "Тип", "Лайки", "Дизлайки", "Скрыт", "Дата"];
    const rows = processedComments.map(c => [
      c._id,
      typeof c.userId !== "string" ? c.userId.username : "Пользователь",
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

  if (isLoading) {
    return <div className="text-center py-8">Загрузка комментариев...</div>;
  }

  if (isError) {
    return <div className="text-center py-8 text-red-500">Ошибка загрузки комментариев</div>;
  }

  return (
    <div className="space-y-4 rounded-[var(--admin-radius)] border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox label="После фильтров" value={stats.total} />
        <StatBox label="По тайтлам" value={stats.titleComments} />
        <StatBox label="По главам" value={stats.chapterComments} />
        <StatBox label="Скрытые" value={stats.hidden} />
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
        <div className="text-center py-10 text-[var(--muted-foreground)]">Комментарии не найдены</div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-3">
          {processedComments.map(comment => (
            <article
              key={comment._id}
              className={`rounded-xl border p-4 ${
                !comment.isVisible
                  ? "border-yellow-500/30 bg-yellow-500/5"
                  : selectedIds.includes(comment._id)
                    ? "border-[var(--primary)]/50 bg-[var(--primary)]/5"
                    : "border-[var(--border)] bg-[var(--background)]/70"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
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
                  <div>
                    <p className="font-medium text-[var(--foreground)] flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[var(--muted-foreground)]" />
                      {typeof comment.userId !== "string" ? comment.userId.username : "Пользователь"}
                      {!comment.isVisible && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-600">скрыт</span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)] font-mono break-all">{comment._id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleVisibility(comment)}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    title={comment.isVisible ? "Скрыть" : "Показать"}
                  >
                    {comment.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              </div>

              <p className="mt-3 text-sm text-[var(--foreground)] whitespace-pre-wrap">{comment.content}</p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" />
                  {new Date(comment.createdAt).toLocaleString("ru-RU")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" /> {comment.likes}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ThumbsDown className="w-3.5 h-3.5" /> {comment.dislikes}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {comment.entityType}
                  {comment.replies?.length ? ` · ${comment.replies.length} ответов` : ""}
                </span>
              </div>

              <div className="mt-2 text-xs">
                <span className="text-[var(--muted-foreground)]">К месту: </span>
                <CommentEntityLink comment={comment} />
              </div>

              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 pl-4 border-l-2 border-[var(--border)] space-y-3">
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">Ответы ({comment.replies.length})</p>
                  {comment.replies.map(reply => (
                    <div
                      key={reply._id}
                      className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-medium text-[var(--foreground)] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                          {typeof reply.userId !== "string" ? reply.userId.username : "Пользователь"}
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
                      <p className="mt-1.5 text-sm text-[var(--foreground)] whitespace-pre-wrap">{reply.content}</p>
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
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--secondary)]/60">
              <tr>
                <th className="px-3 py-2 text-left w-10">
                  <button
                    onClick={handleSelectAll}
                    className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {selectedIds.length === processedComments.length && processedComments.length > 0 ? (
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
                      {typeof comment.userId !== "string" ? comment.userId.username : "Пользователь"}
                      {!comment.isVisible && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-600">скрыт</span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2 max-w-[320px]" title={comment.content}>
                    <span className="truncate block">{comment.content}</span>
                    {comment.replies?.length ? (
                      <span className="text-xs text-[var(--muted-foreground)]">+{comment.replies.length} ответов</span>
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
                        {comment.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
            Страница {paginationData.page} из {paginationData.totalPages} • Всего: {paginationData.total}
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
