"use client";

import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { useGetChapterByIdQuery } from "@/store/api/chaptersApi";
import Skeleton from "@/shared/skeleton/skeleton";
import { BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getTitlePath, getChapterPath } from "@/lib/title-paths";

interface ReportEntityInfoProps {
  entityType: "title" | "chapter";
  entityId: string;
  titleId?: string;
}

export function ReportEntityInfo({ entityType, entityId, titleId }: ReportEntityInfoProps) {
  if (entityType === "title") {
    return <TitleInfo titleId={entityId} />;
  }

  return <ChapterInfo chapterId={entityId} titleId={titleId} />;
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
  const titleSlug = (titleData as { slug?: string })?.slug || (chapterData?.titleInfo as { slug?: string })?.slug;
  const chapterNumber = chapterData?.chapterNumber;
  const chapterName = chapterData?.name;

  const titleHref = resolvedTitleId ? getTitlePath({ _id: resolvedTitleId, slug: titleSlug }) : null;
  const chapterHref = resolvedTitleId ? getChapterPath({ _id: resolvedTitleId, slug: titleSlug }, chapterId) : null;

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
