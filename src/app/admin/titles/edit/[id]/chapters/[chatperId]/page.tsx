"use client";

import { AuthGuard } from "@/guard/AuthGuard";
import { useState, useEffect, ChangeEvent, FormEvent, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Edit, Save, AlertCircle, Eye, Trash2 } from "lucide-react";

import { useToast } from "@/hooks/useToast";
import {
  useGetChapterByIdQuery,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
} from "@/store/api/chaptersApi";
import { UpdateChapterDto } from "@/types/title";
import { Chapter } from "@/types/chapter";
import { ImagePreviewModal } from "@/shared/admin/ImagePreviewModal";
import { Button } from "@/shared/ui/button";

interface FormActionsProps {
  isSaving: boolean;
}

export default function ChapterEditorPage() {
  const params = useParams();
  const titleId = params.id as string;
  const chapterId = params.chatperId as string;
  const toast = useToast();

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
  const [selectedImage, setSelectedImage] = useState<{ url: string; index: number } | null>(null);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);

  // Drag and drop state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const [updateChapterMutation, { isLoading: isUpdating }] = useUpdateChapterMutation();
  const [deleteChapter] = useDeleteChapterMutation();

  useEffect(() => {
    if (chapter && chapter._id !== formData._id) {
      // Ensure pages is always array
      setFormData({
        ...chapter,
        pages: chapter.pages ?? [],
      });
    } else if (apiError) {
      toast.error("Ошибка при загрузке данных главы");
    }
  }, [chapter, apiError, toast, formData._id]);

  const handleInputChange =
    (field: keyof Chapter) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleDeleteImage = (index: number) => {
    setImagesToDelete(prev => [...prev, index]);
  };

  const handleRestoreImage = (index: number) => {
    setImagesToDelete(prev => prev.filter(i => i !== index));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragOverItem.current = index;
    e.preventDefault();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const newPages = [...(formData.pages || [])];
    const draggedItem = newPages[dragItem.current];

    // Удаляем элемент из старой позиции
    newPages.splice(dragItem.current, 1);
    // Вставляем в новую позицию
    newPages.splice(dragOverItem.current, 0, draggedItem);

    // Обновляем состояние
    setFormData(prev => ({
      ...prev,
      pages: newPages,
    }));

    // Сбрасываем значения
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleSaveChanges = async () => {
    try {
      // Фильтруем страницы, исключая помеченные на удаление
      const filteredPages =
        formData.pages?.filter((_, index) => !imagesToDelete.includes(index)) || [];

      const updateData: Partial<UpdateChapterDto> = {
        chapterNumber:
          typeof formData.chapterNumber === "string"
            ? parseInt(formData.chapterNumber)
            : formData.chapterNumber !== undefined
              ? formData.chapterNumber
              : 0,
        name: formData.name,
        pages: filteredPages,
      };

      const result = await updateChapterMutation({
        id: chapterId,
        data: updateData,
      }).unwrap();

      if (result) {
        toast.success("Глава успешно обновлена!");
        setImagesToDelete([]);
      }
    } catch (err) {
      toast.error(
        `Ошибка при обновлении главы: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleDeleteChapter = async () => {
    if (!confirm("Вы уверены, что хотите удалить эту главу? Это действие нельзя отменить.")) {
      return;
    }

    try {
      await deleteChapter(chapterId).unwrap();
      toast.success("Глава успешно удалена!");
      // Здесь можно добавить редирект на страницу списка глав
    } catch (err) {
      toast.error(
        `Ошибка при удалении главы: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await handleSaveChanges();
    } finally {
      setIsSaving(false);
    }
  };

  const openImagePreview = (url: string, index: number) => {
    setSelectedImage({ url, index });
  };

  const closeImagePreview = () => {
    setSelectedImage(null);
  };

  if (isLoading) return <LoadingState />;
  if (apiError) return <ErrorState message="Ошибка загрузки данных главы" />;

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <Edit className="w-6 h-6" />
              Редактировать главу
            </h1>
            <Button
              variant="destructive"
              onClick={handleDeleteChapter}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Удалить главу
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-1 text-[var(--foreground)] font-medium">
                Название главы
              </label>
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
                onChange={e =>
                  setFormData((prev: Chapter) => ({
                    ...prev,
                    chapterNumber: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 rounded border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] bg-[var(--background)]"
                required
                min={0}
              />
            </div>

            {/* Секция изображений */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-[var(--foreground)] font-medium">Страницы главы</label>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {formData.pages?.length || 0} изображений
                </span>
              </div>

              {formData.pages && formData.pages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.pages.map((pageUrl, index) => {
                    const isMarkedForDeletion = imagesToDelete.includes(index);
                    return (
                      <div
                        key={index}
                        className={`relative group border rounded-lg overflow-hidden ${isMarkedForDeletion ? "opacity-50" : ""}`}
                        draggable
                        onDragStart={e => handleDragStart(e, index)}
                        onDragEnter={e => handleDragEnter(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                      >
                        <div
                          className="aspect-[2/3] bg-gray-200 cursor-pointer relative"
                          onClick={() => openImagePreview(pageUrl, index)}
                        >
                          <img
                            src={process.env.NEXT_PUBLIC_UPLOADS_URL + pageUrl}
                            alt={`Страница ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {isMarkedForDeletion && (
                            <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                              <Trash2 className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                        </div>

                        <div className="p-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-[var(--muted-foreground)]">
                              #{index + 1}
                            </span>
                            {isMarkedForDeletion ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleRestoreImage(index);
                                }}
                                className="text-xs h-6 px-2"
                              >
                                Отменить
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteImage(index);
                                }}
                                className="text-xs h-6 px-2"
                              >
                                Удалить
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-[var(--muted-foreground)]">
                  Нет изображений для отображения
                </div>
              )}
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

        {/* Модальное окно предпросмотра */}
        {selectedImage && (
          <ImagePreviewModal
            isOpen={!!selectedImage}
            onClose={closeImagePreview}
            imageUrl={selectedImage.url}
            altText={`Предпросмотр страницы #${selectedImage.index + 1}`}
          />
        )}
      </main>
    </AuthGuard>
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
