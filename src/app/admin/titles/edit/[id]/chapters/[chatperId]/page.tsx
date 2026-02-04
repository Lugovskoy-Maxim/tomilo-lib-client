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
  useAddPagesToChapterMutation,
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
  const [addPagesToChapter, { isLoading: isUploading }] = useAddPagesToChapterMutation();
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

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

  // Handlers for adding new images
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFilesArray = Array.from(files).filter(file => file.type.startsWith("image/"));
      setNewFiles(prev => [...prev, ...newFilesArray]);
    }
    e.target.value = "";
  };

  const handleDropNewFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const newFilesArray = Array.from(files).filter(file => file.type.startsWith("image/"));
      setNewFiles(prev => [...prev, ...newFilesArray]);
    }
  };

  const handleDragOverNewFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeaveNewFiles = () => {
    setIsDragOver(false);
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadNewPages = async () => {
    if (newFiles.length === 0) {
      toast.error("Выберите файлы для загрузки");
      return;
    }

    try {
      const result = await addPagesToChapter({
        id: chapterId,
        pages: newFiles,
      }).unwrap();

      toast.success(`Загружено ${newFiles.length} страниц(а)`);
      setNewFiles([]);

      // Update local state with new pages
      if (result.pages && result.pages.length > 0) {
        setFormData(prev => ({
          ...prev,
          pages: [...(prev.pages || []), ...result.pages],
        }));
      }
    } catch (err) {
      toast.error(
        `Ошибка при загрузке страниц: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const clearNewFiles = () => {
    setNewFiles([]);
  };

  const handleSaveChanges = async () => {
    try {
      // Фильтруем страницы, исключая помеченные на удаление
      const pagesArray = formData.pages || [];
      const filteredPages =
        Array.isArray(pagesArray) && pagesArray.filter((_, index) => !imagesToDelete.includes(index)) || [];

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

            {/* Секция добавления новых изображений */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-[var(--foreground)] font-medium">
                  Добавить новые страницы
                </label>
                {newFiles.length > 0 && (
                  <span className="text-sm text-[var(--primary)]">
                    {newFiles.length} файл(ов) готовы к загрузке
                  </span>
                )}
              </div>

              {/* Zone for adding new files */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-[var(--border)] hover:border-[var(--primary)]"
                }`}
                onDragOver={handleDragOverNewFiles}
                onDragLeave={handleDragLeaveNewFiles}
                onDrop={handleDropNewFiles}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="add-pages-input"
                />
                <label htmlFor="add-pages-input" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-8 h-8 text-[var(--muted-foreground)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-[var(--foreground)]">
                      Перетащите изображения сюда или{" "}
                      <span className="text-[var(--primary)] underline">выберите файлы</span>
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Поддерживаются: JPG, PNG, WEBP, GIF
                    </span>
                  </div>
                </label>

                {/* Preview of selected files */}
                {newFiles.length > 0 && (
                  <div className="mt-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-4">
                      {newFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-[2/3] bg-gray-200 rounded overflow-hidden">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Новая страница ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeNewFile(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                            {file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={clearNewFiles}
                        className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        disabled={isUploading}
                      >
                        Очистить
                      </button>
                      <button
                        type="button"
                        onClick={handleUploadNewPages}
                        disabled={isUploading}
                        className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <svg
                              className="animate-spin w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Загрузка...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                              />
                            </svg>
                            Загрузить {newFiles.length} страниц{newFiles.length > 1 ? "ы" : "у"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Секция изображений */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-[var(--foreground)] font-medium">
                  Страницы главы ({formData.pages?.length || 0})
                </label>
                <span className="text-sm text-[var(--muted-foreground)]">
                  Перетащите для сортировки
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
