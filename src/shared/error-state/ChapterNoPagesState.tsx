"use client";

import { useEffect, useRef } from "react";
import { ReportType } from "@/types/report";
import { useCreateReportMutation } from "@/store/api/reportsApi";
import { useAuth } from "@/hooks/useAuth";
import type { ReaderChapter, ReaderTitle } from "@/shared/reader/types";
import ChapterErrorState from "./ChapterErrorState";

const REPORT_CONTENT = "отсутствуют страницы";

interface ChapterNoPagesStateProps {
  title: ReaderTitle;
  chapter: ReaderChapter;
  chapters: ReaderChapter[];
  slug?: string;
}

/**
 * Состояние «нет страниц»: автоматически отправляет жалобу с текстом «отсутствуют страницы»
 * и показывает кнопку «Назад к предыдущей главе».
 */
export default function ChapterNoPagesState({
  title,
  chapter,
  chapters,
  slug,
}: ChapterNoPagesStateProps) {
  const [createReport] = useCreateReportMutation();
  const { user } = useAuth();
  const reportSentRef = useRef(false);

  useEffect(() => {
    if (reportSentRef.current) return;
    reportSentRef.current = true;

    const reportData: Record<string, unknown> = {
      entityType: "chapter",
      entityId: chapter._id,
      reportType: ReportType.ERROR,
      content: REPORT_CONTENT,
      titleId: title._id,
    };
    if (user?._id) {
      reportData.userId = user._id;
      reportData.creatorId = user._id;
    }

    createReport(reportData).catch(() => {
      // Жалоба отправляется в фоне; при ошибке не показываем toast, чтобы не отвлекать
    });
  }, [chapter._id, title._id, user?._id, createReport]);

  const currentIndex = chapters.findIndex(c => c._id === chapter._id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  const prevChapterHref =
    slug && prevChapter ? `/titles/${slug}/chapter/${prevChapter._id}` : undefined;
  const nextChapterHref =
    slug && nextChapter ? `/titles/${slug}/chapter/${nextChapter._id}` : undefined;

  return (
    <ChapterErrorState
      title="Нет страниц"
      message="В этой главе пока нет страниц — мы уже отправили заявку, и команда скоро всё проверит и поправит. А пока можете перейти к другой главе или зайти позже."
      slug={slug}
      prevChapterHref={prevChapterHref}
      nextChapterHref={nextChapterHref}
    />
  );
}
