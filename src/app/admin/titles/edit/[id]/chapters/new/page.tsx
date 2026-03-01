"use client";

import { AuthGuard } from "@/guard/AuthGuard";
import { useState, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCreateChapterWithPagesMutation } from "@/store/api/chaptersApi";
import { ChapterStatus, CreateChapterDto } from "@/types/title";
import { useToast } from "@/hooks/useToast";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import { Header } from "@/widgets";

export default function ChapterCreatePage() {
  const params = useParams();
  const router = useRouter();
  const titleId = (params?.id as string) || "";
  const toast = useToast();

  const [createWithPages, { isLoading }] = useCreateChapterWithPagesMutation();

  const [form, setForm] = useState<Partial<CreateChapterDto>>({
    titleId,
    chapterNumber: 1,
    volumeNumber: undefined,
    title: "",
    isPublished: false,
    isFree: true,
    status: ChapterStatus.DRAFT,
    price: undefined,
    translator: "",
    proofreader: "",
    qualityCheck: "",
    releaseDate: undefined,
  });
  const [pages, setPages] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleChange = (name: keyof CreateChapterDto, value: unknown) => {
    setForm(prev => ({ ...prev, [name]: value as never }));
  };

  const sortFiles = (files: File[]): File[] => {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    return [...files].sort((a, b) => collator.compare(a.name, b.name));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter(file => file.type.startsWith("image/"));
    setPages(prev => sortFiles([...prev, ...arr]));
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const handleDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const arr = Array.from(files).filter(file => file.type.startsWith("image/"));
      setPages(prev => sortFiles([...prev, ...arr]));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const removeFile = (index: number) => {
    setPages(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setPages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleId) {
      toast.error("Не указан ID тайтла");
      return;
    }
    if (!form.chapterNumber) {
      toast.error("Укажите номер главы");
      return;
    }
    try {
      const data: Partial<CreateChapterDto> = {
        ...form,
        titleId,
        chapterNumber: Number(form.chapterNumber),
        volumeNumber: form.volumeNumber ? Number(form.volumeNumber) : undefined,
        price: form.price ? Number(form.price) : undefined,
      };
      const created = await createWithPages({ data, pages }).unwrap();
      toast.success(`Глава #${created.chapterNumber} создана`);
      router.push(`/admin/titles/edit/${titleId}`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string };
      toast.error(
        `Ошибка создания: ${error?.data?.message || (error as Error)?.message || "Unknown"}`,
      );
    }
  };

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Breadcrumbs
            items={[
              { name: "Главная", href: "/" },
              { name: "Админка", href: "/admin" },
              { name: "Тайтлы", href: "/admin?tab=titles" },
              { name: "Редактирование", href: `/admin/titles/edit/${titleId}` },
              { name: "Главы", href: `/admin/titles/edit/${titleId}/chapters` },
              { name: "Новая глава", isCurrent: true },
            ]}
            className="mb-6"
          />
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Добавить главу</h1>
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              onClick={() => router.push(`/admin/titles/edit/${titleId}`)}
            >
              Назад к тайтлу
            </button>
          </div>
          <form method="post" onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 space-y-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Основные данные</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-[var(--foreground)]">Номер главы</span>
                  <input
                    type="number"
                    value={form.chapterNumber ?? ""}
                    onChange={e => handleChange("chapterNumber", e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    required
                    min={0}
                    step="any"
                    placeholder="Например: 1, 1.5, 10.1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-[var(--foreground)]">Номер тома</span>
                  <input
                    type="number"
                    value={form.volumeNumber ?? ""}
                    onChange={e =>
                      handleChange("volumeNumber", e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    min={1}
                  />
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">Заголовок</span>
                  <input
                    type="text"
                    value={form.title ?? ""}
                    onChange={e => handleChange("title", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    placeholder="Опционально"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-[var(--foreground)]">Статус</span>
                  <select
                    value={form.status}
                    onChange={e => handleChange("status", e.target.value as ChapterStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    {Object.values(ChapterStatus).map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-[var(--foreground)]">Цена (если платная)</span>
                  <input
                    type="number"
                    value={form.price ?? ""}
                    onChange={e =>
                      handleChange("price", e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    min={0}
                    step={0.01}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-[var(--foreground)]">Дата релиза</span>
                  <input
                    type="datetime-local"
                    value={
                      form.releaseDate ? new Date(form.releaseDate).toISOString().slice(0, 16) : ""
                    }
                    onChange={e =>
                      handleChange("releaseDate", e.target.value ? new Date(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </label>
                <label className="flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={!!form.isPublished}
                    onChange={e => handleChange("isPublished", e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">Опубликована</span>
                </label>
                <label className="flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={!!form.isFree}
                    onChange={e => handleChange("isFree", e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">Бесплатная</span>
                </label>
              </div>
            </div>

            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Участники</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-[var(--foreground)]">Переводчик</span>
                  <input
                    type="text"
                    value={form.translator ?? ""}
                    onChange={e => handleChange("translator", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-[var(--foreground)]">Редактор</span>
                  <input
                    type="text"
                    value={form.proofreader ?? ""}
                    onChange={e => handleChange("proofreader", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">QC</span>
                  <input
                    type="text"
                    value={form.qualityCheck ?? ""}
                    onChange={e => handleChange("qualityCheck", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </label>
              </div>
            </div>

            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">Страницы главы (изображения)</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Перетащите файлы или выберите вручную</p>
                </div>
                {pages.length > 0 && (
                  <span className="text-sm text-[var(--primary)]">
                    {pages.length} файл(ов) выбрано
                  </span>
                )}
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-[var(--border)] hover:border-[var(--primary)]"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDropFiles}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pages-input"
                />
                <label htmlFor="pages-input" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-10 h-10 text-[var(--muted-foreground)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
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

                {pages.length > 0 && (
                  <div className="mt-6">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mb-4">
                      {pages.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="relative group">
                          <div className="aspect-[2/3] bg-gray-200 rounded overflow-hidden">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Страница ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeFile(index);
                            }}
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
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate">
                            {file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearFiles();
                        }}
                        className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                      >
                        Очистить все
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? "Сохранение..." : "Создать главу"}
              </button>
              <button
                type="button"
                className="px-6 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                onClick={() => router.back()}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </main>
    </AuthGuard>
  );
}
