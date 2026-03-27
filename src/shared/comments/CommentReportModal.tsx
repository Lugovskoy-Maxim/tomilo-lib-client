"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ReportType } from "@/types/report";
import { useCreateReportMutation } from "@/store/api/reportsApi";
import { X, Flag } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { useOverlay } from "@/contexts/OverlayContext";

interface CommentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  commentId: string;
  /** Id тайтла для контекста в админке (глава или страница тайтла). */
  titleId?: string;
}

const MIN_LEN = 10;

function CommentReportModalInner({
  onClose,
  commentId,
  titleId,
}: Omit<CommentReportModalProps, "isOpen">) {
  const [description, setDescription] = useState("");
  const [createReport, { isLoading }] = useCreateReportMutation();
  const toast = useToast();
  const { user } = useAuth();
  const pathname = usePathname() || "";

  const fieldId = `comment-report-text-${commentId}`;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = description.trim();
    if (trimmed.length < MIN_LEN) {
      toast.error(`Опишите причину не короче ${MIN_LEN} символов`);
      return;
    }
    if (!user) {
      toast.error("Войдите в аккаунт, чтобы отправить жалобу");
      return;
    }

    try {
      const reportData: Record<string, unknown> = {
        reportType: ReportType.COMMENT_REPORT,
        entityType: "comment",
        entityId: commentId,
        content: trimmed,
        url: pathname || null,
        creatorId: user._id,
      };
      if (titleId) {
        reportData.titleId = titleId;
      }

      const result = await createReport(reportData).unwrap();
      if (result.success) {
        toast.success("Жалоба отправлена. Модераторы рассмотрят её в ближайшее время.");
        onClose();
        setDescription("");
      } else {
        toast.error(result.message || "Не удалось отправить жалобу");
      }
    } catch (error: unknown) {
      const msg =
        error &&
        typeof error === "object" &&
        "data" in error &&
        (error as { data?: { message?: string; errors?: string[] } }).data?.errors?.[0];
      toast.error(
        typeof msg === "string" ? msg : "Не удалось отправить жалобу. Попробуйте позже.",
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`comment-report-title-${commentId}`}
        className="relative w-full max-w-md max-h-[min(90vh,calc(100vh-2rem))] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-[var(--accent)] transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 pr-10">
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-5 h-5 text-[var(--primary)] shrink-0" />
            <h2
              id={`comment-report-title-${commentId}`}
              className="text-lg font-bold text-[var(--foreground)]"
            >
              Жалоба на комментарий
            </h2>
          </div>
          <p className="text-[var(--muted-foreground)] text-sm">
            Опишите нарушение: оскорбления, спойлеры без пометки, спам и т.д.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={fieldId} className="block text-sm font-medium mb-1.5">
              Текст жалобы
            </label>
            <textarea
              id={fieldId}
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-3 py-2 text-sm resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
              placeholder="Не менее 10 символов…"
              required
              minLength={MIN_LEN}
            />
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
              Минимум {MIN_LEN} символов · до 5000
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm border border-[var(--border)] hover:bg-[var(--secondary)] transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading || description.trim().length < MIN_LEN}
              className="px-4 py-2 rounded-lg text-sm bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isLoading ? "Отправка…" : "Отправить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CommentReportModal({
  isOpen,
  onClose,
  commentId,
  titleId,
}: CommentReportModalProps) {
  const overlay = useOverlay();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!overlay) return;
    if (!isOpen) {
      overlay.setOverlayContent(null);
      return;
    }
    overlay.setOverlayContent(
      <CommentReportModalInner
        commentId={commentId}
        titleId={titleId}
        onClose={() => onCloseRef.current()}
      />,
    );
    return () => overlay.setOverlayContent(null);
  }, [isOpen, overlay, commentId, titleId]);

  if (overlay) return null;

  if (!isOpen) return null;

  return (
    <CommentReportModalInner
      commentId={commentId}
      titleId={titleId}
      onClose={() => onCloseRef.current()}
    />
  );
}
