"use client";

import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { useGetChapterByIdQuery } from "@/store/api/chaptersApi";
import { useGetCommentQuery } from "@/store/api/commentsApi";
import Skeleton from "@/shared/skeleton/skeleton";
import { BookOpen, ExternalLink, MessageCircle } from "lucide-react";
import Link from "next/link";
import { getTitlePath, getChapterPath } from "@/lib/title-paths";
import { CommentEntityType } from "@/types/comment";

interface ReportEntityInfoProps {
  entityType: string | null | undefined;
  entityId: string | null | undefined;
  titleId?: string | null;
}

export function ReportEntityInfo({ entityType, entityId, titleId }: ReportEntityInfoProps) {
  if (entityType === "comment" && entityId) {
    return <CommentReportEntityInfo commentId={entityId} reportTitleId={titleId} />;
  }
  if (entityType === "title" && entityId) {
    return <TitleInfo titleId={entityId} />;
  }
  if (entityId) {
    return <ChapterInfo chapterId={entityId} titleId={titleId ?? undefined} />;
  }
  return (
    <div className="flex items-center text-[var(--muted-foreground)] text-sm">
      Контекст не указан
    </div>
  );
}

function CommentReportEntityInfo({
  commentId,
  reportTitleId,
}: {
  commentId: string;
  reportTitleId?: string | null;
}) {
  const { data: commentResp, isLoading, error } = useGetCommentQuery(commentId);
  const comment = commentResp?.data;

  const titleQueryId =
    comment?.entityType === CommentEntityType.TITLE
      ? String(comment.entityId)
      : reportTitleId || "";

  const { data: titleRow, isLoading: titleLoading } = useGetTitleByIdQuery(
    { id: titleQueryId },
    { skip: !titleQueryId },
  );

  if (isLoading || (Boolean(titleQueryId) && titleLoading)) {
    return (
      <div className="flex flex-col gap-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
    );
  }

  if (error || !comment) {
    return (
      <div className="flex items-center text-[var(--muted-foreground)] text-sm">
        <MessageCircle className="w-4 h-4 mr-1 shrink-0" />
        Комментарий не найден или скрыт
      </div>
    );
  }

  const tid = titleRow?._id || titleQueryId;
  const titleSlug = titleRow?.slug;
  const hash = `#comment-${commentId}`;
  const href =
    comment.entityType === CommentEntityType.CHAPTER && tid
      ? `${getChapterPath({ _id: tid, slug: titleSlug }, String(comment.entityId))}${hash}`
      : tid
        ? `${getTitlePath({ _id: tid, slug: titleSlug })}${hash}`
        : null;

  const contextLabel =
    comment.entityType === CommentEntityType.CHAPTER
      ? "Комментарий к главе"
      : "Комментарий к тайтлу";

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
        <MessageCircle className="w-4 h-4 shrink-0 text-[var(--primary)]" />
        <span>{contextLabel}</span>
      </div>
      <p className="text-xs text-[var(--foreground)] line-clamp-3 pl-5 border-l-2 border-[var(--border)]">
        {comment.content}
      </p>
      {href ? (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 pl-5 text-[var(--primary)] hover:underline w-fit"
        >
          <BookOpen className="w-4 h-4" />
          <span>Открыть в контексте</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </Link>
      ) : (
        <span className="text-xs text-[var(--muted-foreground)] pl-5">Не удалось построить ссылку</span>
      )}
    </div>
  );
}

function TitleInfo({ titleId }: { titleId: string }) {
  const { data: title, isLoading, error } = useGetTitleByIdQuery({ id: titleId });

  if (isLoading) {
    return <Skeleton className="h-5 w-32" />;
  }

  if (error || !title) {
    return (
      <div className="flex items-center text-[var(--muted-foreground)]">
        <BookOpen className="w-4 h-4 mr-1" />
        <span>Тайтл не найден</span>
      </div>
    );
  }

  const href = getTitlePath({ _id: title._id, slug: title.slug });

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:underline"
    >
      <BookOpen className="w-4 h-4" />
      <span className="font-medium">{title.name}</span>
      <ExternalLink className="w-3 h-3 opacity-60" />
    </Link>
  );
}

function ChapterInfo({ chapterId, titleId }: { chapterId: string; titleId?: string }) {
  // Always fetch chapter to get chapter number
  const chapterQuery = useGetChapterByIdQuery(chapterId);
  // If we have titleId, also fetch title info directly (optimization)
  const titleQuery = useGetTitleByIdQuery({ id: titleId || "" }, { skip: !titleId });

  const chapterLoading = chapterQuery.isLoading;
  const titleLoading = titleId ? titleQuery.isLoading : false;
  const isLoading = chapterLoading || titleLoading;

  const chapterError = chapterQuery.error;
  const titleError = titleId ? titleQuery.error : null;
  const error = chapterError || titleError;

  const chapterData = chapterQuery.data;
  const titleData = titleId ? titleQuery.data : chapterData?.titleInfo;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (error || (!titleData && !chapterData)) {
    return (
      <div className="flex items-center text-[var(--muted-foreground)]">
        <BookOpen className="w-4 h-4 mr-1" />
        <span>Глава не найдена</span>
      </div>
    );
  }

  const titleName =
    (titleData as { name?: string; _id?: string; slug?: string })?.name ||
    (chapterData?.titleInfo?.name as string) ||
    "Неизвестный тайтл";
  const resolvedTitleId = (titleData as { _id?: string })?._id || titleId || "";
  const titleSlug =
    (titleData as { slug?: string })?.slug || (chapterData?.titleInfo as { slug?: string })?.slug;
  const chapterNumber = chapterData?.chapterNumber;
  const chapterName = chapterData?.name;

  const titleHref = resolvedTitleId
    ? getTitlePath({ _id: resolvedTitleId, slug: titleSlug })
    : null;
  const chapterHref = resolvedTitleId
    ? getChapterPath({ _id: resolvedTitleId, slug: titleSlug }, chapterId)
    : null;

  return (
    <div className="flex flex-col gap-1">
      {titleHref ? (
        <Link
          href={titleHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:underline"
        >
          <BookOpen className="w-4 h-4" />
          <span className="font-medium">{titleName}</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </Link>
      ) : (
        <div className="flex items-center">
          <BookOpen className="w-4 h-4 mr-1 text-[var(--primary)]" />
          <span className="font-medium">{titleName}</span>
        </div>
      )}
      {chapterHref ? (
        <Link
          href={chapterHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 ml-5 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:underline"
        >
          Глава {chapterNumber}
          {chapterName && ` — ${chapterName}`}
          <ExternalLink className="w-3 h-3 opacity-60" />
        </Link>
      ) : (
        <span className="text-sm text-[var(--muted-foreground)] ml-5">
          Глава {chapterNumber}
          {chapterName && ` — ${chapterName}`}
        </span>
      )}
    </div>
  );
}
