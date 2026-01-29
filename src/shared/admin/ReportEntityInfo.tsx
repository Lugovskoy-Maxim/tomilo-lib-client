"use client";

import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { useGetChapterByIdQuery } from "@/store/api/chaptersApi";
import Skeleton from "@/shared/skeleton/skeleton";
import { BookOpen } from "lucide-react";

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

  return (
    <div className="flex items-center">
      <BookOpen className="w-4 h-4 mr-1 text-[var(--primary)]" />
      <span className="font-medium">{title.name}</span>
    </div>
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
    (titleData as { name?: string })?.name ||
    (chapterData?.titleInfo?.name as string) ||
    "Неизвестный тайтл";
  const chapterNumber = chapterData?.chapterNumber;
  const chapterName = chapterData?.name;

  // Always show chapter number since we always fetch chapter data
  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <BookOpen className="w-4 h-4 mr-1 text-[var(--primary)]" />
        <span className="font-medium">{titleName}</span>
      </div>
      <span className="text-sm text-[var(--muted-foreground)] ml-5">
        Глава {chapterNumber}
        {chapterName && ` - ${chapterName}`}
      </span>
    </div>
  );
}
