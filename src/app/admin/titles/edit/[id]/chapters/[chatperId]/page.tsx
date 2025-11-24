"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Edit, Save, AlertCircle } from "lucide-react";

import { useToast } from "@/hooks/useToast";
import { useGetChapterByIdQuery, useUpdateChapterMutation } from "@/store/api/chaptersApi";
import { UpdateChapterDto } from "@/types/title";
import { Chapter } from "@/types/chapter";

interface FormActionsProps {
  isSaving: boolean;
}

export default function ChapterEditorPage() {
  const params = useParams();
  const titleId = params.id as string;
  const chapterId = params.chatperId as string;
  const toast = useToast();
  // const dispatch = useDispatch(); // Удаляем неиспользуемую переменную

  const {
    data: chapter,
    isLoading,
    error: apiError,
  } = useGetChapterByIdQuery(chapterId, { skip: !chapterId });

  const [formData, setFormData] = useState<Chapter>({
    _id: "",
    chapterNumber: 0,
    name: "",
    pages: [],
    views: 0,
  });

  const [isSaving, setIsSaving] = useState(false);

  const [updateChapterMutation, { isLoading: isUpdating }] = useUpdateChapterMutation();

  useEffect(() => {
    if (chapter) {
      // Ensure pages is always array
      setFormData({
        ...chapter,
        pages: chapter.pages ?? [],
      });
    } else if (apiError) {
      toast.error("Ошибка при загрузке данных главы");
    }
  }, [chapter, apiError, toast]);

  const handleInputChange = (field: keyof Chapter) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value: string | string[] = e.target.value;
    if (field === "pages") {
      // This won't be used here because pages editing is textarea JSON, handled separately
      return;
    }
    if (field === "chapterNumber" /* || field === "views"*/) {
      value = e.target.value;
    }
    setFormData((prev: Chapter) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updateData: Partial<UpdateChapterDto> = {
        chapterNumber:
          typeof formData.chapterNumber === "string"
            ? parseInt(formData.chapterNumber)
            : formData.chapterNumber !== undefined
            ? formData.chapterNumber
            : 0,
        name: formData.name,
        pages: formData.pages || [],
      };

      const result = await updateChapterMutation({
        id: chapterId,
        data: updateData,
      }).unwrap();

      if (result) {
        toast.success("Глава успешно обновлена!");
      }
    } catch (err) {
      console.error("Error updating chapter:", err);
      toast.error(
        `Ошибка при обновлении главы: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (apiError) return <ErrorState message="Ошибка загрузки данных главы" />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <Edit className="w-6 h-6" />
          Редактировать главу
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 text-[var(--foreground)] font-medium">Название главы</label>
            <input
              type="text"
              value={formData.name}
              onChange={handleInputChange("name")}
              className="w-full px-3 py-2 rounded border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] bg-[var(--background)]"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-[var(--foreground)] font-medium">Номер главы</label>
            <input
              type="number"
              value={formData.chapterNumber}
              onChange={(e) => setFormData((prev: Chapter) => ({ ...prev, chapterNumber: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] bg-[var(--background)]"
              required
              min={0}
            />
          </div>
          <div>
            <label className="block mb-1 text-[var(--foreground)] font-medium">Страницы (JSON строка массива URL)</label>
            <textarea
              value={JSON.stringify(formData.pages ?? [])}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  if (Array.isArray(parsed)) {
                    setFormData((prev: Chapter) => ({ ...prev, pages: parsed }));
                  }
                } catch {
                  // ignore JSON parse errors
                }
              }}
              rows={5}
              className="w-full px-3 py-2 rounded border border-[var(--border)] resize-none focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] bg-[var(--background)]"
              required
            />
          </div>
          <FormActions isSaving={isSaving || isUpdating} />
        </form>
        <div className="mt-6">
          <Link
            href={`/admin/titles/edit/${titleId}/chapters`}
            className="inline-block px-4 py-2 rounded bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/80 transition-colors"
          >
            Вернуться к списку глав
          </Link>
        </div>
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
}

function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="text-center mt-20">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-lg text-[var(--foreground)]">{message}</h2>
    </div>
  );
}

interface FormActionsProps {
  isSaving: boolean;
}

function FormActions({ isSaving }: FormActionsProps) {
  return (
          <div className="flex justify-end gap-3">
            <Link
              href="/admin/titles"
              className="px-6 py-2 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
  );
}
