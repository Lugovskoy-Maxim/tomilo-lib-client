"use client";

import { AuthGuard } from "@/guard/AuthGuard";
import { useState } from "react";
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

  const handleChange = (name: keyof CreateChapterDto, value: unknown) => {
    setForm(prev => ({ ...prev, [name]: value as never }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setPages(arr);
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
                    onChange={e => handleChange("chapterNumber", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    required
                    min={1}
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

            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 space-y-2">
              <p className="text-sm font-medium text-[var(--foreground)]">Страницы главы (изображения)</p>
              <p className="text-xs text-[var(--muted-foreground)]">Можно выбрать несколько файлов</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={e => handleFiles(e.target.files)}
                className="w-full text-sm text-[var(--foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:text-[var(--primary-foreground)] file:cursor-pointer"
              />
              {!!pages.length && (
                <p className="text-xs text-[var(--muted-foreground)]">Выбрано файлов: {pages.length}</p>
              )}
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
