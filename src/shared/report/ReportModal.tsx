"use client";

import { useState } from "react";
import { ReportType } from "@/types/report";
import { useCreateReportMutation } from "@/store/api/reportsApi";
import Button from "@/shared/ui/button";
import { X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "title" | "chapter";
  entityId: string;
  entityTitle: string;
  titleId?: string;
}

export function ReportModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityTitle,
  titleId,
}: ReportModalProps) {
  const [reportType, setReportType] = useState<ReportType>(ReportType.ERROR);
  const [description, setDescription] = useState("");
  const [createReport, { isLoading }] = useCreateReportMutation();
  const toast = useToast();
  const { user } = useAuth();

  const reportTypeLabels = {
    [ReportType.ERROR]: "Ошибка (не загружается, сломана верска и т.д)",
    [ReportType.TYPO]: "Опечатка в тексте",
    [ReportType.COMPLAINT]: "Жалоба на контент",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Build request body
      const reportData: Record<string, unknown> = {
        entityType,
        entityId,
        reportType,
        content: description,
      };

      // Add creatorId (the author of the content being reported)
      if (user?._id) {
        reportData.creatorId = user._id;
      }

      // Add titleId if provided
      if (titleId) {
        reportData.titleId = titleId;
      }

      // Add userId (the current user who is reporting)
      if (user?._id) {
        reportData.userId = user._id;
      }

      const result = await createReport(reportData).unwrap();

      if (result.success) {
        toast.success("Спасибо за ваше сообщение. Мы рассмотрим его в ближайшее время.");
        onClose();
        setDescription("");
      } else {
        toast.error(result.message || "Не удалось отправить отчет");
      }
    } catch (error) {
      toast.error("Не удалось отправить отчет. Попробуйте позже.");
      console.error("Failed to submit report:", error);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-layer-modal flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] w-full max-w-md mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-[var(--accent)] transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-xl font-bold text-[var(--foreground)]">Сообщить о проблеме</h2>
          </div>
          <p className="text-[var(--muted-foreground)] text-sm">
            {entityType === "title" ? `Тайтл: ${entityTitle}` : `Глава: ${entityTitle}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Тип проблемы
            </label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              required
            >
              {Object.entries(reportTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Описание проблемы
              <span className="absolute bottom-9 right-2 italic text-xs text-[var(--muted-foreground)]">
                {description.length}/1000
              </span>
            </label>
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Опишите проблему подробно..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
              rows={4}
              required
            />
            <span className="text-xs text-[var(--muted-foreground)] italic">
              минимальная длина 10 символов
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 cursor-pointer hover:text-red-500/90 rounded-2xl"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="flex-1 cursor-pointer hover:text-[var(--chart-1)] border border-[var(--border)] rounded-2xl"
              disabled={isLoading || !description.trim() || description.length < 10}
            >
              {isLoading ? "Отправка..." : "Отправить"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
